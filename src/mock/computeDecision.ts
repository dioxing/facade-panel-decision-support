import { buildCounterfactuals } from "@/lib/counterfactual";
import { averageDqi, clamp01 } from "@/lib/dqi";
import { classifyP, computePFeasible, normalCdf } from "@/lib/probabilisticGate";
import { buildCandidateSystems } from "@/mock/candidateSystems";
import { solutionAssignments, zoneAreasM2 } from "@/mock/solutions";
import type {
  CandidateSystem,
  Counterfactual,
  DqiVector,
  ExtractedValue,
  FeasibilityCell,
  ParameterKey,
  ResourceGate,
  Solution,
  Zone,
} from "@/types/domain";

export interface DecisionModel {
  candidateSystems: CandidateSystem[];
  feasibilityCells: FeasibilityCell[];
  solutions: Solution[];
  paretoSolutions: Solution[];
  kneeSolution?: Solution;
  counterfactuals: Counterfactual[];
}

const zeroDqi: DqiVector = {
  representativeness: 0,
  reliability: 0,
  completeness: 0,
};

const fireRank: Record<string, number> = {
  C: 1,
  B: 2,
  A2: 3,
  A1: 4,
};

function getValue(
  values: ExtractedValue[],
  systemId: string,
  key: ParameterKey,
) {
  return values.find(
    (value) =>
      value.candidateSystemId === systemId &&
      value.parameterKey === key &&
      value.status !== "rejected",
  );
}

function numberValue(
  values: ExtractedValue[],
  systemId: string,
  key: ParameterKey,
  fallback: number,
) {
  const extracted = getValue(values, systemId, key);
  const value = Number(extracted?.value);

  return Number.isFinite(value) ? value : fallback;
}

function uncertainty(value: ExtractedValue | undefined, fallback: number) {
  if (!value?.uncertainty) {
    return fallback;
  }

  return Math.max(0.01, (value.uncertainty.upper - value.uncertainty.lower) / 3.92);
}

function gateById(gates: ResourceGate[], id: string) {
  return gates.find((gate) => gate.id === id);
}

function resourceGate(
  gates: ResourceGate[],
  prefix: string,
  zoneId?: string,
): ResourceGate | undefined {
  if (zoneId) {
    return gates.find((gate) => gate.id === `${prefix}-${zoneId}`);
  }

  return gates.find((gate) => gate.id === prefix);
}

function pGreaterThanOrEqual(
  systemValue: number,
  systemSigma: number,
  minimum: number,
  gateSigma = 0,
) {
  const combinedSigma = Math.sqrt(systemSigma ** 2 + gateSigma ** 2);

  if (combinedSigma === 0) {
    return systemValue >= minimum ? 1 : 0;
  }

  return normalCdf((systemValue - minimum) / combinedSigma);
}

function cellDqi(values: ExtractedValue[], systemId: string) {
  return averageDqi(
    [
      "costPerM2",
      "embodiedCarbonPerM2",
      "leadTimeWeeks",
      "uValue",
      "fireRating",
      "acousticRw",
      "maxPanelLength",
      "maxPanelWeight",
      "craneLiftCount",
      "specialisedLabour",
      "weatherSensitivity",
      "recyclability",
    ].map((key) => getValue(values, systemId, key as ParameterKey)?.dqi ?? zeroDqi),
  );
}

function computeCell(
  system: CandidateSystem,
  zone: Zone,
  values: ExtractedValue[],
  gates: ResourceGate[],
): FeasibilityCell {
  const uValue = getValue(values, system.id, "uValue");
  const fireRating = getValue(values, system.id, "fireRating");
  const acousticRw = getValue(values, system.id, "acousticRw");
  const maxPanelLength = getValue(values, system.id, "maxPanelLength");
  const maxPanelWeight = getValue(values, system.id, "maxPanelWeight");
  const leadTime = getValue(values, system.id, "leadTimeWeeks");
  const liftCount = getValue(values, system.id, "craneLiftCount");
  const labour = getValue(values, system.id, "specialisedLabour");
  const transportClass = getValue(values, system.id, "transportClass");

  const transportGate = gateById(gates, "gate-transport-limit");
  const liftGate = gateById(gates, "gate-lift-limit");
  const craneGate = resourceGate(gates, "gate-crane", zone.id);
  const laydownGate = resourceGate(gates, "gate-laydown", zone.id);
  const deliveryGate = resourceGate(gates, "gate-delivery", zone.id);
  const installGate = resourceGate(gates, "gate-install", zone.id);

  const liftCountValue = numberValue(values, system.id, "craneLiftCount", 80);
  const panelWeightValue = numberValue(values, system.id, "maxPanelWeight", 900);
  const labourIndex = numberValue(values, system.id, "specialisedLabour", 0.6);
  const lengthValue = numberValue(values, system.id, "maxPanelLength", 4.2);
  const leadTimeValue = numberValue(values, system.id, "leadTimeWeeks", 24);
  const transportPenalty = transportClass?.value === "wide-load" ? 1.2 : 1;
  const heightFactor = 1 + (zone.heightRange[1] / 160) * 0.45;

  const craneDemand =
    (liftCountValue *
      (0.11 + panelWeightValue / 18000 + labourIndex * 0.05) *
      heightFactor) /
    Math.max(4, (installGate?.currentValue ?? zone.resourceQuota.installWindowDays) / 10);
  const laydownDemand =
    panelWeightValue * 0.055 + liftCountValue * 0.65 + (transportPenalty > 1 ? 18 : 0);
  const deliveryDemand = (liftCountValue / (transportPenalty > 1 ? 9 : 12)) * heightFactor;
  const leadTimeAllowance = (installGate?.currentValue ?? zone.resourceQuota.installWindowDays) / 3;

  const checks = [
    {
      id: "gate-fire",
      p: fireRating
        ? fireRank[String(fireRating.value)] >= fireRank[zone.performanceRequirement.fireRatingMin]
          ? 0.98
          : 0.04
        : 0.42,
    },
    {
      id: "gate-thermal",
      p: uValue
        ? computePFeasible(
            Number(uValue.value),
            uncertainty(uValue, 0.08),
            zone.performanceRequirement.uValueMax,
            0.04,
          )
        : 0.42,
    },
    {
      id: "gate-acoustic",
      p: acousticRw
        ? pGreaterThanOrEqual(
            Number(acousticRw.value),
            uncertainty(acousticRw, 1.8),
            zone.performanceRequirement.acousticRwMin,
            1,
          )
        : 0.42,
    },
    {
      id: transportGate?.id ?? "gate-transport-limit",
      p: maxPanelLength
        ? computePFeasible(
            Number(maxPanelLength.value),
            uncertainty(maxPanelLength, 0.22),
            transportGate?.currentValue ?? 5.2,
            transportGate?.uncertaintyStdDev ?? 0.25,
          )
        : 0.42,
    },
    {
      id: liftGate?.id ?? "gate-lift-limit",
      p: maxPanelWeight
        ? computePFeasible(
            Number(maxPanelWeight.value),
            uncertainty(maxPanelWeight, 80),
            liftGate?.currentValue ?? 1500,
            liftGate?.uncertaintyStdDev ?? 120,
          )
        : 0.42,
    },
    {
      id: craneGate?.id ?? `gate-crane-${zone.id}`,
      p: computePFeasible(
        craneDemand,
        Math.max(0.1, craneDemand * 0.18),
        craneGate?.currentValue ?? zone.resourceQuota.craneHoursPerDay,
        craneGate?.uncertaintyStdDev ?? 0.6,
      ),
    },
    {
      id: laydownGate?.id ?? `gate-laydown-${zone.id}`,
      p: computePFeasible(
        laydownDemand,
        Math.max(6, laydownDemand * 0.16),
        laydownGate?.currentValue ?? zone.resourceQuota.laydownAreaM2,
        laydownGate?.uncertaintyStdDev ?? 12,
      ),
    },
    {
      id: deliveryGate?.id ?? `gate-delivery-${zone.id}`,
      p: liftCount
        ? computePFeasible(
            deliveryDemand,
            Math.max(0.25, deliveryDemand * 0.14),
            deliveryGate?.currentValue ?? zone.resourceQuota.deliverySlotsPerDay,
            deliveryGate?.uncertaintyStdDev ?? 0.8,
          )
        : 0.42,
    },
    {
      id: installGate?.id ?? `gate-install-${zone.id}`,
      p: leadTime
        ? computePFeasible(
            leadTimeValue,
            uncertainty(leadTime, 2.5),
            leadTimeAllowance,
            (installGate?.uncertaintyStdDev ?? 9) / 3,
          )
        : 0.42,
    },
  ];

  const pFeasible = clamp01(Math.min(...checks.map((check) => check.p)));
  const bindingGates = checks
    .filter((check) => check.p <= pFeasible + 0.04)
    .map((check) => check.id);

  return {
    systemId: system.id,
    zoneId: zone.id,
    pFeasible,
    classification: classifyP(pFeasible),
    bindingGates,
    dqiAggregate: cellDqi(values, system.id),
  };
}

function constructabilityForSystem(values: ExtractedValue[], systemId: string) {
  const lifts = numberValue(values, systemId, "craneLiftCount", 60) / 100;
  const leadTime = numberValue(values, systemId, "leadTimeWeeks", 18) / 30;
  const labour = numberValue(values, systemId, "specialisedLabour", 0.6);
  const weather = numberValue(values, systemId, "weatherSensitivity", 0.55);
  const recyclePenalty = 1 - numberValue(values, systemId, "recyclability", 0.45);
  const weight = numberValue(values, systemId, "maxPanelWeight", 1000) / 2200;

  return clamp01(
    lifts * 0.2 +
      leadTime * 0.18 +
      labour * 0.16 +
      weather * 0.16 +
      recyclePenalty * 0.12 +
      weight * 0.18,
  );
}

function buildSolutions(
  cells: FeasibilityCell[],
  values: ExtractedValue[],
): Solution[] {
  const solutions = solutionAssignments.map((assignment) => {
    const assignedCells = Object.entries(assignment.systemAssignment)
      .map(([zoneId, systemId]) =>
        cells.find((cell) => cell.zoneId === zoneId && cell.systemId === systemId),
      )
      .filter(Boolean) as FeasibilityCell[];
    const pMin = clamp01(Math.min(...assignedCells.map((cell) => cell.pFeasible)));
    const cost = Object.entries(assignment.systemAssignment).reduce(
      (sum, [zoneId, systemId]) =>
        sum + numberValue(values, systemId, "costPerM2", 800) * (zoneAreasM2[zoneId] ?? 4000),
      0,
    );
    const embodiedCarbon = Object.entries(assignment.systemAssignment).reduce(
      (sum, [zoneId, systemId]) =>
        sum +
        (numberValue(values, systemId, "embodiedCarbonPerM2", 140) *
          (zoneAreasM2[zoneId] ?? 4000)) /
          1000,
      0,
    );
    const constructabilityScore =
      Object.values(assignment.systemAssignment).reduce(
        (sum, systemId) => sum + constructabilityForSystem(values, systemId),
        0,
      ) / Object.values(assignment.systemAssignment).length;
    const bindingGates = Array.from(
      new Set(
        assignedCells
          .filter((cell) => cell.pFeasible <= pMin + 0.04)
          .flatMap((cell) => cell.bindingGates),
      ),
    );

    return {
      id: assignment.id,
      systemAssignment: assignment.systemAssignment,
      cost,
      embodiedCarbon,
      constructabilityScore,
      pMin,
      bindingGates,
      feasibilityClassification: classifyP(pMin),
      isPareto: false,
      isKnee: false,
    } satisfies Solution;
  });

  const withPareto = solutions.map((solution) => {
    const dominated = solutions.some(
      (other) =>
        other.id !== solution.id &&
        other.cost <= solution.cost &&
        other.embodiedCarbon <= solution.embodiedCarbon &&
        other.constructabilityScore <= solution.constructabilityScore &&
        other.pMin >= solution.pMin &&
        (other.cost < solution.cost ||
          other.embodiedCarbon < solution.embodiedCarbon ||
          other.constructabilityScore < solution.constructabilityScore ||
          other.pMin > solution.pMin),
    );

    return {
      ...solution,
      isPareto: !dominated,
    };
  });

  const pareto = withPareto.filter((solution) => solution.isPareto);
  const mins = {
    cost: Math.min(...pareto.map((solution) => solution.cost)),
    carbon: Math.min(...pareto.map((solution) => solution.embodiedCarbon)),
    construct: Math.min(...pareto.map((solution) => solution.constructabilityScore)),
  };
  const maxs = {
    cost: Math.max(...pareto.map((solution) => solution.cost)),
    carbon: Math.max(...pareto.map((solution) => solution.embodiedCarbon)),
    construct: Math.max(...pareto.map((solution) => solution.constructabilityScore)),
  };
  const normalize = (value: number, min: number, max: number) =>
    max === min ? 0 : (value - min) / (max - min);
  const knee = pareto
    .map((solution) => ({
      solution,
      score:
        normalize(solution.cost, mins.cost, maxs.cost) +
        normalize(solution.embodiedCarbon, mins.carbon, maxs.carbon) +
        normalize(solution.constructabilityScore, mins.construct, maxs.construct) +
        (1 - solution.pMin) * 0.5,
    }))
    .sort((a, b) => a.score - b.score)[0]?.solution;

  return withPareto.map((solution) => ({
    ...solution,
    isKnee: solution.id === knee?.id,
  }));
}

export function computeDecisionModel(input: {
  values: ExtractedValue[];
  zones: Zone[];
  resourceGates: ResourceGate[];
}): DecisionModel {
  const candidateSystems = buildCandidateSystems(input.values);
  const feasibilityCells = candidateSystems.flatMap((system) =>
    input.zones.map((zone) =>
      computeCell(system, zone, input.values, input.resourceGates),
    ),
  );
  const solutions = buildSolutions(feasibilityCells, input.values);
  const paretoSolutions = solutions.filter((solution) => solution.isPareto);
  const kneeSolution = solutions.find((solution) => solution.isKnee);
  const counterfactuals = buildCounterfactuals(solutions, input.resourceGates);

  return {
    candidateSystems,
    feasibilityCells,
    solutions,
    paretoSolutions,
    kneeSolution,
    counterfactuals,
  };
}

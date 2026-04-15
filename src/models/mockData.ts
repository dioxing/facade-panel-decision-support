import { clamp, createSeededRandom, hashString, round } from "@/lib/utils";
import { clusterParetoSolutions } from "@/models/clustering";
import {
  assignParetoRanks,
  buildInfeasibilityStats,
  identifySpecialSolutions,
  normaliseWeights,
} from "@/models/optimization";
import type {
  CandidateSolution,
  ConstructabilityWeights,
  DecisionVector,
  DesignOptionsState,
  FireClass,
  InfeasibilityStat,
  OptimisationResult,
  ProjectConstraints,
} from "@/models/types";
import { FIRE_CLASS_ORDER } from "@/models/types";

const TARGET_CANDIDATE_COUNT = 320;

const MATERIAL_META = {
  precast_concrete: {
    density: 2400,
    baseCost: 255,
    baseCarbon: 0.17,
    thermalBonus: 0.18,
    fireClass: "A1" as FireClass,
    deliveryFactor: 3.8,
    stagingFactor: 1.1,
  },
  grc: {
    density: 1750,
    baseCost: 290,
    baseCarbon: 0.13,
    thermalBonus: 0.12,
    fireClass: "A1" as FireClass,
    deliveryFactor: 5.8,
    stagingFactor: 0.9,
  },
  gfrc: {
    density: 1650,
    baseCost: 305,
    baseCarbon: 0.12,
    thermalBonus: 0.12,
    fireClass: "A1" as FireClass,
    deliveryFactor: 5.5,
    stagingFactor: 0.92,
  },
  acp: {
    density: 820,
    baseCost: 215,
    baseCarbon: 0.1,
    thermalBonus: 0.08,
    fireClass: "B" as FireClass,
    deliveryFactor: 7.6,
    stagingFactor: 0.76,
  },
  timber_clt: {
    density: 520,
    baseCost: 245,
    baseCarbon: 0.05,
    thermalBonus: 0.4,
    fireClass: "B" as FireClass,
    deliveryFactor: 5.2,
    stagingFactor: 0.88,
  },
  steel_sandwich: {
    density: 1100,
    baseCost: 230,
    baseCarbon: 0.11,
    thermalBonus: 0.16,
    fireClass: "A2" as FireClass,
    deliveryFactor: 6.4,
    stagingFactor: 0.8,
  },
};

const INSULATION_META = {
  eps: {
    density: 26,
    rPer100mm: 2.8,
    costPerMm: 0.11,
    carbonPerMm: 0.0005,
    fireClass: "C" as FireClass,
  },
  xps: {
    density: 34,
    rPer100mm: 3.1,
    costPerMm: 0.14,
    carbonPerMm: 0.0006,
    fireClass: "C" as FireClass,
  },
  mineral_wool: {
    density: 120,
    rPer100mm: 2.6,
    costPerMm: 0.12,
    carbonPerMm: 0.0004,
    fireClass: "A1" as FireClass,
  },
  pir: {
    density: 34,
    rPer100mm: 4.5,
    costPerMm: 0.19,
    carbonPerMm: 0.0008,
    fireClass: "B" as FireClass,
  },
  phenolic: {
    density: 40,
    rPer100mm: 5,
    costPerMm: 0.23,
    carbonPerMm: 0.00085,
    fireClass: "B" as FireClass,
  },
};

const SIZE_META = {
  small: {
    areaRange: [1.7, 2.8],
    aspectRange: [0.55, 1.15],
    costFactor: -10,
    carbonFactor: 0.03,
    complexity: 0.2,
  },
  medium: {
    areaRange: [3.2, 5.8],
    aspectRange: [0.58, 1.2],
    costFactor: 0,
    carbonFactor: 0.04,
    complexity: 0.35,
  },
  large: {
    areaRange: [6.4, 11.6],
    aspectRange: [0.65, 1.45],
    costFactor: 18,
    carbonFactor: 0.06,
    complexity: 0.58,
  },
  extra_large: {
    areaRange: [12.6, 18.5],
    aspectRange: [0.7, 1.6],
    costFactor: 32,
    carbonFactor: 0.08,
    complexity: 0.8,
  },
};

const CONNECTION_META = {
  cast_in_channel: {
    costFactor: 24,
    carbonFactor: 0.011,
    installPenalty: 0.19,
    varietyFactor: 0.22,
  },
  bracket_bolt: {
    costFactor: 18,
    carbonFactor: 0.009,
    installPenalty: 0.15,
    varietyFactor: 0.16,
  },
  hook_on_clip: {
    costFactor: 14,
    carbonFactor: 0.007,
    installPenalty: 0.11,
    varietyFactor: 0.1,
  },
  adhesive: {
    costFactor: 11,
    carbonFactor: 0.004,
    installPenalty: 0.08,
    varietyFactor: 0.14,
  },
};

const ZONE_META: Record<
  string,
  { envelopeArea: number; costFactor: number; workfaceFactor: number; thermalDelta: number }
> = {
  "Zone A - North": {
    envelopeArea: 880,
    costFactor: 1,
    workfaceFactor: 0.04,
    thermalDelta: 0.2,
  },
  "Zone B - East": {
    envelopeArea: 760,
    costFactor: 1.02,
    workfaceFactor: 0.05,
    thermalDelta: 0.1,
  },
  "Zone C - South": {
    envelopeArea: 900,
    costFactor: 1.03,
    workfaceFactor: 0.06,
    thermalDelta: 0.35,
  },
  "Zone D - West": {
    envelopeArea: 820,
    costFactor: 1.01,
    workfaceFactor: 0.06,
    thermalDelta: 0.15,
  },
  "Podium Interface": {
    envelopeArea: 620,
    costFactor: 1.06,
    workfaceFactor: 0.09,
    thermalDelta: 0.12,
  },
  "Atrium Envelope": {
    envelopeArea: 540,
    costFactor: 1.08,
    workfaceFactor: 0.1,
    thermalDelta: 0,
  },
};

function sampleRange(min: number, max: number, random: () => number, step?: number) {
  const raw = min + (max - min) * random();
  return step ? Math.round(raw / step) * step : raw;
}

function pick<TValue>(values: TValue[], random: () => number) {
  return values[Math.floor(random() * values.length)];
}

function worstFireClass(left: FireClass, right: FireClass) {
  return FIRE_CLASS_ORDER[left] >= FIRE_CLASS_ORDER[right] ? left : right;
}

function buildConstraintCheck(
  name: string,
  actual: number,
  limit: number,
  unit: string,
  mode: "max" | "min" | "rank" | "boolean",
  labels?: { actualLabel?: string; limitLabel?: string },
) {
  let status: "pass" | "warning" | "fail" = "pass";
  let utilisation = 0;

  if (mode === "max") {
    utilisation = limit === 0 ? 0 : actual / limit;
    status = actual > limit ? "fail" : actual >= limit * 0.92 ? "warning" : "pass";
  }

  if (mode === "min") {
    utilisation = actual === 0 ? 0 : limit / actual;
    status = actual < limit ? "fail" : actual <= limit * 1.08 ? "warning" : "pass";
  }

  if (mode === "rank") {
    utilisation = limit === 0 ? 0 : actual / limit;
    status = actual > limit ? "fail" : actual === limit ? "warning" : "pass";
  }

  if (mode === "boolean") {
    utilisation = actual;
    status = actual >= limit ? "pass" : "fail";
  }

  const operator =
    mode === "min" ? ">=" : mode === "rank" ? "meets" : mode === "boolean" ? "is" : "within";
  const actualText = labels?.actualLabel ?? `${round(actual, 2)}${unit ? ` ${unit}` : ""}`;
  const limitText = labels?.limitLabel ?? `${round(limit, 2)}${unit ? ` ${unit}` : ""}`;

  return {
    name,
    status,
    actual,
    limit,
    unit,
    utilisation,
    mode,
    message:
      mode === "boolean"
        ? `${name} ${actual >= limit ? "is compatible" : "is not compatible"}`
        : `${name} — ${actualText} ${operator} ${limitText}`,
    actualLabel: labels?.actualLabel,
    limitLabel: labels?.limitLabel,
  };
}

function generateDecisionVectors(
  constraints: ProjectConstraints,
  options: DesignOptionsState,
) {
  const seed = hashString(JSON.stringify({ zone: constraints.facadeZone, options }));
  const random = createSeededRandom(seed);
  const decisions: DecisionVector[] = [];
  const signatures = new Set<string>();

  while (decisions.length < TARGET_CANDIDATE_COUNT && signatures.size < 8000) {
    const decision: DecisionVector = {
      materialType: pick(options.materialTypes, random),
      insulationType: pick(options.insulationTypes, random),
      panelThickness: sampleRange(
        options.panelThicknessRange[0],
        options.panelThicknessRange[1],
        random,
        10,
      ),
      panelSizeCategory: pick(options.panelSizeCategories, random),
      connectionType: pick(options.connectionTypes, random),
      standardisationLevel: pick(options.standardisationLevels, random),
    };

    const signature = JSON.stringify(decision);
    if (signatures.has(signature)) {
      continue;
    }

    signatures.add(signature);
    decisions.push(decision);
  }

  return decisions;
}

function evaluateCandidate(
  decision: DecisionVector,
  index: number,
  constraints: ProjectConstraints,
  weights: ConstructabilityWeights,
  installationUnitTimeMultiplier = 1,
): CandidateSolution {
  const seed = hashString(`${index}-${JSON.stringify(decision)}`);
  const random = createSeededRandom(seed);
  const material = MATERIAL_META[decision.materialType];
  const insulation = INSULATION_META[decision.insulationType];
  const size = SIZE_META[decision.panelSizeCategory];
  const connection = CONNECTION_META[decision.connectionType];
  const zone = ZONE_META[constraints.facadeZone] ?? ZONE_META["Zone A - North"];

  const area = sampleRange(size.areaRange[0], size.areaRange[1], random);
  const aspect = sampleRange(size.aspectRange[0], size.aspectRange[1], random);
  const width = round(Math.sqrt(area * aspect), 2);
  const height = round(area / width, 2);
  const maxDimension = Math.max(width, height);
  const zoneArea = round(zone.envelopeArea * (0.94 + random() * 0.12), 0);
  const panelCount = Math.max(18, Math.round(zoneArea / area));
  const insulationThickness = clamp(
    Math.round((decision.panelThickness * (0.28 + random() * 0.16)) / 10) * 10,
    40,
    180,
  );
  const weight = round(
    area * (decision.panelThickness / 1000) * material.density +
      area * (insulationThickness / 1000) * insulation.density,
    0,
  );
  const thermalR = round(
    insulation.rPer100mm * (insulationThickness / 100) +
      material.thermalBonus +
      zone.thermalDelta,
    2,
  );
  const fireClass = worstFireClass(material.fireClass, insulation.fireClass);
  const panelsInstalledPerDay = round(
    clamp(
      17 +
        decision.standardisationLevel * 2.8 -
        size.complexity * 8 -
        connection.installPenalty * 10 +
        random() * 2.6,
      6,
      28,
    ),
    1,
  );
  const installTimePerPanel =
    (0.12 +
      area * 0.02 +
      weight / 9000 +
      connection.installPenalty * 0.65 +
      (6 - decision.standardisationLevel) * 0.03) *
    installationUnitTimeMultiplier;
  const dailyCraneHours = round(panelsInstalledPerDay * installTimePerPanel, 2);
  const dailyTrips = round(
    panelsInstalledPerDay / material.deliveryFactor +
      size.complexity * 0.6 +
      (decision.standardisationLevel < 3 ? 0.5 : 0),
    1,
  );
  const laydownDemand = round(
    area * (panelsInstalledPerDay * 0.72 + 3) * material.stagingFactor,
    0,
  );
  const standardisationPercent = Math.round(
    clamp(100 - ((6 - decision.standardisationLevel) / 5) * 58 - size.complexity * 12, 48, 96),
  );

  const panelTypeCount = Math.round(
    clamp(
      1.8 +
        (6 - decision.standardisationLevel) * 0.95 +
        size.complexity * 3 +
        connection.varietyFactor * 3 +
        random() * 1.3,
      2,
      9,
    ),
  );

  const proxies = {
    panelTypeVariety: round(clamp((panelTypeCount - 2) / 7, 0, 1), 3),
    dimensionalDispersion: round(
      clamp(
        0.12 +
          size.complexity * 0.4 +
          (6 - decision.standardisationLevel) * 0.07 +
          random() * 0.08,
        0,
        1,
      ),
      3,
    ),
    connectionVariety: round(
      clamp(
        0.1 +
          connection.varietyFactor * 1.25 +
          (decision.materialType === "precast_concrete" ? 0.08 : 0) +
          (6 - decision.standardisationLevel) * 0.04,
        0,
        1,
      ),
      3,
    ),
    liftingInstallTime: round(
      clamp(dailyCraneHours / (constraints.craneTimeBudget * 1.15), 0, 1),
      3,
    ),
    logisticsPressure: round(
      clamp(dailyTrips / (constraints.deliveryBookingCapacity * 1.15), 0, 1),
      3,
    ),
    laydownFootprint: round(
      clamp(laydownDemand / (constraints.laydownArea * 1.15), 0, 1),
      3,
    ),
    workfaceInteraction: round(
      clamp(
        0.18 +
          zone.workfaceFactor +
          size.complexity * 0.26 +
          connection.installPenalty * 0.4 +
          (6 - decision.standardisationLevel) * 0.05 +
          random() * 0.08,
        0,
        1,
      ),
      3,
    ),
  };

  const normalizedWeights = normaliseWeights(weights);
  const constructability = round(
    proxies.panelTypeVariety * normalizedWeights.panelTypeVariety +
      proxies.dimensionalDispersion * normalizedWeights.dimensionalDispersion +
      proxies.connectionVariety * normalizedWeights.connectionVariety +
      proxies.liftingInstallTime * normalizedWeights.liftingInstallTime +
      proxies.logisticsPressure * normalizedWeights.logisticsPressure +
      proxies.laydownFootprint * normalizedWeights.laydownFootprint +
      proxies.workfaceInteraction * normalizedWeights.workfaceInteraction,
    3,
  );

  const cost = Math.round(
    zoneArea *
      (material.baseCost +
        decision.panelThickness * 0.42 +
        insulationThickness * insulation.costPerMm +
        connection.costFactor +
        size.costFactor -
        decision.standardisationLevel * 7 +
        constructability * 22 +
        random() * 8) *
      zone.costFactor,
  );

  const embodiedCarbon = round(
    (zoneArea *
      (material.baseCarbon +
        insulationThickness * insulation.carbonPerMm +
        connection.carbonFactor +
        size.carbonFactor -
        decision.standardisationLevel * 0.003 +
        random() * 0.015)) /
      1.6,
    1,
  );

  const compatibilityOkay =
    !(
      decision.connectionType === "adhesive" &&
      (decision.panelSizeCategory === "large" ||
        decision.panelSizeCategory === "extra_large" ||
        weight > 1800 ||
        decision.materialType === "precast_concrete")
    ) &&
    !(
      decision.connectionType === "hook_on_clip" &&
      decision.materialType === "timber_clt" &&
      decision.panelSizeCategory === "extra_large"
    );

  const checks = [
    buildConstraintCheck(
      "Transport dimension",
      maxDimension,
      constraints.maxPanelDimension,
      "m",
      "max",
    ),
    buildConstraintCheck(
      "Lifting limit",
      weight,
      constraints.maxPanelWeight,
      "kg",
      "max",
    ),
    buildConstraintCheck(
      "Crane budget",
      dailyCraneHours,
      constraints.craneTimeBudget,
      "hr/day",
      "max",
    ),
    buildConstraintCheck(
      "Delivery booking",
      dailyTrips,
      constraints.deliveryBookingCapacity,
      "trips/day",
      "max",
    ),
    buildConstraintCheck(
      "Laydown area",
      laydownDemand,
      constraints.laydownArea,
      "m2",
      "max",
    ),
    buildConstraintCheck(
      "Thermal performance",
      thermalR,
      constraints.minThermalR,
      "m2K/W",
      "min",
    ),
    buildConstraintCheck(
      "Fire classification",
      FIRE_CLASS_ORDER[fireClass],
      FIRE_CLASS_ORDER[constraints.fireClass],
      "",
      "rank",
      {
        actualLabel: fireClass,
        limitLabel: constraints.fireClass,
      },
    ),
    buildConstraintCheck(
      "Material compatibility",
      compatibilityOkay ? 1 : 0,
      1,
      "",
      "boolean",
    ),
  ];

  const feasible = checks.every((check) => check.status !== "fail");

  return {
    id: `SOL-${String(index + 1).padStart(3, "0")}`,
    decision,
    objectives: {
      cost,
      embodiedCarbon,
      constructability,
    },
    proxies,
    diagnostics: {
      nonStandardRatio: round(100 - standardisationPercent, 1),
      liftCountIntensity: panelCount,
    },
    constraints: checks,
    feasible,
    paretoRank: feasible ? 0 : -1,
    panelMetrics: {
      width,
      height,
      area: round(area, 2),
      weight,
      maxDimension: round(maxDimension, 2),
      thermalR,
      fireClass,
      insulationThickness,
      panelCount,
      panelsInstalledPerDay,
      dailyCraneHours,
      dailyTrips,
      laydownDemand,
      standardisationPercent,
    },
  };
}

export function generateOptimisationResult(
  constraints: ProjectConstraints,
  options: DesignOptionsState,
  weights: ConstructabilityWeights,
  scenario?: { installationUnitTimeMultiplier?: number },
): OptimisationResult {
  const decisions = generateDecisionVectors(constraints, options);
  const candidates = decisions.map((decision, index) =>
    evaluateCandidate(
      decision,
      index,
      constraints,
      weights,
      scenario?.installationUnitTimeMultiplier ?? 1,
    ),
  );

  const feasible = candidates.filter((candidate) => candidate.feasible);
  const infeasible = candidates.filter((candidate) => !candidate.feasible);
  const rankedFeasible = assignParetoRanks(feasible, true);
  const paretoFront = rankedFeasible.filter((candidate) => candidate.paretoRank === 0);
  const clusteredPareto = clusterParetoSolutions(paretoFront, 4);
  const highlights = identifySpecialSolutions(clusteredPareto.solutions);
  const clusterMap = new Map(
    clusteredPareto.solutions.map((solution) => [solution.id, solution.cluster]),
  );
  const rankMap = new Map(rankedFeasible.map((solution) => [solution.id, solution.paretoRank]));

  const feasibleSolutions = feasible
    .map((solution) => ({
      ...solution,
      paretoRank: rankMap.get(solution.id) ?? solution.paretoRank,
      cluster: clusterMap.get(solution.id),
      label: highlights.get(solution.id),
    }))
    .sort((left, right) => {
      if (left.paretoRank !== right.paretoRank) {
        return left.paretoRank - right.paretoRank;
      }

      return left.objectives.cost - right.objectives.cost;
    });

  const allCandidates = candidates
    .map((candidate) => {
      const feasibleVersion = feasibleSolutions.find((solution) => solution.id === candidate.id);
      return feasibleVersion ?? candidate;
    })
    .sort((left, right) => left.id.localeCompare(right.id));

  const baselineParetoFront = assignParetoRanks(candidates, false)
    .filter((candidate) => candidate.paretoRank === 0)
    .sort((left, right) => left.objectives.cost - right.objectives.cost);

  const infeasibilityStats: InfeasibilityStat[] = buildInfeasibilityStats(
    infeasible,
    candidates.length,
  );

  return {
    candidates: allCandidates,
    feasibleSolutions,
    infeasibleSolutions: infeasible,
    paretoFront: feasibleSolutions.filter((solution) => solution.paretoRank === 0),
    baselineParetoFront,
    clusters: clusteredPareto.clusters,
    infeasibilityStats,
    totalCandidates: candidates.length,
    excludedCount: infeasible.length,
  };
}

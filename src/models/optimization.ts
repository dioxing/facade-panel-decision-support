import type {
  CandidateSolution,
  ConstructabilityWeights,
  InfeasibilityStat,
  ObjectiveValues,
  SpecialLabel,
} from "@/models/types";
import { clamp } from "@/lib/utils";

export function normaliseWeights(weights: ConstructabilityWeights) {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);

  if (total === 0) {
    const fallback = 1 / Object.keys(weights).length;
    return {
      panelTypeVariety: fallback,
      dimensionalDispersion: fallback,
      connectionVariety: fallback,
      liftingInstallTime: fallback,
      logisticsPressure: fallback,
      laydownFootprint: fallback,
      workfaceInteraction: fallback,
    };
  }

  return {
    panelTypeVariety: weights.panelTypeVariety / total,
    dimensionalDispersion: weights.dimensionalDispersion / total,
    connectionVariety: weights.connectionVariety / total,
    liftingInstallTime: weights.liftingInstallTime / total,
    logisticsPressure: weights.logisticsPressure / total,
    laydownFootprint: weights.laydownFootprint / total,
    workfaceInteraction: weights.workfaceInteraction / total,
  };
}

function dominates(
  left: ObjectiveValues,
  right: ObjectiveValues,
  includeConstructability: boolean,
) {
  const dimensions = includeConstructability
    ? [
        left.cost <= right.cost,
        left.embodiedCarbon <= right.embodiedCarbon,
        left.constructability <= right.constructability,
      ]
    : [left.cost <= right.cost, left.embodiedCarbon <= right.embodiedCarbon];

  const strict = includeConstructability
    ? [
        left.cost < right.cost,
        left.embodiedCarbon < right.embodiedCarbon,
        left.constructability < right.constructability,
      ]
    : [left.cost < right.cost, left.embodiedCarbon < right.embodiedCarbon];

  return dimensions.every(Boolean) && strict.some(Boolean);
}

export function assignParetoRanks(
  solutions: CandidateSolution[],
  includeConstructability = true,
) {
  const ranked = solutions.map((solution) => ({ ...solution, paretoRank: -1 }));
  let remaining = ranked.map((solution) => solution.id);
  let rank = 0;

  while (remaining.length > 0) {
    const front: string[] = [];

    for (const candidateId of remaining) {
      const candidate = ranked.find((solution) => solution.id === candidateId);

      if (!candidate) {
        continue;
      }

      const dominated = remaining.some((otherId) => {
        if (candidateId === otherId) {
          return false;
        }

        const other = ranked.find((solution) => solution.id === otherId);
        return other
          ? dominates(other.objectives, candidate.objectives, includeConstructability)
          : false;
      });

      if (!dominated) {
        front.push(candidateId);
      }
    }

    if (!front.length) {
      break;
    }

    for (const candidateId of front) {
      const index = ranked.findIndex((solution) => solution.id === candidateId);
      if (index >= 0) {
        ranked[index] = {
          ...ranked[index],
          paretoRank: rank,
        };
      }
    }

    remaining = remaining.filter((candidateId) => !front.includes(candidateId));
    rank += 1;
  }

  return ranked.sort((left, right) => {
    if (left.paretoRank !== right.paretoRank) {
      return left.paretoRank - right.paretoRank;
    }

    return left.objectives.cost - right.objectives.cost;
  });
}

function normalize(value: number, min: number, max: number) {
  if (max === min) {
    return 0;
  }

  return clamp((value - min) / (max - min), 0, 1);
}

export function identifySpecialSolutions(solutions: CandidateSolution[]) {
  if (!solutions.length) {
    return new Map<string, SpecialLabel>();
  }

  const costMin = Math.min(...solutions.map((solution) => solution.objectives.cost));
  const costMax = Math.max(...solutions.map((solution) => solution.objectives.cost));
  const carbonMin = Math.min(
    ...solutions.map((solution) => solution.objectives.embodiedCarbon),
  );
  const carbonMax = Math.max(
    ...solutions.map((solution) => solution.objectives.embodiedCarbon),
  );
  const constructabilityMin = Math.min(
    ...solutions.map((solution) => solution.objectives.constructability),
  );
  const constructabilityMax = Math.max(
    ...solutions.map((solution) => solution.objectives.constructability),
  );

  const kneePoint = [...solutions].sort((left, right) => {
    const leftDistance = Math.sqrt(
      normalize(left.objectives.cost, costMin, costMax) ** 2 +
        normalize(left.objectives.embodiedCarbon, carbonMin, carbonMax) ** 2 +
        normalize(
          left.objectives.constructability,
          constructabilityMin,
          constructabilityMax,
        ) ** 2,
    );
    const rightDistance = Math.sqrt(
      normalize(right.objectives.cost, costMin, costMax) ** 2 +
        normalize(right.objectives.embodiedCarbon, carbonMin, carbonMax) ** 2 +
        normalize(
          right.objectives.constructability,
          constructabilityMin,
          constructabilityMax,
        ) ** 2,
    );

    return leftDistance - rightDistance;
  })[0];
  const lowCost = [...solutions].sort(
    (left, right) => left.objectives.cost - right.objectives.cost,
  )[0];
  const lowCarbon = [...solutions].sort(
    (left, right) => left.objectives.embodiedCarbon - right.objectives.embodiedCarbon,
  )[0];
  const highBuildability = [...solutions].sort(
    (left, right) =>
      left.objectives.constructability - right.objectives.constructability,
  )[0];

  return new Map<string, SpecialLabel>([
    [kneePoint.id, "knee_point"],
    [lowCost.id, "low_cost"],
    [lowCarbon.id, "low_carbon"],
    [highBuildability.id, "high_buildability"],
  ]);
}

export function buildInfeasibilityStats(
  infeasibleSolutions: CandidateSolution[],
  totalCandidates: number,
): InfeasibilityStat[] {
  const counts = new Map<string, number>();

  for (const solution of infeasibleSolutions) {
    for (const check of solution.constraints.filter((constraint) => constraint.status === "fail")) {
      counts.set(check.name, (counts.get(check.name) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      ratio: totalCandidates ? count / totalCandidates : 0,
    }))
    .sort((left, right) => right.count - left.count);
}

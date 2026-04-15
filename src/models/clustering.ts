import { average } from "@/lib/utils";
import type {
  CandidateCluster,
  CandidateSolution,
  ClusterSummary,
  MaterialType,
} from "@/models/types";

interface VectorizedSolution {
  solution: CandidateSolution;
  values: [number, number, number, number];
}

function normalize(value: number, min: number, max: number) {
  if (max === min) {
    return 0;
  }

  return (value - min) / (max - min);
}

function distance(left: number[], right: number[]) {
  return Math.sqrt(
    left.reduce((sum, value, index) => sum + (value - right[index]) ** 2, 0),
  );
}

function describeCluster(cluster: CandidateCluster) {
  switch (cluster) {
    case "high_standardisation":
      return {
        title: "Cluster A: High standardisation",
        description:
          "Few panel types, low logistics pressure, and disciplined repetition. Best for constrained staging conditions.",
        accent: "border-blue-200 bg-blue-50/70",
      };
    case "low_carbon":
      return {
        title: "Cluster B: Low carbon",
        description:
          "Carbon-lean systems with more geometric or process complexity. Better suited to relaxed site logistics.",
        accent: "border-emerald-200 bg-emerald-50/70",
      };
    case "low_cost":
      return {
        title: "Cluster C: Low cost",
        description:
          "Budget-led families with efficient material choices and large repeatable panels.",
        accent: "border-amber-200 bg-amber-50/70",
      };
    case "balanced":
    default:
      return {
        title: "Cluster D: Balanced",
        description:
          "Even trade-offs across cost, carbon, and buildability. A practical shortlist for general project conditions.",
        accent: "border-cyan-200 bg-cyan-50/70",
      };
  }
}

function assignSemanticNames(groups: VectorizedSolution[][]) {
  const remaining = groups.map((group, index) => ({ group, index }));
  const mapping = new Map<number, CandidateCluster>();

  const pick = (
    metric: (group: VectorizedSolution[]) => number,
    cluster: CandidateCluster,
  ) => {
    const sorted = [...remaining].sort((left, right) => metric(left.group) - metric(right.group));
    const chosen = sorted[0];

    if (!chosen) {
      return;
    }

    mapping.set(chosen.index, cluster);
    const idx = remaining.findIndex((item) => item.index === chosen.index);
    if (idx >= 0) {
      remaining.splice(idx, 1);
    }
  };

  pick(
    (group) => -average(group.map((item) => item.solution.decision.standardisationLevel)),
    "high_standardisation",
  );
  pick(
    (group) => average(group.map((item) => item.solution.objectives.embodiedCarbon)),
    "low_carbon",
  );
  pick(
    (group) => average(group.map((item) => item.solution.objectives.cost)),
    "low_cost",
  );

  for (const item of remaining) {
    mapping.set(item.index, "balanced");
  }

  return mapping;
}

export function clusterParetoSolutions(
  paretoSolutions: CandidateSolution[],
  requestedClusters = 4,
) {
  if (!paretoSolutions.length) {
    return {
      solutions: paretoSolutions,
      clusters: [] as ClusterSummary[],
    };
  }

  const costValues = paretoSolutions.map((solution) => solution.objectives.cost);
  const carbonValues = paretoSolutions.map((solution) => solution.objectives.embodiedCarbon);
  const buildabilityValues = paretoSolutions.map(
    (solution) => solution.objectives.constructability,
  );
  const standardisationValues = paretoSolutions.map(
    (solution) => solution.decision.standardisationLevel,
  );

  const vectorized: VectorizedSolution[] = paretoSolutions.map((solution) => ({
    solution,
    values: [
      normalize(
        solution.objectives.cost,
        Math.min(...costValues),
        Math.max(...costValues),
      ),
      normalize(
        solution.objectives.embodiedCarbon,
        Math.min(...carbonValues),
        Math.max(...carbonValues),
      ),
      normalize(
        solution.objectives.constructability,
        Math.min(...buildabilityValues),
        Math.max(...buildabilityValues),
      ),
      normalize(
        solution.decision.standardisationLevel,
        Math.min(...standardisationValues),
        Math.max(...standardisationValues),
      ),
    ],
  }));

  const clusterCount = Math.max(1, Math.min(requestedClusters, vectorized.length));
  let centroids = Array.from({ length: clusterCount }, (_, index) => {
    const sampleIndex = Math.floor((index * vectorized.length) / clusterCount);
    return [...vectorized[sampleIndex].values];
  });
  let grouped = Array.from({ length: clusterCount }, () => [] as VectorizedSolution[]);

  for (let iteration = 0; iteration < 10; iteration += 1) {
    grouped = Array.from({ length: clusterCount }, () => [] as VectorizedSolution[]);

    for (const item of vectorized) {
      const nearestIndex = centroids.reduce(
        (bestIndex, centroid, index) =>
          distance(item.values, centroid) < distance(item.values, centroids[bestIndex])
            ? index
            : bestIndex,
        0,
      );

      grouped[nearestIndex].push(item);
    }

    centroids = grouped.map((group, index) => {
      if (!group.length) {
        return centroids[index];
      }

      return [0, 1, 2, 3].map((dimension) =>
        average(group.map((item) => item.values[dimension])),
      );
    });
  }

  const semanticNames = assignSemanticNames(grouped);
  const clusterAssignments = new Map<string, CandidateCluster>();
  const summaries: ClusterSummary[] = [];

  grouped.forEach((group, index) => {
    if (!group.length) {
      return;
    }

    const clusterId = semanticNames.get(index) ?? "balanced";

    for (const item of group) {
      clusterAssignments.set(item.solution.id, clusterId);
    }

    const materialTotals = new Map<MaterialType, number>();
    for (const item of group) {
      materialTotals.set(
        item.solution.decision.materialType,
        (materialTotals.get(item.solution.decision.materialType) ?? 0) + 1,
      );
    }

    const descriptor = describeCluster(clusterId);
    summaries.push({
      id: clusterId,
      title: descriptor.title,
      description: descriptor.description,
      averageCost: average(group.map((item) => item.solution.objectives.cost)),
      averageCarbon: average(
        group.map((item) => item.solution.objectives.embodiedCarbon),
      ),
      averageConstructability: average(
        group.map((item) => item.solution.objectives.constructability),
      ),
      count: group.length,
      materials: [...materialTotals.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3)
        .map(([material]) => material),
      accent: descriptor.accent,
    });
  });

  return {
    solutions: paretoSolutions.map((solution) => ({
      ...solution,
      cluster: clusterAssignments.get(solution.id),
    })),
    clusters: summaries.sort((left, right) => left.title.localeCompare(right.title)),
  };
}

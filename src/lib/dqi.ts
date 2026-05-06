import type { DqiVector } from "@/types/domain";

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function averageDqi(vectors: DqiVector[]): DqiVector {
  if (!vectors.length) {
    return {
      representativeness: 0,
      reliability: 0,
      completeness: 0,
    };
  }

  return {
    representativeness:
      vectors.reduce((sum, item) => sum + item.representativeness, 0) /
      vectors.length,
    reliability:
      vectors.reduce((sum, item) => sum + item.reliability, 0) /
      vectors.length,
    completeness:
      vectors.reduce((sum, item) => sum + item.completeness, 0) /
      vectors.length,
  };
}

export function dqiTone(value: number): "low" | "medium" | "high" {
  if (value < 0.4) {
    return "low";
  }

  if (value < 0.7) {
    return "medium";
  }

  return "high";
}

export function dqiSummary(dqi: DqiVector) {
  return `R ${dqi.representativeness.toFixed(2)} / Rel ${dqi.reliability.toFixed(
    2,
  )} / C ${dqi.completeness.toFixed(2)}`;
}

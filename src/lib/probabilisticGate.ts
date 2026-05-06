export function erf(value: number) {
  const sign = value >= 0 ? 1 : -1;
  const x = Math.abs(value);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) *
      t *
      Math.exp(-x * x));

  return sign * y;
}

export function normalCdf(value: number) {
  return 0.5 * (1 + erf(value / Math.sqrt(2)));
}

export function computePFeasible(
  systemValue: number,
  systemUncertainty: number,
  gateLimit: number,
  gateUncertainty: number,
): number {
  const combinedSigma = Math.sqrt(systemUncertainty ** 2 + gateUncertainty ** 2);

  if (combinedSigma === 0) {
    return systemValue <= gateLimit ? 1 : 0;
  }

  return normalCdf((gateLimit - systemValue) / combinedSigma);
}

export function classifyP(p: number): "feasible" | "conditional" | "infeasible" {
  if (p >= 0.85) {
    return "feasible";
  }

  if (p >= 0.5) {
    return "conditional";
  }

  return "infeasible";
}

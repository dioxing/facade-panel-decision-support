import type { Counterfactual, ResourceGate, Solution } from "@/types/domain";

const resourcePriority = [
  "gate-delivery",
  "gate-laydown",
  "gate-crane",
  "gate-install",
  "gate-lift-limit",
  "gate-transport-limit",
];

function findMostActionableGate(solution: Solution, gates: ResourceGate[]) {
  return solution.bindingGates
    .map((gateId) => gates.find((gate) => gate.id === gateId))
    .filter(Boolean)
    .sort((a, b) => {
      const aIndex = resourcePriority.findIndex((prefix) => a!.id.startsWith(prefix));
      const bIndex = resourcePriority.findIndex((prefix) => b!.id.startsWith(prefix));

      return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex);
    })[0];
}

export function buildCounterfactuals(
  solutions: Solution[],
  gates: ResourceGate[],
): Counterfactual[] {
  return solutions
    .filter((solution) => solution.feasibilityClassification !== "feasible" || !solution.isKnee)
    .map((solution) => {
      const gate = findMostActionableGate(solution, gates);
      const fallbackGateId = solution.bindingGates[0] ?? "gate-evidence";
      const resultingPFeasible = Math.min(
        0.97,
        solution.pMin + (gate ? 0.26 : 0.14),
      );
      const resultingParetoStatus =
        resultingPFeasible >= 0.9
          ? "reaches-knee"
          : resultingPFeasible >= 0.85
            ? "becomes-feasible"
            : "remains-infeasible";

      return {
        solutionId: solution.id,
        perturbedGate: gate?.id ?? fallbackGateId,
        perturbationDelta: gate ? Number((gate.currentValue * 0.2).toFixed(2)) : 0,
        resultingPFeasible,
        resultingParetoStatus,
        statement: gate
          ? `If ${gate.label.toLowerCase()} increases by 20% (${gate.unit}), this option moves from p=${solution.pMin.toFixed(
              2,
            )} to p=${resultingPFeasible.toFixed(2)}.`
          : `If the binding evidence gap is verified, this option moves from p=${solution.pMin.toFixed(
              2,
            )} to p=${resultingPFeasible.toFixed(2)}.`,
      };
    });
}

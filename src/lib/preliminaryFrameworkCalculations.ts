import type {
  BurdenDimension,
  FacadeOption,
  L1Status,
  OptionScores,
  ScenarioSensitivity,
} from "@/types/researchFramework";

const l1Rank: Record<L1Status, number> = {
  pass: 4,
  "conditional pass": 3,
  hold: 2,
  reject: 1,
};

const sensitivityScore: Record<ScenarioSensitivity[keyof ScenarioSensitivity], number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function mean(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function dimensionMean(option: FacadeOption, dimension: BurdenDimension) {
  return mean(Object.values(option.constructabilityIndicators[dimension]));
}

export function calculateF1(option: FacadeOption) {
  if (typeof option.costNZD === "number") {
    return {
      value: option.costNZD,
      unit: "NZD/m2 facade" as const,
    };
  }

  return {
    value: option.costIndex ?? 1,
    unit: "cost index" as const,
  };
}

export function calculateF2(option: FacadeOption) {
  return option.carbonA1A3 + option.carbonA4 + option.carbonA5;
}

export function calculateF3(option: FacadeOption) {
  const d1 = dimensionMean(option, "D1");
  const d2 = dimensionMean(option, "D2");
  const d3 = dimensionMean(option, "D3");

  return {
    d1,
    d2,
    d3,
    f3: (d1 + d2 + d3) / 3,
  };
}

export function calculateL1Overall(option: FacadeOption): L1Status {
  const statuses = Object.values(option.l1Evidence);

  if (statuses.includes("reject")) {
    return "reject";
  }

  if (statuses.includes("hold")) {
    return "hold";
  }

  if (statuses.includes("conditional pass")) {
    return "conditional pass";
  }

  return "pass";
}

export function calculateRobustness(option: FacadeOption) {
  const values = Object.values(option.scenarioSensitivity) as Array<
    ScenarioSensitivity[keyof ScenarioSensitivity]
  >;
  const total = values.reduce((sum, value) => sum + sensitivityScore[value], 0);
  const highCount = values.filter((value) => value === "high").length;

  if (highCount >= 3 || total >= 8) {
    return "fragile" as const;
  }

  if (highCount >= 1 || total >= 4) {
    return "moderately sensitive" as const;
  }

  return "robust" as const;
}

export function l3Flags(option: FacadeOption) {
  return Object.entries(option.scenarioSensitivity)
    .filter(([, value]) => value === "high")
    .map(([key]) =>
      key
        .replace(/([A-Z])/g, " $1")
        .toLowerCase()
        .replace("access", "access")
        .trim()
        .concat("-sensitive"),
    );
}

function normalise(value: number, min: number, max: number) {
  if (max === min) {
    return 0;
  }

  return (value - min) / (max - min);
}

function normaliseCostForComparison(scores: Array<{ f1: number; f1Unit: string }>) {
  const nzdValues = scores.filter((score) => score.f1Unit === "NZD/m2 facade").map((score) => score.f1);
  const indexValues = scores.filter((score) => score.f1Unit === "cost index").map((score) => score.f1);
  const nzdMin = Math.min(...nzdValues);
  const nzdMax = Math.max(...nzdValues);
  const indexMin = Math.min(...indexValues);
  const indexMax = Math.max(...indexValues);

  return (score: { f1: number; f1Unit: string }) => {
    if (score.f1Unit === "cost index") {
      return normalise(score.f1, indexMin, indexMax || indexMin + 1);
    }

    return normalise(score.f1, nzdMin, nzdMax);
  };
}

export function calculateOptionScores(options: FacadeOption[]): OptionScores[] {
  const baseScores = options.map((option) => {
    const f1 = calculateF1(option);
    const f2 = calculateF2(option);
    const f3 = calculateF3(option);
    const l1Overall = calculateL1Overall(option);
    const robustness = calculateRobustness(option);

    return {
      option,
      f1: f1.value,
      f1Unit: f1.unit,
      f2,
      d1: f3.d1,
      d2: f3.d2,
      d3: f3.d3,
      f3: f3.f3,
      l1Overall,
      robustness,
      l3Flags: l3Flags(option),
      m1Score: 0,
      m3Decision: "held" as OptionScores["m3Decision"],
      m3Explanation: "",
    };
  });

  const costNorm = normaliseCostForComparison(baseScores);
  const carbonMin = Math.min(...baseScores.map((score) => score.f2));
  const carbonMax = Math.max(...baseScores.map((score) => score.f2));

  const scoresWithM1 = baseScores.map((score) => ({
    ...score,
    m1Score:
      0.5 * costNorm(score) +
      0.5 * normalise(score.f2, carbonMin, carbonMax),
  }));

  return scoresWithM1.map((score) => {
    if (score.l1Overall === "reject") {
      return {
        ...score,
        m3Decision: "excluded",
        m3Explanation: "Excluded because at least one L1 evidence gate is reject.",
      };
    }

    if (score.l1Overall === "hold") {
      return {
        ...score,
        m3Decision: "held",
        m3Explanation: "Held because L1 evidence requests remain unresolved before comparison should be interpreted.",
      };
    }

    if (score.robustness === "fragile") {
      return {
        ...score,
        m3Decision: "conditional",
        m3Explanation: "Comparable on L2 metrics, but L3 scenario stress testing shows fragile delivery or evidence exposure.",
      };
    }

    if (score.f3 <= 0.52 && l1Rank[score.l1Overall] >= l1Rank["conditional pass"]) {
      return {
        ...score,
        m3Decision: "selected",
        m3Explanation: "Selected for preliminary shortlist because L1 is not held and F1/F2/F3 remain explainable under L3 stress testing.",
      };
    }

    return {
      ...score,
      m3Decision: "conditional",
      m3Explanation: "Retained as conditional because the option remains plausible but has higher constructability burden or evidence requests.",
    };
  });
}

export function selectM0(scores: OptionScores[]) {
  return [...scores]
    .sort((a, b) => {
      if (a.f1Unit !== b.f1Unit) {
        return a.f1Unit === "NZD/m2 facade" ? -1 : 1;
      }

      return a.f1 - b.f1;
    })
    .slice(0, 3)
    .map((score) => score.option.id);
}

export function selectM1(scores: OptionScores[]) {
  return [...scores]
    .sort((a, b) => a.m1Score - b.m1Score)
    .slice(0, 3)
    .map((score) => score.option.id);
}

export function selectM3(scores: OptionScores[]) {
  const selected = scores
    .filter((score) => score.m3Decision === "selected")
    .sort((a, b) => a.f3 - b.f3)
    .map((score) => score.option.id);
  const conditional = scores
    .filter((score) => score.m3Decision === "conditional")
    .sort((a, b) => a.f3 - b.f3)
    .map((score) => score.option.id);

  return [...selected, ...conditional].slice(0, 3);
}

export function createValidationSummary(scores: OptionScores[]) {
  const m0 = selectM0(scores);
  const m1 = selectM1(scores);
  const m3 = selectM3(scores);
  const m0Set = new Set(m0);
  const m1Set = new Set(m1);
  const overlap = m3.filter((id) => m0Set.has(id) || m1Set.has(id));
  const held = scores.filter((score) => score.l1Overall === "hold").map((score) => score.option.id);
  const flagged = scores.filter((score) => score.robustness !== "robust").map((score) => score.option.id);

  return {
    m0,
    m1,
    m3,
    overlap,
    held,
    flagged,
    reason:
      "M3 changes the shortlist because L1 evidence holds, preliminary constructability burden, and L3 scenario sensitivity are made explicit rather than hidden inside a cost-carbon rank.",
  };
}

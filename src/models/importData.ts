import { clusterParetoSolutions } from "@/models/clustering";
import {
  assignParetoRanks,
  buildInfeasibilityStats,
  identifySpecialSolutions,
} from "@/models/optimization";
import type {
  CandidateCluster,
  CandidateRecord,
  CandidateSolution,
  ConnectionType,
  DecisionVector,
  FireClass,
  ImportedDatasetPayload,
  OptimisationResult,
  ProjectConstraints,
  SpecialLabel,
} from "@/models/types";
import {
  CONNECTION_OPTIONS,
  FIRE_CLASS_ORDER,
  INSULATION_OPTIONS,
  MATERIAL_OPTIONS,
  PANEL_SIZE_OPTIONS,
} from "@/models/types";
import { round } from "@/lib/utils";

const materialMap = buildOptionMap(MATERIAL_OPTIONS, {
  "aluminium_composite_panel": "acp",
  "aluminum_composite_panel": "acp",
  "steel_sandwich_panel": "steel_sandwich",
});
const insulationMap = buildOptionMap(INSULATION_OPTIONS, {
  "phenolic_foam": "phenolic",
});
const sizeMap = buildOptionMap(PANEL_SIZE_OPTIONS, {
  xlarge: "extra_large",
});
const connectionMap = buildOptionMap(CONNECTION_OPTIONS, {
  castinchannel: "cast_in_channel",
  "cast_in": "cast_in_channel",
  "bracket_bolt": "bracket_bolt",
  "bracket__bolt": "bracket_bolt",
  hookonclip: "hook_on_clip",
  adhesivebonded: "adhesive",
});

const fireClassValues: FireClass[] = ["A1", "A2", "B", "C"];
const clusterValues: CandidateCluster[] = [
  "high_standardisation",
  "low_carbon",
  "low_cost",
  "balanced",
];
const labelValues: SpecialLabel[] = [
  "knee_point",
  "low_cost",
  "low_carbon",
  "high_buildability",
];

const CSV_HEADERS = [
  "id",
  "materialType",
  "insulationType",
  "panelThickness",
  "panelSizeCategory",
  "connectionType",
  "standardisationLevel",
  "cost",
  "embodiedCarbon",
  "constructability",
  "panelTypeVariety",
  "dimensionalDispersion",
  "connectionVariety",
  "liftingInstallTime",
  "logisticsPressure",
  "laydownFootprint",
  "workfaceInteraction",
  "nonStandardRatio",
  "liftCountIntensity",
  "width",
  "height",
  "area",
  "weight",
  "maxDimension",
  "thermalR",
  "fireClass",
  "insulationThickness",
  "panelCount",
  "panelsInstalledPerDay",
  "dailyCraneHours",
  "dailyTrips",
  "laydownDemand",
  "standardisationPercent",
  "cluster",
  "label",
] as const;

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildOptionMap<TValue extends string>(
  options: { value: TValue; label: string; shortLabel?: string }[],
  aliases?: Record<string, TValue>,
) {
  const map = new Map<string, TValue>();

  for (const option of options) {
    map.set(normalizeKey(option.value), option.value);
    map.set(normalizeKey(option.label), option.value);
    if (option.shortLabel) {
      map.set(normalizeKey(option.shortLabel), option.value);
    }
  }

  if (aliases) {
    for (const [alias, value] of Object.entries(aliases)) {
      map.set(normalizeKey(alias), value);
    }
  }

  return map;
}

function getNestedValue(source: unknown, path: string) {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  let current: unknown = source;
  for (const segment of path.split(".")) {
    if (!current || typeof current !== "object" || !(segment in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function getCandidateValue(source: unknown, keys: string[]) {
  for (const key of keys) {
    const value = getNestedValue(source, key);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function parseNumberValue(value: unknown, label: string) {
  const numeric = typeof value === "number" ? value : Number(String(value).trim());

  if (!Number.isFinite(numeric)) {
    throw new Error(`"${label}" must be a number.`);
  }

  return numeric;
}

function parseIntegerValue(value: unknown, label: string) {
  const numeric = parseNumberValue(value, label);
  return Math.round(numeric);
}

function parseMappedValue<TValue extends string>(
  value: unknown,
  label: string,
  map: Map<string, TValue>,
) {
  const normalized = normalizeKey(String(value ?? ""));
  const mapped = map.get(normalized);

  if (!mapped) {
    throw new Error(`"${label}" has unsupported value "${String(value)}".`);
  }

  return mapped;
}

function parseFireClass(value: unknown) {
  const normalized = String(value ?? "").trim().toUpperCase() as FireClass;
  if (!fireClassValues.includes(normalized)) {
    throw new Error(`"fireClass" has unsupported value "${String(value)}".`);
  }

  return normalized;
}

function parseOptionalCluster(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalized = normalizeKey(String(value));
  return clusterValues.find((item) => normalizeKey(item) === normalized);
}

function parseOptionalLabel(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalized = normalizeKey(String(value));
  return labelValues.find((item) => normalizeKey(item) === normalized);
}

function parseDecision(source: unknown): DecisionVector {
  const standardisation = parseIntegerValue(
    getCandidateValue(source, ["decision.standardisationLevel", "standardisationLevel"]),
    "standardisationLevel",
  );

  if (![1, 2, 3, 4, 5].includes(standardisation)) {
    throw new Error('"standardisationLevel" must be between 1 and 5.');
  }

  return {
    materialType: parseMappedValue(
      getCandidateValue(source, ["decision.materialType", "materialType"]),
      "materialType",
      materialMap,
    ),
    insulationType: parseMappedValue(
      getCandidateValue(source, ["decision.insulationType", "insulationType"]),
      "insulationType",
      insulationMap,
    ),
    panelThickness: parseNumberValue(
      getCandidateValue(source, ["decision.panelThickness", "panelThickness"]),
      "panelThickness",
    ),
    panelSizeCategory: parseMappedValue(
      getCandidateValue(source, ["decision.panelSizeCategory", "panelSizeCategory"]),
      "panelSizeCategory",
      sizeMap,
    ),
    connectionType: parseMappedValue(
      getCandidateValue(source, ["decision.connectionType", "connectionType"]),
      "connectionType",
      connectionMap,
    ) as ConnectionType,
    standardisationLevel: standardisation as DecisionVector["standardisationLevel"],
  };
}

function parseCandidateRecord(source: unknown, index: number): CandidateRecord {
  const id = String(
    getCandidateValue(source, ["id"]) ?? `IMP-${String(index + 1).padStart(3, "0")}`,
  );

  return {
    id,
    decision: parseDecision(source),
    objectives: {
      cost: parseNumberValue(
        getCandidateValue(source, ["objectives.cost", "cost"]),
        "cost",
      ),
      embodiedCarbon: parseNumberValue(
        getCandidateValue(source, ["objectives.embodiedCarbon", "embodiedCarbon"]),
        "embodiedCarbon",
      ),
      constructability: parseNumberValue(
        getCandidateValue(source, ["objectives.constructability", "constructability"]),
        "constructability",
      ),
    },
    proxies: {
      panelTypeVariety: parseNumberValue(
        getCandidateValue(source, ["proxies.panelTypeVariety", "panelTypeVariety"]),
        "panelTypeVariety",
      ),
      dimensionalDispersion: parseNumberValue(
        getCandidateValue(source, ["proxies.dimensionalDispersion", "dimensionalDispersion"]),
        "dimensionalDispersion",
      ),
      connectionVariety: parseNumberValue(
        getCandidateValue(source, ["proxies.connectionVariety", "connectionVariety"]),
        "connectionVariety",
      ),
      liftingInstallTime: parseNumberValue(
        getCandidateValue(source, ["proxies.liftingInstallTime", "liftingInstallTime"]),
        "liftingInstallTime",
      ),
      logisticsPressure: parseNumberValue(
        getCandidateValue(source, ["proxies.logisticsPressure", "logisticsPressure"]),
        "logisticsPressure",
      ),
      laydownFootprint: parseNumberValue(
        getCandidateValue(source, ["proxies.laydownFootprint", "laydownFootprint"]),
        "laydownFootprint",
      ),
      workfaceInteraction: parseNumberValue(
        getCandidateValue(source, ["proxies.workfaceInteraction", "workfaceInteraction"]),
        "workfaceInteraction",
      ),
    },
    diagnostics: {
      nonStandardRatio: parseNumberValue(
        getCandidateValue(source, ["diagnostics.nonStandardRatio", "nonStandardRatio"]),
        "nonStandardRatio",
      ),
      liftCountIntensity: parseNumberValue(
        getCandidateValue(source, ["diagnostics.liftCountIntensity", "liftCountIntensity"]),
        "liftCountIntensity",
      ),
    },
    panelMetrics: {
      width: parseNumberValue(
        getCandidateValue(source, ["panelMetrics.width", "width"]),
        "width",
      ),
      height: parseNumberValue(
        getCandidateValue(source, ["panelMetrics.height", "height"]),
        "height",
      ),
      area: parseNumberValue(
        getCandidateValue(source, ["panelMetrics.area", "area"]),
        "area",
      ),
      weight: parseNumberValue(
        getCandidateValue(source, ["panelMetrics.weight", "weight"]),
        "weight",
      ),
      maxDimension: parseNumberValue(
        getCandidateValue(source, ["panelMetrics.maxDimension", "maxDimension"]),
        "maxDimension",
      ),
      thermalR: parseNumberValue(
        getCandidateValue(source, ["panelMetrics.thermalR", "thermalR"]),
        "thermalR",
      ),
      fireClass: parseFireClass(
        getCandidateValue(source, ["panelMetrics.fireClass", "fireClass"]),
      ),
      insulationThickness: parseNumberValue(
        getCandidateValue(source, ["panelMetrics.insulationThickness", "insulationThickness"]),
        "insulationThickness",
      ),
      panelCount: parseIntegerValue(
        getCandidateValue(source, ["panelMetrics.panelCount", "panelCount"]),
        "panelCount",
      ),
      panelsInstalledPerDay: parseNumberValue(
        getCandidateValue(source, ["panelMetrics.panelsInstalledPerDay", "panelsInstalledPerDay"]),
        "panelsInstalledPerDay",
      ),
      dailyCraneHours: parseNumberValue(
        getCandidateValue(source, ["panelMetrics.dailyCraneHours", "dailyCraneHours"]),
        "dailyCraneHours",
      ),
      dailyTrips: parseNumberValue(
        getCandidateValue(source, ["panelMetrics.dailyTrips", "dailyTrips"]),
        "dailyTrips",
      ),
      laydownDemand: parseNumberValue(
        getCandidateValue(source, ["panelMetrics.laydownDemand", "laydownDemand"]),
        "laydownDemand",
      ),
      standardisationPercent: parseNumberValue(
        getCandidateValue(source, ["panelMetrics.standardisationPercent", "standardisationPercent"]),
        "standardisationPercent",
      ),
    },
    cluster: parseOptionalCluster(getCandidateValue(source, ["cluster"])),
    label: parseOptionalLabel(getCandidateValue(source, ["label"])),
  };
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsvRecords(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row.");
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const missingHeaders = CSV_HEADERS.filter((header) => !headers.includes(header)).filter(
    (header) => !["cluster", "label", "id"].includes(header),
  );

  if (missingHeaders.length > 0) {
    throw new Error(`CSV is missing required columns: ${missingHeaders.join(", ")}`);
  }

  return lines.slice(1).map((line, rowIndex) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    try {
      return parseCandidateRecord(row, rowIndex);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`CSV row ${rowIndex + 2}: ${message}`);
    }
  });
}

function parseJsonDataset(text: string) {
  const parsed = JSON.parse(text) as unknown;
  let rawCandidates: unknown;
  let projectConstraints: Partial<ProjectConstraints> | undefined;

  if (Array.isArray(parsed)) {
    rawCandidates = parsed;
  } else if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).candidates)) {
    rawCandidates = (parsed as any).candidates;
    projectConstraints = (parsed as any).projectConstraints;
  } else if (
    parsed &&
    typeof parsed === "object" &&
    (parsed as any).results &&
    Array.isArray((parsed as any).results.candidates)
  ) {
    rawCandidates = (parsed as any).results.candidates;
    projectConstraints =
      (parsed as any).projectConstraints ?? (parsed as any).results.projectConstraints;
  } else {
    throw new Error('JSON must be an array of candidates or an object with a "candidates" array.');
  }

  const candidates = (rawCandidates as unknown[]).map((item, index) => {
    try {
      return parseCandidateRecord(item, index);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`JSON candidate ${index + 1}: ${message}`);
    }
  });

  return {
    candidates,
    projectConstraints,
  };
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
        : `${name} - ${actualText} ${operator} ${limitText}`,
    actualLabel: labels?.actualLabel,
    limitLabel: labels?.limitLabel,
  };
}

function isMaterialCompatible(record: CandidateRecord) {
  const { decision, panelMetrics } = record;

  return !(
    decision.connectionType === "adhesive" &&
    (decision.panelSizeCategory === "large" ||
      decision.panelSizeCategory === "extra_large" ||
      panelMetrics.weight > 1800 ||
      decision.materialType === "precast_concrete")
  ) &&
    !(
      decision.connectionType === "hook_on_clip" &&
      decision.materialType === "timber_clt" &&
      decision.panelSizeCategory === "extra_large"
    );
}

function evaluateRecord(
  record: CandidateRecord,
  constraints: ProjectConstraints,
): CandidateSolution {
  const checks = [
    buildConstraintCheck(
      "Transport dimension",
      record.panelMetrics.maxDimension,
      constraints.maxPanelDimension,
      "m",
      "max",
    ),
    buildConstraintCheck(
      "Lifting limit",
      record.panelMetrics.weight,
      constraints.maxPanelWeight,
      "kg",
      "max",
    ),
    buildConstraintCheck(
      "Crane budget",
      record.panelMetrics.dailyCraneHours,
      constraints.craneTimeBudget,
      "hr/day",
      "max",
    ),
    buildConstraintCheck(
      "Delivery booking",
      record.panelMetrics.dailyTrips,
      constraints.deliveryBookingCapacity,
      "trips/day",
      "max",
    ),
    buildConstraintCheck(
      "Laydown area",
      record.panelMetrics.laydownDemand,
      constraints.laydownArea,
      "m2",
      "max",
    ),
    buildConstraintCheck(
      "Thermal performance",
      record.panelMetrics.thermalR,
      constraints.minThermalR,
      "m2K/W",
      "min",
    ),
    buildConstraintCheck(
      "Fire classification",
      FIRE_CLASS_ORDER[record.panelMetrics.fireClass],
      FIRE_CLASS_ORDER[constraints.fireClass],
      "",
      "rank",
      {
        actualLabel: record.panelMetrics.fireClass,
        limitLabel: constraints.fireClass,
      },
    ),
    buildConstraintCheck(
      "Material compatibility",
      isMaterialCompatible(record) ? 1 : 0,
      1,
      "",
      "boolean",
    ),
  ];

  return {
    ...record,
    constraints: checks,
    feasible: checks.every((check) => check.status !== "fail"),
    paretoRank: -1,
  };
}

export function buildOptimisationResultFromRecords(
  records: CandidateRecord[],
  constraints: ProjectConstraints,
): OptimisationResult {
  const candidates = records.map((record) => evaluateRecord(record, constraints));
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
      cluster: clusterMap.get(solution.id) ?? solution.cluster,
      label: highlights.get(solution.id) ?? solution.label,
    }))
    .sort((left, right) => {
      if (left.paretoRank !== right.paretoRank) {
        return left.paretoRank - right.paretoRank;
      }

      return left.objectives.cost - right.objectives.cost;
    });

  const candidateMap = new Map(feasibleSolutions.map((candidate) => [candidate.id, candidate]));
  const allCandidates = candidates
    .map((candidate) => candidateMap.get(candidate.id) ?? candidate)
    .sort((left, right) => left.id.localeCompare(right.id));

  const baselineParetoFront = assignParetoRanks(candidates, false)
    .filter((candidate) => candidate.paretoRank === 0)
    .sort((left, right) => left.objectives.cost - right.objectives.cost);

  return {
    candidates: allCandidates,
    feasibleSolutions,
    infeasibleSolutions: infeasible,
    paretoFront: feasibleSolutions.filter((candidate) => candidate.paretoRank === 0),
    baselineParetoFront,
    clusters: clusteredPareto.clusters,
    infeasibilityStats: buildInfeasibilityStats(infeasible, candidates.length),
    totalCandidates: candidates.length,
    excludedCount: infeasible.length,
  };
}

export function parseImportedDataset(
  fileName: string,
  text: string,
): ImportedDatasetPayload {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("The selected file is empty.");
  }

  const parsed: {
    candidates: CandidateRecord[];
    projectConstraints?: Partial<ProjectConstraints>;
  } =
    fileName.toLowerCase().endsWith(".csv") ||
    (!trimmed.startsWith("{") && !trimmed.startsWith("["))
      ? { candidates: parseCsvRecords(trimmed) }
      : parseJsonDataset(trimmed);

  if (!parsed.candidates.length) {
    throw new Error("No candidate rows were found in the imported dataset.");
  }

  return {
    candidates: parsed.candidates,
    projectConstraints: parsed.projectConstraints,
    sourceLabel: fileName,
  };
}

export function candidateToRecord(candidate: CandidateSolution): CandidateRecord {
  return {
    id: candidate.id,
    decision: candidate.decision,
    objectives: candidate.objectives,
    proxies: candidate.proxies,
    diagnostics: candidate.diagnostics,
    panelMetrics: candidate.panelMetrics,
    cluster: candidate.cluster,
    label: candidate.label,
  };
}

export function serializeImportedDatasetAsJson(
  records: CandidateRecord[],
  projectConstraints?: ProjectConstraints,
) {
  return JSON.stringify(
    {
      projectConstraints,
      candidates: records,
    },
    null,
    2,
  );
}

function csvEscape(value: string | number | undefined) {
  const text = value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function serializeCandidateRecordsAsCsv(records: CandidateRecord[]) {
  const lines = [CSV_HEADERS.join(",")];

  for (const record of records) {
    const row = [
      record.id,
      record.decision.materialType,
      record.decision.insulationType,
      record.decision.panelThickness,
      record.decision.panelSizeCategory,
      record.decision.connectionType,
      record.decision.standardisationLevel,
      record.objectives.cost,
      record.objectives.embodiedCarbon,
      record.objectives.constructability,
      record.proxies.panelTypeVariety,
      record.proxies.dimensionalDispersion,
      record.proxies.connectionVariety,
      record.proxies.liftingInstallTime,
      record.proxies.logisticsPressure,
      record.proxies.laydownFootprint,
      record.proxies.workfaceInteraction,
      record.diagnostics.nonStandardRatio,
      record.diagnostics.liftCountIntensity,
      record.panelMetrics.width,
      record.panelMetrics.height,
      record.panelMetrics.area,
      record.panelMetrics.weight,
      record.panelMetrics.maxDimension,
      record.panelMetrics.thermalR,
      record.panelMetrics.fireClass,
      record.panelMetrics.insulationThickness,
      record.panelMetrics.panelCount,
      record.panelMetrics.panelsInstalledPerDay,
      record.panelMetrics.dailyCraneHours,
      record.panelMetrics.dailyTrips,
      record.panelMetrics.laydownDemand,
      record.panelMetrics.standardisationPercent,
      record.cluster,
      record.label,
    ].map(csvEscape);

    lines.push(row.join(","));
  }

  return lines.join("\n");
}

export function createCandidateCsvTemplate() {
  const example = [
    "EX-001",
    "precast_concrete",
    "pir",
    180,
    "medium",
    "cast_in_channel",
    4,
    298000,
    121.4,
    0.34,
    0.21,
    0.31,
    0.24,
    0.42,
    0.29,
    0.25,
    0.19,
    18,
    164,
    2.1,
    1.7,
    3.57,
    2840,
    2.1,
    4.2,
    "A1",
    80,
    164,
    13.5,
    5.1,
    4.6,
    132,
    82,
    "balanced",
    "",
  ].map(csvEscape);

  return `${CSV_HEADERS.join(",")}\n${example.join(",")}`;
}

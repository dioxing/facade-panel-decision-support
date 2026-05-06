import type { HardGate, ProjectContext, ResourceGate, StageDefinition, Zone } from "@/types/domain";

export const stageDefinitions: StageDefinition[] = [
  {
    id: 1,
    label: "Setup",
    description: "Define project context, facade zones, and workshop scope.",
  },
  {
    id: 2,
    label: "Evidence",
    description: "Review RAG-extracted values and verify the evidence trail.",
  },
  {
    id: 3,
    label: "Candidates",
    description: "Screen facade typologies before gates are tuned.",
  },
  {
    id: 4,
    label: "Gates",
    description: "Calibrate hard and resource gates with uncertainty.",
  },
  {
    id: 5,
    label: "Decide & Audit",
    description: "Compare Pareto, counterfactual, and audit outputs.",
  },
];

export const defaultProjectContext: ProjectContext = {
  projectName: "EG-Facade early-stage facade strategy",
  location: "Auckland CBD, New Zealand",
  climateZone: "coastal",
  buildingTypology: "mixed-use",
  totalHeight: 160,
  storeyCount: 42,
  procurement: "eci",
  regulatory: "nz-mbie-eci",
};

export const defaultZones: Zone[] = [
  {
    id: "podium",
    label: "Podium",
    heightRange: [0, 18],
    resourceQuota: {
      craneHoursPerDay: 4,
      laydownAreaM2: 80,
      deliverySlotsPerDay: 4,
      installWindowDays: 60,
    },
    performanceRequirement: {
      uValueMax: 1.9,
      fireRatingMin: "A2",
      acousticRwMin: 38,
      weatherTightnessClass: "enhanced",
    },
  },
  {
    id: "tower-low",
    label: "Tower low",
    heightRange: [18, 80],
    resourceQuota: {
      craneHoursPerDay: 6,
      laydownAreaM2: 120,
      deliverySlotsPerDay: 6,
      installWindowDays: 90,
    },
    performanceRequirement: {
      uValueMax: 1.8,
      fireRatingMin: "A2",
      acousticRwMin: 40,
      weatherTightnessClass: "enhanced",
    },
  },
  {
    id: "tower-high",
    label: "Tower high",
    heightRange: [80, 160],
    resourceQuota: {
      craneHoursPerDay: 8,
      laydownAreaM2: 100,
      deliverySlotsPerDay: 5,
      installWindowDays: 120,
    },
    performanceRequirement: {
      uValueMax: 1.75,
      fireRatingMin: "A2",
      acousticRwMin: 41,
      weatherTightnessClass: "extreme",
    },
  },
];

export const hardGates: HardGate[] = [
  {
    id: "gate-fire",
    label: "External wall fire classification",
    category: "fire",
    requirement: "Minimum A2, A1 preferred for high-risk zones",
    isRegulatory: true,
  },
  {
    id: "gate-thermal",
    label: "Envelope U-value target",
    category: "thermal",
    requirement: "Zone-specific maximum U-value",
    isRegulatory: true,
  },
  {
    id: "gate-acoustic",
    label: "Traffic-noise acoustic target",
    category: "acoustic",
    requirement: "Minimum zone Rw",
    isRegulatory: true,
  },
  {
    id: "gate-structure",
    label: "Module mass and anchor capacity",
    category: "structural",
    requirement: "Within crane and facade support envelope",
    isRegulatory: true,
  },
];

export function buildDefaultResourceGates(zones: Zone[] = defaultZones): ResourceGate[] {
  return [
    {
      id: "gate-transport-limit",
      label: "Transport length limit",
      parameterKey: "transportLimit",
      currentValue: 5.2,
      range: [3, 8],
      unit: "m",
      uncertaintyStdDev: 0.25,
    },
    {
      id: "gate-lift-limit",
      label: "Single lift mass limit",
      parameterKey: "liftLimit",
      currentValue: 1500,
      range: [500, 2500],
      unit: "kg",
      uncertaintyStdDev: 120,
    },
    ...zones.flatMap((zone) => [
      {
        id: `gate-crane-${zone.id}`,
        label: `${zone.label} crane allocation`,
        parameterKey: "craneHoursPerDay" as const,
        currentValue: zone.resourceQuota.craneHoursPerDay,
        range: [2, 12] as [number, number],
        unit: "hr/day",
        uncertaintyStdDev: 0.6,
        zoneId: zone.id,
      },
      {
        id: `gate-laydown-${zone.id}`,
        label: `${zone.label} laydown buffer`,
        parameterKey: "laydownAreaM2" as const,
        currentValue: zone.resourceQuota.laydownAreaM2,
        range: [40, 220] as [number, number],
        unit: "m2",
        uncertaintyStdDev: 12,
        zoneId: zone.id,
      },
      {
        id: `gate-delivery-${zone.id}`,
        label: `${zone.label} delivery booking slots`,
        parameterKey: "deliverySlotsPerDay" as const,
        currentValue: zone.resourceQuota.deliverySlotsPerDay,
        range: [2, 10] as [number, number],
        unit: "slots/day",
        uncertaintyStdDev: 0.8,
        zoneId: zone.id,
      },
      {
        id: `gate-install-${zone.id}`,
        label: `${zone.label} installation window`,
        parameterKey: "installWindowDays" as const,
        currentValue: zone.resourceQuota.installWindowDays,
        range: [35, 150] as [number, number],
        unit: "days",
        uncertaintyStdDev: 9,
        zoneId: zone.id,
      },
    ]),
  ];
}

export const resourceGates = buildDefaultResourceGates();

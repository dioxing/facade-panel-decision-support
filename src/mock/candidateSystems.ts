import { extractedValues } from "@/mock/extractedValues";
import type { CandidateSystem, ParameterKey, SystemTypology } from "@/types/domain";
import { PARAMETER_KEYS } from "@/types/domain";

const labels: Record<string, { label: string; typology: SystemTypology; positioning: string }> =
  {
    S1: {
      label: "S1 Unitised CW (Vendor A)",
      typology: "unitised-curtain-wall",
      positioning:
        "High programme certainty and envelope closure speed, with higher capital cost.",
    },
    S2: {
      label: "S2 Rainscreen ACM (Vendor B)",
      typology: "rainscreen-cladding",
      positioning:
        "Low-cost lightweight rainscreen, but evidence gaps remain for acoustic, weather, and end-of-life assumptions.",
    },
    S3: {
      label: "S3 Precast GRC Panel",
      typology: "grc-panel",
      positioning:
        "Robust non-combustible panel family with moderate cost and heavier lifting profile.",
    },
    S4: {
      label: "S4 Spandrel + Window Wall",
      typology: "spandrel-window-wall",
      positioning:
        "Balanced facade package with precedent cost data, but weather exposure is more sensitive.",
    },
    S5: {
      label: "S5 Prefab Brick Veneer",
      typology: "brick-veneer-prefab",
      positioning:
        "Architecturally expressive and durable option with low-DQI carbon and lead-time evidence.",
    },
  };

function parameterMap(systemId: string) {
  return PARAMETER_KEYS.reduce<Partial<Record<ParameterKey, string>>>((map, key) => {
    const value = extractedValues.find(
      (item) => item.candidateSystemId === systemId && item.parameterKey === key,
    );

    if (value) {
      map[key] = value.id;
    }

    return map;
  }, {});
}

export function buildCandidateSystems(values = extractedValues): CandidateSystem[] {
  return Object.entries(labels).map(([id, meta]) => {
    const parameters = PARAMETER_KEYS.reduce<Partial<Record<ParameterKey, string>>>(
      (map, key) => {
        const value = values.find(
          (item) =>
            item.candidateSystemId === id &&
            item.parameterKey === key &&
            item.status !== "rejected",
        );

        if (value) {
          map[key] = value.id;
        }

        return map;
      },
      {},
    );

    return {
      id,
      label: meta.label,
      typology: meta.typology,
      positioning: meta.positioning,
      parameters,
      evidenceCoverage:
        Object.values(parameters).filter(Boolean).length / PARAMETER_KEYS.length,
      manualOverrides: [],
    };
  });
}

export const candidateSystems: CandidateSystem[] = Object.entries(labels).map(
  ([id, meta]) => ({
    id,
    label: meta.label,
    typology: meta.typology,
    positioning: meta.positioning,
    parameters: parameterMap(id),
    evidenceCoverage:
      Object.values(parameterMap(id)).filter(Boolean).length / PARAMETER_KEYS.length,
    manualOverrides: [],
  }),
);

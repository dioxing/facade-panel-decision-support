export const zoneAreasM2: Record<string, number> = {
  podium: 2200,
  "tower-low": 6600,
  "tower-high": 7600,
};

export const solutionAssignments: Array<{
  id: string;
  label: string;
  systemAssignment: Record<string, string>;
}> = [
  {
    id: "sol-unitised-core",
    label: "Unitised tower / GRC podium",
    systemAssignment: {
      podium: "S3",
      "tower-low": "S1",
      "tower-high": "S1",
    },
  },
  {
    id: "sol-acm-economy",
    label: "ACM economy package",
    systemAssignment: {
      podium: "S2",
      "tower-low": "S2",
      "tower-high": "S4",
    },
  },
  {
    id: "sol-grc-robust",
    label: "GRC robust envelope",
    systemAssignment: {
      podium: "S3",
      "tower-low": "S3",
      "tower-high": "S3",
    },
  },
  {
    id: "sol-windowwall-balanced",
    label: "Window wall balanced",
    systemAssignment: {
      podium: "S5",
      "tower-low": "S4",
      "tower-high": "S4",
    },
  },
  {
    id: "sol-brick-podium",
    label: "Brick podium / unitised tower",
    systemAssignment: {
      podium: "S5",
      "tower-low": "S1",
      "tower-high": "S1",
    },
  },
  {
    id: "sol-carbon-light",
    label: "Low-carbon lightweight mix",
    systemAssignment: {
      podium: "S2",
      "tower-low": "S2",
      "tower-high": "S1",
    },
  },
];

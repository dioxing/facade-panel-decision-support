# Preliminary Facade Shortlisting Decision Support

A browser-only research demonstrator for preliminary facade option shortlisting in New Zealand.

Live site:

```text
https://dioxing.github.io/facade-panel-decision-support/
```

## What this prototype does

The interface is organised as a seven-step shortlist workflow:

- `Project Data`
- `Facade Options`
- `L1 Feasibility`
- `L2 Comparison`
- `L3 Robustness`
- `M0/M1/M3 Models`
- `Shortlist & Report`

It uses local mock data to:

- screen compliance-evidence status at `L1`;
- compare `F1` supply-side facade cost, `F2` A1-A5 upfront embodied carbon, and `F3` preliminary constructability burden at `L2`;
- stress-test delivery, crane, laydown, supplier, carbon-boundary, and evidence uncertainty at `L3`;
- compare baseline decision models `M0`, `M1`, and `M3`;
- generate decision-support shortlist cards with diagnostics, evidence requests, and recommendation language.

## What this prototype does not claim

This demonstrator does not:

- verify NZ Building Code compliance;
- select a universally optimal facade;
- produce a final facade design;
- predict final construction cost;
- predict final installation productivity.

It instead screens evidence status, supports preliminary facade shortlisting, estimates supply-side cost or cost index, estimates preliminary constructability burden, and explains why options remain selected, conditional, held, or excluded.

## Core logic

`L1` is separate from `F1/F2/F3`. It is an evidence-status screen, not a compliance verification result.

`L2` uses:

```text
F1 = supply-side facade cost or cost index
F2 = carbonA1A3 + carbonA4 + carbonA5
F3 = (D1 + D2 + D3) / 3
```

Where:

- `D1` = standardisation / offsite-readiness burden
- `D2` = interface / assembly / tolerance burden
- `D3` = handling / access / detailing burden

`L3` is scenario stress testing and decision explanation. It is not a fourth optimisation objective.

## Validation models

- `M0` selects low-cost options only.
- `M1` compares cost and carbon using a normalised combined score.
- `M3` applies `L1`, compares `F1/F2/F3`, makes `L3` sensitivity explicit, and generates shortlist cards.

Validation in this prototype means showing that preliminary facade data can be transformed into traceable, explainable, scenario-tested decision outputs. It does not mean proving that one facade system is universally optimal.

## Implementation

- [src/components/research/PreliminaryFacadeApp.tsx](C:/Users/DEAO/Documents/Deao/facade-panel-decision-support/src/components/research/PreliminaryFacadeApp.tsx) renders the active dashboard UI.
- [src/mock/preliminaryFrameworkData.ts](C:/Users/DEAO/Documents/Deao/facade-panel-decision-support/src/mock/preliminaryFrameworkData.ts) stores local mock project, option, and validation data.
- [src/lib/preliminaryFrameworkCalculations.ts](C:/Users/DEAO/Documents/Deao/facade-panel-decision-support/src/lib/preliminaryFrameworkCalculations.ts) calculates `F1`, `F2`, `F3`, `L1`, and `M0/M1/M3`.
- [src/types/researchFramework.ts](C:/Users/DEAO/Documents/Deao/facade-panel-decision-support/src/types/researchFramework.ts) defines the active data model.

The app entry point is:

```text
src/App.tsx -> src/components/research/PreliminaryFacadeApp.tsx
```

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Deploy

GitHub Actions builds the Vite app and publishes the static output to the `gh-pages` branch.

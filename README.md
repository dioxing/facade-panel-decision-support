# Preliminary Facade Shortlisting Decision Support

A research-grade web demonstrator for preliminary facade system shortlisting in New Zealand.

Live demo:

```text
https://dioxing.github.io/facade-panel-decision-support/
```

## Research Purpose

This prototype supports an independent PhD research framework. It links constructability factors, NZ preliminary design evidence, supply-side cost, upfront embodied carbon, preliminary constructability burden, scenario stress testing, and M0/M1/M3 validation.

It is not a commercial facade design tool. It does not verify NZ Building Code compliance, select a universally optimal facade, predict final construction cost, or predict final installation productivity.

## Phase 1: Framework Development

Phase 1 defines the research framework before operational testing.

- Research Setup explains the logic of preliminary facade shortlisting.
- Factor-Indicator Matrix maps constructability factors CF1-CF8 to indicators, metrics, framework roles, data availability, source type, and expert validation status.
- NZ Context Mapping connects preliminary design scope, compliance evidence, NZBC-relevant evidence gates, embodied carbon boundaries, and site logistics to L1/L2/L3 roles.
- Expert Review Pack provides interview validation prompts for factor relevance, indicator suitability, data availability, role classification, solution-card clarity, and missing factors.

## Phase 2: Operationalisation and Validation

Phase 2 demonstrates how the framework can be run with a minimum viable dataset.

- MVP Data Setup lists project-level inputs, option-level inputs, reference data, and completeness indicators.
- L1 Feasibility screens compliance-evidence status and preliminary context readiness.
- L2 Comparison reports F1 supply-side facade cost, F2 A1-A5 embodied carbon, and F3 preliminary constructability burden.
- L3 Robustness stress-tests logistics, supplier, evidence, and carbon-boundary uncertainty.
- M0/M1/M3 Validation compares baseline decision models with the proposed full framework.
- Solution Cards present preliminary shortlist outputs, risk chips, diagnostics, evidence requests, and decision recommendations.

## Framework Logic

L1 is separated from F1/F2/F3. It screens whether evidence is pass, conditional pass, hold, or reject. This is an evidence-readiness screen, not a compliance verification result.

L2 compares three objectives:

```text
F1 = supply-side facade cost or cost index
F2 = carbonA1A3 + carbonA4 + carbonA5
F3 = (D1 + D2 + D3) / 3
```

D1 represents standardisation and offsite-readiness burden. D2 represents interface, assembly, tolerance, and wet-work burden. D3 represents handling, access, and detailing burden. F3 uses a 0-1 scale where lower is better.

L3 is scenario stress testing and decision explanation. It is not a fourth optimisation objective.

## Validation Models

M0 selects options using minimum supply-side cost.

M1 selects options using normalised cost and A1-A5 carbon:

```text
M1_score = 0.5 * norm(F1) + 0.5 * norm(F2)
```

M3 applies L1 evidence screening, compares F1/F2/F3, flags L3-sensitive options, and generates decision-support solution cards.

The validation claim is that preliminary facade data can be transformed into traceable, explainable, scenario-tested, and expert-reviewable decision outputs. It is not validated by proving that one facade system is universally optimal.

## Implementation

The app is a static browser-only Vite application.

- `src/mock/preliminaryFrameworkData.ts` stores local mock project, factor, option, context, and validation data.
- `src/lib/preliminaryFrameworkCalculations.ts` calculates F1/F2/F3, L1 overall status, L3 robustness, and M0/M1/M3 selections.
- `src/components/research/PreliminaryFacadeApp.tsx` renders the two-phase research interface.
- `src/types/researchFramework.ts` defines the active research data model.

The deployed app entry point is:

```text
src/App.tsx -> src/components/research/PreliminaryFacadeApp.tsx
```

No backend or database is required.

## Run Locally

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

If the public link is not active, check GitHub:

```text
Settings > Pages > Deploy from a branch > gh-pages > /root
```

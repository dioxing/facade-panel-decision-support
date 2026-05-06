# EG-Facade Decision Support

An early-stage facade strategy selection prototype for evidence-led, feasibility-first design workshops.

This React + TypeScript application demonstrates how facade design teams can compare external wall system strategies before detailed design, while keeping data provenance, data quality, resource feasibility, and counterfactual diagnostics visible throughout the decision process.

## Live Demo

GitHub Pages deployment is configured through `.github/workflows/deploy-pages.yml`.
The workflow builds the Vite app and publishes the static output to the `gh-pages` branch.

Expected public URL:

```text
https://dioxing.github.io/facade-panel-decision-support/
```

If the link is not active yet, open the repository on GitHub, go to `Settings > Pages`, set the source to `Deploy from a branch`, choose `gh-pages` and `/root`, then save.

## Research Framing

Conventional early-stage facade comparison often starts with cost, embodied carbon, or visual preference, then checks constructability later. This can make non-buildable options appear optimal until site logistics, lifting limits, delivery capacity, laydown area, evidence gaps, or regulatory constraints are considered.

EG-Facade reverses that order. It treats feasibility and evidence quality as first-class decision artefacts.

The prototype is built around three commitments:

- RAG-extracted evidence: system parameters are populated from mock project documents and then accepted, edited, or rejected by workshop participants.
- DQI always visible: each parameter displays a three-part Data Quality Indicator for representativeness, reliability, and completeness.
- Counterfactual diagnostics: shortlisted systems show what would need to change for a conditional or infeasible option to become feasible or preferred.

## Workflow

The interface follows a five-stage workshop storyboard.

1. Setup
   Define project context, procurement route, and facade zones. The default zones are podium, tower-low, and tower-high.

2. Evidence
   Review extracted values from mock EPDs, datasheets, site surveys, specifications, and precedent cost documents. Human verification creates an audit trail.

3. Candidates
   Inspect five facade typologies, evidence coverage, DQI, missing values, and first-pass feasibility.

4. Gates
   Calibrate hard regulatory gates and probabilistic resource gates such as crane hours, laydown area, delivery slots, transport limits, and lift limits.

5. Decide & Audit
   Explore counterfactual cards, Pareto trade-offs, solution cards, baseline comparison, and the audit trail.

## Mock Candidate Systems

The prototype includes exactly five systems:

- S1 Unitised CW (Vendor A)
- S2 Rainscreen ACM (Vendor B)
- S3 Precast GRC Panel
- S4 Spandrel + Window Wall
- S5 Prefab Brick Veneer

The mock evidence intentionally includes decision risk:

- S2 is missing three parameters.
- S5 has two low-DQI values.
- Resource gates create feasible, conditional, and infeasible cells across zones.

## Default Zones

| Zone | Height | Crane | Laydown | Delivery |
| --- | ---: | ---: | ---: | ---: |
| Podium | 0-18 m | 4 hr/day | 80 m2 | 4 slots/day |
| Tower low | 18-80 m | 6 hr/day | 120 m2 | 6 slots/day |
| Tower high | 80-160 m | 8 hr/day | 100 m2 | 5 slots/day |

## Decision Logic

The app runs entirely in the browser with mock data.

- `src/mock/extractedValues.ts` defines RAG-style extracted parameters with source snippets and DQI.
- `src/mock/computeDecision.ts` builds candidates, zone feasibility cells, solutions, Pareto flags, knee solution, and counterfactuals.
- `src/lib/probabilisticGate.ts` calculates probability of passing uncertain gates using a normal CDF and an error-function approximation.
- `src/lib/counterfactual.ts` generates "if this gate changes by 20%" diagnostics.
- `src/lib/auditTrail.ts` records verification, edits, rejection, shortlisting, and gate tuning.

## Technology Stack

- React
- TypeScript
- Vite
- Zustand
- Tailwind CSS
- shadcn-style Radix UI primitives
- Recharts
- lucide-react

No backend, database, localStorage, or sessionStorage is required.

## Project Structure

```text
src/
  components/
    shell/
    shared/
    stage1-setup/
    stage2-evidence/
    stage3-candidates/
    stage4-gates/
    stage5-decide/
    ui/
  lib/
    auditTrail.ts
    counterfactual.ts
    dqi.ts
    probabilisticGate.ts
  mock/
    candidateSystems.ts
    computeDecision.ts
    documents.ts
    extractedValues.ts
    gates.ts
    solutions.ts
  store/
    candidateStore.ts
    decisionStore.ts
    evidenceStore.ts
    gateStore.ts
    projectStore.ts
    useComputedDecision.ts
  types/
    domain.ts
```

Legacy files from the earlier facade panel optimisation prototype are retained in `src/models`, `src/stores`, and older component folders, but the current app entry point uses the EG-Facade workshop shell.

## Screenshots

Screenshots can be added after running the app locally.

```text
docs/screenshots/01-setup.png
docs/screenshots/02-evidence.png
docs/screenshots/03-candidates.png
docs/screenshots/04-gates.png
docs/screenshots/05-decide-counterfactuals.png
docs/screenshots/06-pareto-explorer.png
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Prototype Limitations

This is a research prototype, not a validated optimisation engine.

- RAG extraction is simulated using mock document data.
- Probabilistic gates use simplified assumptions.
- Cost, carbon, programme, and constructability formulas are illustrative.
- Counterfactuals are generated from binding resource gates rather than a full mathematical optimiser.
- Audit export is mocked for demonstration.

## Research Contribution

The prototype demonstrates an interface pattern for feasibility-first facade decision support. Its contribution is not a final algorithm, but a transparent workflow where early design teams can see:

- which evidence supports each parameter,
- whether that evidence is high or low quality,
- which resource gates restrict feasible options,
- how cost-carbon trade-offs change once feasibility is considered,
- and what practical relaxation would change a decision.

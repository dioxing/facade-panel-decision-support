# EG-Facade Workshop Storyboard

This storyboard maps the research prompt to the implemented five-stage interface.

## Stage 1: Setup

Purpose: establish the decision context before candidate evaluation.

Implemented views:

- Project context card with project name, location, procurement route, and regulatory frame.
- Zone editor for podium, tower-low, and tower-high.
- Resource sliders for crane allocation, laydown buffer, delivery bookings, and installation window.
- Live feasibility matrix remains visible in the right sidebar.

Screenshot placeholder:

```text
docs/screenshots/01-setup.png
```

## Stage 2: Evidence

Purpose: show that system parameters come from extracted evidence plus human verification.

Implemented views:

- Document tray with mock EPDs, datasheets, site survey, regulation extract, specification, and BOQ evidence.
- System selector for S1-S5.
- Extraction viewer with source snippets, DQI, status, accept/edit/reject controls, and manual override reason.
- Parameter sheet showing values and DQI across all systems.

Screenshot placeholder:

```text
docs/screenshots/02-evidence.png
```

## Stage 3: Candidates

Purpose: screen facade system families before deciding.

Implemented views:

- Five candidate cards.
- Evidence coverage score.
- DQI badges for available parameters.
- Warning messages for low-DQI or low-coverage systems.
- Worst-zone feasibility pill for each system.
- Shortlist toggle with audit entry.

Screenshot placeholder:

```text
docs/screenshots/03-candidates.png
```

## Stage 4: Gates

Purpose: make hard constraints and uncertain resource capacity explicit.

Implemented views:

- Read-only hard gate panel for fire, thermal, acoustic, and structural requirements.
- Resource gate sliders for global transport and lift limits.
- Zone-specific resource gates for crane hours, laydown area, delivery slots, and install windows.
- One-sigma uncertainty band below each slider.
- Live feasibility matrix updates as gates are tuned.

Screenshot placeholder:

```text
docs/screenshots/04-gates.png
```

## Stage 5: Decide & Audit

Purpose: interpret feasible, conditional, and infeasible options through decision artefacts.

Implemented views:

- Counterfactual Cards tab is the default.
- Apply scenario button jumps back to Stage 4 and highlights the binding gate.
- Pareto Explorer scatter plot compares cost and embodied carbon with constructability as point size.
- Solution Cards list assignments, cost, carbon, constructability score, p-min, Pareto status, and binding gates.
- Audit Trail records evidence verification, edits, rejections, shortlisting, and gate tuning.
- Mock export notice simulates a decision package export.

Screenshot placeholders:

```text
docs/screenshots/05-decide-counterfactuals.png
docs/screenshots/06-pareto-explorer.png
```

## Non-negotiable Prompt Commitments

- RAG-extracted evidence is represented by `DocumentSource` and `ExtractedValue` records.
- Human verification actions are captured in `AuditEntry`.
- DQI is shown as a three-segment badge for representativeness, reliability, and completeness.
- Counterfactual diagnostics are a first-class default decision view.
- Feasibility is probabilistic and zone-specific.
- No backend or browser storage persistence is used.

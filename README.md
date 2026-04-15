# Facade Panel Decision Support

A front-end proof-of-concept for constructability-aware early-stage facade panel selection.

This repository implements a feasibility-first decision-support interface for comparing facade panel alternatives under competing cost, embodied carbon, and constructability objectives. The prototype is framed around early-stage decision-making for Building 405 and translates the research problem into an interactive React application with mock optimisation, feasibility screening, trade-off visualisation, and candidate diagnostics.

## Research Context

Early-stage facade decisions can lock in:

- project cost
- embodied carbon
- manufacturing complexity
- logistics demand
- lifting and installation effort
- exposure to site constraints such as crane availability, delivery booking capacity, and laydown limits

Many optimisation studies in building design focus on cost and carbon under idealised assumptions. In practice, apparently high-performing solutions may become non-buildable once panel size, weight, transport, lifting, and site logistics are considered. This project responds to that gap by treating constructability as an explicit objective and by enforcing gatekeeper feasibility constraints before interpreting the Pareto set.

## Research Aim

The aim of this study is to develop and demonstrate a feasibility-first decision-support workflow for early-stage facade and external wall panel design.

The workflow is designed to:

- minimise estimated cost
- minimise embodied carbon
- minimise constructability difficulty
- exclude infeasible options from the final Pareto set
- make feasibility and trade-offs transparent to designers and engineers

## Problem Formulation

Each candidate solution is represented by an early-stage decision vector including:

- panel material type
- insulation type
- panel thickness
- panel size category
- connection typology
- standardisation level

The prototype interprets constructability through a composite proxy-based objective:

```text
f_con(x) =
  w1 * P_types +
  w2 * D_disp +
  w3 * C_var +
  w4 * T_lift +
  w5 * L_log +
  w6 * A_lay +
  w7 * I_wf
```

Where:

- `P_types` = panel type variety
- `D_disp` = dimensional dispersion
- `C_var` = connection variety
- `T_lift` = lifting and installation time
- `L_log` = logistics pressure
- `A_lay` = laydown footprint demand
- `I_wf` = workface interaction

The interface also reports two constructability-related diagnostics that are not part of the aggregate objective:

- `R_ns` = non-standard ratio
- `N_lift` = lift count intensity

### Gatekeeper Constraints

Candidate solutions are screened against hard feasibility constraints before Pareto ranking. The current prototype includes:

- transport dimension limit
- lifting weight limit
- crane time budget
- delivery booking capacity
- laydown area capacity
- minimum thermal performance
- fire classification requirement
- basic material-detail compatibility rules

Any solution that fails one or more gatekeeper constraints is excluded from the feasible Pareto set.

## What the Current Prototype Implements

### Inputs

The left-side control panel lets the user define:

- project context constraints
- design option search space
- constructability weight profile
- data source mode: mock data or imported dataset

### Decision Artefacts

The right-side panel produces five main outputs:

- `Pareto Surface`  
  Feasibility-aware trade-off view for cost, embodied carbon, and constructability. Includes a baseline comparison between performance-only and feasibility-first frontiers.

- `Solution Card`  
  Detailed breakdown for a selected candidate, including metrics, decision variables, constructability proxy scores, diagnostics, and feasibility checks.

- `Infeasibility Diagnostics`  
  Frequency summary of the constraints that exclude candidate solutions.

- `Pattern Clusters`  
  Lightweight clustering of Pareto solutions into family-level patterns such as high-standardisation, low-carbon, low-cost, and balanced schemes.

- `Sensitivity Analysis`  
  Parameter perturbation for crane budget, laydown capacity, delivery booking capacity, and installation effort assumptions.

### Computational Workflow

The current implementation includes:

- mock generation of candidate solutions
- feasibility screening against gatekeeper constraints
- non-dominated sorting for feasible solutions
- performance-only baseline comparison
- special-solution tagging such as knee point, low cost, low carbon, and high buildability
- simple clustering of Pareto solutions
- import and export of candidate datasets

## Data Import

The application supports two data modes:

- `Mock dataset`  
  Candidate solutions are generated in the browser using simplified engineering assumptions.

- `Imported dataset`  
  User-provided candidate records are re-screened against the current project constraints and then re-ranked and re-clustered by the interface.

### Accepted Formats

- JSON array of candidate records
- JSON object shaped like `{ "candidates": [...] }`
- CSV with flat candidate-level columns

### Important Note

The import pipeline currently expects **candidate-level evaluated records**, not raw material catalogues or unprocessed BIM data. In other words, imported files should already contain:

- decision variables
- objective values
- constructability proxy values
- diagnostic indicators
- panel and installation metrics

The easiest workflow is:

1. Use the UI to export the current dataset as JSON or CSV.
2. Use that exported file as your template.
3. Replace the rows with your own candidate records.
4. Import the file back into the interface.

## Technology Stack

- React
- TypeScript
- Vite
- Zustand
- Tailwind CSS
- shadcn-style component architecture using Radix UI primitives
- Recharts

## Getting Started

### Prerequisites

- Node.js
- npm

### Install

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Project Structure

```text
src/
  components/
    inputs/
    layout/
    outputs/
    ui/
  lib/
  models/
  stores/
  App.tsx
  main.tsx
```

Key implementation areas:

- `src/models/mockData.ts`  
  Mock candidate generation and simplified performance calculations.

- `src/models/optimization.ts`  
  Weight normalisation, Pareto ranking, and infeasibility statistics.

- `src/models/clustering.ts`  
  Lightweight clustering of Pareto solutions.

- `src/models/importData.ts`  
  JSON and CSV import/export support for candidate datasets.

- `src/stores/useDesignStore.ts`  
  Global state management and orchestration of the optimisation workflow.

## Prototype Status and Limitations

This repository is a research-oriented proof of concept, not a fully validated production decision engine.

Current limitations include:

- no backend or persistent database
- no direct BIM, IFC, or EPD integration
- mock formulas rather than calibrated project-specific models
- simplified constructability proxies and site rules
- lightweight clustering instead of advanced unsupervised analysis
- imported data must already be transformed into candidate-level records
- provenance capture and data-quality tagging are discussed in the research framing but are not yet fully implemented in the application

## Intended Contribution

The main contribution of this prototype is not a final optimisation algorithm, but a transparent interface and workflow for testing the idea that:

- feasibility should be handled first, not after optimisation
- constructability should be represented explicitly, not only qualitatively
- Pareto-optimal design exploration is more useful when non-buildable options are excluded early
- decision-makers benefit from both candidate-level and pattern-level artefacts

## Possible Next Steps

Potential future development directions include:

- direct import of raw project data, BIM-derived panel schedules, or material libraries
- provenance and confidence tagging for cost and carbon inputs
- more rigorous constructability proxy calibration with expert review
- tighter linkage between imported datasets and sensitivity recalculation
- report export for project meetings or design reviews
- deployment as a hosted research demonstrator

# Atomity — Cloud Cost Explorer

A focused cloud cost analytics interface built for the **Atomity Frontend Engineering Challenge**.

The goal is to make infrastructure spending easier to understand by allowing users to move from a high-level **cluster view** down to individual **namespaces** and **pods**, while keeping the interface responsive, accessible, and visually focused.

**Challenge:** Frontend Intern — Atomity
**Option:** A — Cloud Cost Analytics
**Stack:** Next.js · React · TypeScript · Tailwind CSS · TanStack Query

---

## Live Demo

**Live Demo:** [Add your deployed URL here]

**Repository:** https://github.com/amirkm07/atomity-frontend-challenge-test

---

## Overview

Cloud infrastructure costs can become difficult to understand once spending is distributed across clusters, namespaces, workloads, and different resource types.

This project explores a simple question:

> **Where exactly is my infrastructure money being spent?**

The interface starts with an overview of cloud cost and allows the user to progressively drill down:

```text
Clusters
   ↓
Namespaces
   ↓
Pods
```

At each level, the same cost model is reused to provide a consistent way of exploring infrastructure spend.

The current view also breaks cost down by resource category, including:

* CPU
* RAM
* GPU
* Network
* Storage
* Other costs when applicable

---

## Key Features

### Interactive cost drill-down

Users can move through the infrastructure hierarchy:

```text
Cluster → Namespace → Pod
```

Selecting a cluster loads its namespaces. Selecting a namespace then loads its pods.

Breadcrumb navigation and a back action make it possible to move between levels without losing context.

### Real asynchronous allocation data

The dashboard is connected to an OpenCost allocation endpoint rather than relying entirely on hardcoded dashboard values.

The application exposes a small Next.js API route that validates the request parameters and forwards the allocation request to the OpenCost data layer.

Supported aggregation levels are:

```text
cluster
namespace
pod
```

### Loading and error states

The interface handles asynchronous states explicitly:

* Loading skeletons while data is being fetched
* Empty states when no allocation data is available
* Error feedback when the request fails
* Retry action to request the data again

### Cost and resource breakdown

The dashboard calculates and displays:

* Total cost
* Weighted efficiency
* Workload count at pod level
* Cost by cluster / namespace / pod
* Resource-level cost distribution

Resource costs are derived from the allocation response rather than being hardcoded into the UI.

### Responsive layout

The interface is designed around three practical viewport ranges:

* Mobile: approximately 375px
* Tablet: approximately 768px
* Desktop: 1280px+

The layout, spacing, typography, controls, and cost visualizations adapt to the available width.

### Accessibility considerations

The interface uses semantic HTML where appropriate and includes:

* Keyboard-accessible buttons
* Visible focus states
* Accessible section headings
* Screen-reader-only headings where useful
* Reduced-motion support through `prefers-reduced-motion`

---

## Interaction & Motion

Motion is intentionally used to support hierarchy and feedback rather than decorate every element.

The interface currently uses:

* Staggered entrance animations
* Fade-up transitions
* Animated cost bars
* Loading shimmer states
* Subtle hover feedback
* Focus transitions
* Reduced-motion fallback

The main principle is:

> **Motion should help explain what changed, not compete with the data.**

For example, when moving from clusters to namespaces, the content updates while the surrounding dashboard structure remains familiar. This helps the drill-down feel like one continuous exploration rather than a completely different screen.

---

## Data Fetching & Caching

The project uses **TanStack Query** for server-state management.

The query key includes the parameters that affect the allocation request:

```text
allocation
├── window
├── aggregate
├── step
├── resolution
└── filter
```

This allows different drill-down states to be cached independently.

The current query configuration uses:

```text
staleTime: 5 minutes
gcTime: 30 minutes
refetchOnWindowFocus: false
```

This keeps recently viewed allocation data available when navigating between levels and avoids unnecessary refetching when the browser window regains focus.

---

## API Flow

The data flow is intentionally kept simple:

```text
CostExplorer
     │
     ▼
useAllocation()
     │
     ▼
TanStack Query
     │
     ▼
/api/allocation
     │
     ▼
OpenCost allocation data
     │
     ▼
Typed allocation model
     │
     ▼
Cost / resource calculations
     │
     ▼
UI
```

The API route also validates parameters such as:

* `window`
* `aggregate`
* `step`
* `resolution`
* `filter`

and returns structured error responses when the request is invalid or the upstream data cannot be loaded.

---

## Design System

The UI uses a small token-based design system rather than scattering visual values throughout the components.

The main token categories include:

* Page and surface colors
* Text colors
* Borders
* Accent colors
* Focus ring
* Border radii
* Shadows
* Spacing
* Typography

For example:

```css
--color-page
--color-surface
--color-text
--color-text-secondary
--color-border
--color-accent
--radius-md
--shadow-sm
```

This keeps the visual language consistent and makes future visual changes easier.

The project also uses modern CSS features such as `clamp()` for fluid typography and a dedicated reduced-motion media query.

---

## Component & Code Structure

The main implementation is intentionally centered around the cost exploration experience.

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── ...
│
├── components/
│   └── CostExplorer.tsx
│
├── hooks/
│   └── useAllocation.ts
│
├── lib/
│   └── opencost.ts
│
├── types/
│   └── opencost.ts
│
└── ...
```

### Main responsibilities

**`CostExplorer`**

Owns the main interaction state:

* Current drill-down level
* Selected cluster
* Selected namespace
* Cost calculations
* Resource breakdown
* Loading / error / empty states

**`useAllocation`**

Provides the TanStack Query layer for fetching allocation data and keeps query parameters synchronized with the current drill-down state.

**OpenCost data layer**

Defines the typed allocation model and handles the upstream allocation request.

**API route**

Provides a server-side boundary between the UI and the OpenCost allocation source.

---

## Why These Technologies?

| Technology     | Why                                                          |
| -------------- | ------------------------------------------------------------ |
| React          | Component-based UI and interactive state                     |
| Next.js        | Application framework and API route support                  |
| TypeScript     | Typed API and allocation models                              |
| Tailwind CSS   | Fast, consistent responsive styling                          |
| TanStack Query | Server-state management, caching, loading and error handling |

No prebuilt UI component library was used.

The interface was built specifically for this challenge instead of relying on MUI, Chakra, Ant Design, shadcn/ui, or another prebuilt design system.

---

## Responsive Strategy

The responsive design follows a content-first approach.

### Desktop

The full cost hierarchy and resource breakdown can be viewed with generous spacing and multiple columns.

### Tablet

Content density is reduced while keeping the same information hierarchy.

### Mobile

The layout becomes vertically stacked, with:

* Full-width controls
* Stacked summary metrics
* Compact cost rows
* Wrapped breadcrumbs
* Responsive resource cards

The goal is not simply to shrink the desktop interface, but to preserve the most important interaction at smaller widths.

---

## Accessibility & Reduced Motion

Accessibility was considered as part of the implementation rather than as a final polish step.

The project includes:

* Semantic sections and headings
* Keyboard-operable buttons
* Visible `:focus-visible` states
* Sufficiently distinct text and surface colors
* Accessible labels and hidden headings where appropriate
* `prefers-reduced-motion` support

When reduced motion is requested by the user, decorative animations and transitions are significantly reduced.

---

## Trade-offs

This project was intentionally scoped as a focused frontend challenge rather than a complete cloud cost management platform.

### Single focused experience

The implementation prioritizes the core cost exploration flow instead of adding unrelated product areas.

### Client-side drill-down state

The current drill-down path is maintained in React state.

This keeps the interaction simple and avoids introducing another state-management dependency.

A production application could encode the selected cluster and namespace in URL search parameters to make views directly shareable.

### OpenCost dependency

The interface relies on OpenCost allocation data for the cost model.

In a production environment, this would likely sit behind a more complete authenticated backend with organization, team, permissions, and provider-specific billing integrations.

### Testing

Given the scope and time constraints of the challenge, the implementation prioritizes the core interaction, data flow, responsive behavior, and accessibility.

A production version would add automated unit and end-to-end coverage around the drill-down flow and data states.

---

## What I Would Improve Next

If this were developed beyond the challenge, the next improvements would focus on product depth rather than adding visual complexity.

### Data & product

* Configurable time ranges
* Cost trend visualization
* Cluster comparison
* Cost anomaly detection
* More detailed workload efficiency insights
* Persistent filters

### UX

* URL-based drill-down state
* Keyboard navigation through allocation items
* More detailed resource tooltips
* Better empty-state guidance

### Engineering

* Unit tests for data transformations and calculations
* Component tests for loading/error states
* End-to-end tests for the complete drill-down flow
* More granular component extraction as the feature grows

---

## Running Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open the local development URL shown by Next.js.

Before submitting, I also recommend checking:

```bash
npm run build
```

to verify that the production build completes successfully.

---

## Challenge Notes

This project was built as a focused implementation of **Option A — Cloud Cost Analytics** from the Atomity Frontend Engineering Challenge.

The main design goal was to balance:

* Clear information hierarchy
* Real asynchronous data
* Interactive drill-down
* Responsive behavior
* Accessible interaction
* Meaningful motion
* Maintainable frontend structure

Rather than building a large dashboard with many unrelated features, the implementation focuses on making one core workflow feel complete:

```text
Understand total cost
        ↓
Find the expensive cluster
        ↓
Inspect its namespaces
        ↓
Identify individual pods
```

---

## Author

Built by **Amir** for the Atomity Frontend Engineering Challenge.

[GitHub Repository](https://github.com/amirkm07/atomity-frontend-challenge-test)

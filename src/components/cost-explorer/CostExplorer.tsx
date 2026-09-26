"use client";

import { useState } from "react";
import { useAllocation } from "@/hooks/useAllocation";
import type { AllocationItem } from "@/types/opencost";

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const percentage = Math.min(Math.max(value * 100, 0), 100);

  return `${percentage.toFixed(1)}%`;
}

function getAllocationItems(
  data: ReturnType<typeof useAllocation>["data"],
): AllocationItem[] {
  return (
    data?.data
      .flatMap((allocationSet) => Object.values(allocationSet))
      .sort((a, b) => b.totalCost - a.totalCost) ?? []
  );
}

type DrillLevel = "cluster" | "namespace" | "pod";

const staggerDelays = [
  "0ms",
  "60ms",
  "120ms",
  "180ms",
  "240ms",
  "300ms",
  "360ms",
  "420ms",
];

export default function CostExplorer() {
  const [drillLevel, setDrillLevel] = useState<DrillLevel>("cluster");
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(
    null,
  );

  const filter =
    drillLevel === "namespace" && selectedCluster
      ? `cluster:"${selectedCluster}"`
      : drillLevel === "pod" && selectedCluster && selectedNamespace
        ? `cluster:"${selectedCluster}"+namespace:"${selectedNamespace}"`
        : undefined;

  const { data, isPending, isError, error, refetch } = useAllocation({
    window: "7d",
    aggregate: drillLevel,
    filter,
  });

  const allocations = getAllocationItems(data);

  const totalCost = allocations.reduce(
    (sum, allocation) => sum + allocation.totalCost,
    0,
  );

  const weightedEfficiency =
    totalCost > 0
      ? allocations.reduce(
          (sum, allocation) =>
            sum + allocation.totalEfficiency * allocation.totalCost,
          0,
        ) / totalCost
      : allocations.length > 0
        ? allocations.reduce(
            (sum, allocation) => sum + allocation.totalEfficiency,
            0,
          ) / allocations.length
        : 0;

  const resourceTotals = allocations.reduce(
    (totals, allocation) => ({
      cpu: totals.cpu + allocation.cpuCost,
      ram: totals.ram + allocation.ramCost,
      gpu: totals.gpu + allocation.gpuCost,
      network: totals.network + allocation.networkCost,
      storage: totals.storage + allocation.pvCost,
    }),
    {
      cpu: 0,
      ram: 0,
      gpu: 0,
      network: 0,
      storage: 0,
    },
  );

  const primaryResourceTotal =
    resourceTotals.cpu +
    resourceTotals.ram +
    resourceTotals.gpu +
    resourceTotals.network +
    resourceTotals.storage;

  const otherCost = Math.max(totalCost - primaryResourceTotal, 0);

  const resourceBreakdown = [
    { label: "CPU", value: resourceTotals.cpu },
    { label: "RAM", value: resourceTotals.ram },
    { label: "GPU", value: resourceTotals.gpu },
    { label: "Network", value: resourceTotals.network },
    { label: "Storage", value: resourceTotals.storage },
    ...(otherCost > 0 ? [{ label: "Other", value: otherCost }] : []),
  ];

  const maxAllocationCost = allocations.reduce(
    (max, allocation) => Math.max(max, allocation.totalCost),
    0,
  );

  const currentLevelLabel =
    drillLevel === "cluster"
      ? "Clusters"
      : drillLevel === "namespace"
        ? "Namespaces"
        : "Pods";

  const currentEntityLabel =
    drillLevel === "cluster"
      ? "Cluster"
      : drillLevel === "namespace"
        ? "Namespace"
        : "Pod";

  function openCluster(clusterName: string) {
    setSelectedCluster(clusterName);
    setSelectedNamespace(null);
    setDrillLevel("namespace");
  }

  function openNamespace(namespaceName: string) {
    if (!selectedCluster) {
      return;
    }

    setSelectedNamespace(namespaceName);
    setDrillLevel("pod");
  }

  function goBack() {
    if (drillLevel === "pod") {
      setSelectedNamespace(null);
      setDrillLevel("namespace");
      return;
    }

    if (drillLevel === "namespace") {
      setSelectedCluster(null);
      setDrillLevel("cluster");
    }
  }

  return (
    <>
      <style jsx global>{`
        @keyframes costExplorerFadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes costExplorerBar {
          from {
            transform: scaleX(0);
            transform-origin: left;
          }
          to {
            transform: scaleX(1);
            transform-origin: left;
          }
        }

        @keyframes costExplorerShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .cost-explorer-enter {
          animation: costExplorerFadeUp 600ms cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        .cost-explorer-bar {
          animation: costExplorerBar 900ms cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        .cost-explorer-shimmer {
          background-image: linear-gradient(
            90deg,
            var(--color-surface-muted) 0%,
            var(--color-surface) 50%,
            var(--color-surface-muted) 100%
          );
          background-size: 200% 100%;
          animation: costExplorerShimmer 1.6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .cost-explorer-enter,
          .cost-explorer-bar,
          .cost-explorer-shimmer {
            animation: none;
          }
        }
      `}</style>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="space-y-8 lg:space-y-10">
          <header className="cost-explorer-enter max-w-3xl space-y-4">
            <p className="text-xs font-medium tracking-[0.18em] text-[var(--color-text-muted)]">
              CLOUD COST ANALYTICS
            </p>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
                Understand where your cloud spend comes from.
              </h1>

              <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
                Trace infrastructure cost from clusters to namespaces and
                pods with a focused view of how workloads contribute to spend.
              </p>
            </div>
          </header>

          <div className="cost-explorer-enter flex flex-col gap-3 border-y border-[var(--color-border)] py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                className="inline-flex h-10 items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm font-medium text-[var(--color-text)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-text-muted)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              >
                <span>Last 7 days</span>
                <span
                  aria-hidden="true"
                  className="text-[var(--color-text-muted)] transition-transform duration-200"
                >
                  ▾
                </span>
              </button>

              <button
                type="button"
                className="inline-flex h-10 items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm font-medium text-[var(--color-text)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-text-muted)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              >
                <span>Cost allocation</span>
                <span
                  aria-hidden="true"
                  className="text-[var(--color-text-muted)]"
                >
                  ▾
                </span>
              </button>
            </div>

            {!isPending && !isError && allocations.length > 0 && (
              <p className="text-xs text-[var(--color-text-muted)]">
                Updated from live allocation data
              </p>
            )}
          </div>

          <section
            aria-labelledby="summary-heading"
            className="cost-explorer-enter space-y-4"
            style={{ animationDelay: "100ms" }}
          >
            <h2 id="summary-heading" className="sr-only">
              Cost summary
            </h2>

            <div className="grid gap-px overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-3">
              <div className="group bg-[var(--color-surface)] p-5 transition-colors duration-200 hover:bg-[var(--color-surface-muted)] sm:p-6">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Total Cost
                </p>

                {isPending ? (
                  <div className="cost-explorer-shimmer mt-3 h-9 w-28 rounded" />
                ) : (
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text)] transition-all duration-300 sm:text-3xl">
                    {allocations.length > 0 ? formatCurrency(totalCost) : "—"}
                  </p>
                )}
              </div>

              <div className="group bg-[var(--color-surface)] p-5 transition-colors duration-200 hover:bg-[var(--color-surface-muted)] sm:p-6">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Efficiency
                </p>

                {isPending ? (
                  <div className="cost-explorer-shimmer mt-3 h-9 w-24 rounded" />
                ) : (
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text)] transition-all duration-300 sm:text-3xl">
                    {allocations.length > 0
                      ? formatPercentage(weightedEfficiency)
                      : "—"}
                  </p>
                )}
              </div>

              <div className="group bg-[var(--color-surface)] p-5 transition-colors duration-200 hover:bg-[var(--color-surface-muted)] sm:p-6">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Workloads
                </p>

                <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
                  {drillLevel === "pod" && !isPending
                    ? allocations.length
                    : "—"}
                </p>

                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {drillLevel === "pod"
                    ? "Pods in selected namespace"
                    : "Available at workload level"}
                </p>
              </div>
            </div>
          </section>

          {isError ? (
            <section
              aria-labelledby="error-heading"
              className="cost-explorer-enter rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:p-8"
            >
              <div className="max-w-lg space-y-4">
                <div className="space-y-1.5">
                  <h2
                    id="error-heading"
                    className="text-lg font-semibold tracking-tight text-[var(--color-text)]"
                  >
                    Unable to load cost data
                  </h2>

                  <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                    {error instanceof Error
                      ? error.message
                      : "Something went wrong while loading the allocation data."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex h-10 items-center rounded-md bg-[var(--color-accent)] px-4 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-accent-hover)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                >
                  Try again
                </button>
              </div>
            </section>
          ) : (
            <>
              <section
                aria-labelledby="cluster-cost-heading"
                className="cost-explorer-enter space-y-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6 lg:p-7"
                style={{ animationDelay: "180ms" }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <h2
                      id="cluster-cost-heading"
                      className="text-lg font-semibold tracking-tight text-[var(--color-text)] sm:text-xl"
                    >
                      Cost by {currentEntityLabel}
                    </h2>

                    <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                      {drillLevel === "cluster"
                        ? "See how infrastructure spend is distributed across your cluster environment."
                        : drillLevel === "namespace"
                          ? `Namespaces inside ${selectedCluster}.`
                          : `Pods inside ${selectedNamespace}.`}
                    </p>
                  </div>

                  {drillLevel !== "cluster" && (
                    <button
                      type="button"
                      onClick={goBack}
                      className="inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text)] transition-all duration-200 hover:-translate-x-0.5 hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                    >
                      <span
                        aria-hidden="true"
                        className="transition-transform duration-200"
                      >
                        ←
                      </span>
                      Back
                    </button>
                  )}
                </div>

                {drillLevel !== "cluster" && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCluster(null);
                        setSelectedNamespace(null);
                        setDrillLevel("cluster");
                      }}
                      className="font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)] hover:underline"
                    >
                      Clusters
                    </button>

                    {selectedCluster && (
                      <>
                        <span aria-hidden="true">/</span>

                        {drillLevel === "pod" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedNamespace(null);
                              setDrillLevel("namespace");
                            }}
                            className="max-w-[180px] truncate font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)] hover:underline"
                          >
                            {selectedCluster}
                          </button>
                        ) : (
                          <span className="max-w-[180px] truncate font-medium text-[var(--color-text)]">
                            {selectedCluster}
                          </span>
                        )}
                      </>
                    )}

                    {selectedNamespace && (
                      <>
                        <span aria-hidden="true">/</span>
                        <span className="max-w-[180px] truncate font-medium text-[var(--color-text)]">
                          {selectedNamespace}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {isPending ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="space-y-2">
                        <div className="cost-explorer-shimmer h-4 w-32 rounded" />
                        <div className="cost-explorer-shimmer h-3 w-full rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : allocations.length === 0 ? (
                  <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-6 transition-colors duration-200">
                    <p className="max-w-sm text-center text-sm text-[var(--color-text-muted)]">
                      No {currentLevelLabel.toLowerCase()} are available for
                      this period.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {allocations.map((allocation, index) => {
                      const width =
                        maxAllocationCost > 0
                          ? Math.max(
                              (allocation.totalCost / maxAllocationCost) * 100,
                              3,
                            )
                          : 3;

                      const isClickable =
                        drillLevel === "cluster" || drillLevel === "namespace";

                      const handleClick = () => {
                        if (drillLevel === "cluster") {
                          openCluster(allocation.name);
                        } else if (drillLevel === "namespace") {
                          openNamespace(allocation.name);
                        }
                      };

                      return (
                        <button
                          key={allocation.name}
                          type="button"
                          onClick={handleClick}
                          disabled={!isClickable}
                          className={`cost-explorer-enter block w-full space-y-2 text-left ${
                            isClickable
                              ? "cursor-pointer rounded-md p-2 -m-2 transition-all duration-200 hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                              : "cursor-default"
                          }`}
                          style={{
                            animationDelay:
                              staggerDelays[index] ?? "420ms",
                          }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="min-w-0 truncate font-mono text-sm text-[var(--color-text)]">
                              {allocation.name}
                            </span>

                            <span className="flex shrink-0 items-center gap-2 text-sm font-medium text-[var(--color-text)]">
                              {formatCurrency(allocation.totalCost)}

                              {isClickable && (
                                <span
                                  aria-hidden="true"
                                  className="transition-transform duration-200 group-hover:translate-x-1"
                                >
                                  →
                                </span>
                              )}
                            </span>
                          </div>

                          <div className="-translate-y-1 h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">                            <div
                              className="cost-explorer-bar h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-500"
                              style={{
                                width: `${width}%`,
                                animationDelay:
                                  staggerDelays[index] ?? "420ms",
                              }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section
                aria-labelledby="resource-heading"
                className="cost-explorer-enter rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6 lg:p-7"
                style={{ animationDelay: "240ms" }}
              >
                <div className="space-y-1.5">
                  <h2
                    id="resource-heading"
                    className="text-lg font-semibold tracking-tight text-[var(--color-text)] sm:text-xl"
                  >
                    Resource cost breakdown
                  </h2>

                  <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                    Understand which resource categories are contributing to
                    total infrastructure spend.
                  </p>
                </div>

                {isPending ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                      <div
                        key={item}
                        className="cost-explorer-shimmer h-20 rounded-md"
                      />
                    ))}
                  </div>
                ) : allocations.length === 0 || primaryResourceTotal === 0 ? (
                  <div className="mt-6 flex min-h-32 items-center justify-center rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-6">
                    <p className="text-center text-sm text-[var(--color-text-muted)]">
                      Resource cost details are not available for this period.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {resourceBreakdown.map((resource, index) => {
                      const percentage =
                        totalCost > 0
                          ? (resource.value / totalCost) * 100
                          : 0;

                      return (
                        <div
                          key={resource.label}
                          className="cost-explorer-enter rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                          style={{
                            animationDelay:
                              staggerDelays[index] ?? "300ms",
                          }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-[var(--color-text-secondary)]">
                              {resource.label}
                            </span>

                            <span className="text-sm font-medium text-[var(--color-text)]">
                              {formatCurrency(resource.value)}
                            </span>
                          </div>

                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface)]">
                            <div
                              className="cost-explorer-bar h-full rounded-full bg-[var(--color-accent)]"
                              style={{
                                width: `${Math.min(
                                  Math.max(percentage, 0),
                                  100,
                                )}%`,
                                animationDelay:
                                  staggerDelays[index] ?? "300ms",
                              }}
                            />
                          </div>

                          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                            {percentage.toFixed(1)}% of total cost
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section
                aria-labelledby="explore-heading"
                className="cost-explorer-enter space-y-5"
                style={{ animationDelay: "300ms" }}
              >
                <div className="space-y-1.5">
                  <h2
                    id="explore-heading"
                    className="text-lg font-semibold tracking-tight text-[var(--color-text)] sm:text-xl"
                  >
                    Explore infrastructure spend
                  </h2>

                  <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                    Start with a cluster and drill down into namespaces and
                    pods.
                  </p>
                </div>

                {isPending ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="cost-explorer-shimmer h-40 rounded-lg border border-[var(--color-border)]"
                      />
                    ))}
                  </div>
                ) : allocations.length === 0 ? (
                  <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6">
                    <p className="max-w-sm text-center text-sm text-[var(--color-text-muted)]">
                      No {currentLevelLabel.toLowerCase()} are available for
                      this period.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {allocations.map((allocation, index) => {
                      const isClickable =
                        drillLevel === "cluster" || drillLevel === "namespace";

                      const handleClick = () => {
                        if (drillLevel === "cluster") {
                          openCluster(allocation.name);
                        } else if (drillLevel === "namespace") {
                          openNamespace(allocation.name);
                        }
                      };

                      return (
                        <button
                          key={allocation.name}
                          type="button"
                          onClick={handleClick}
                          disabled={!isClickable}
                          className={`cost-explorer-enter text-left ${
                            isClickable
                              ? "cursor-pointer"
                              : "cursor-default"
                          }`}
                          style={{
                            animationDelay:
                              staggerDelays[index] ?? "420ms",
                          }}
                        >
                          <article
                            className={`h-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition-all duration-300 ${
                              isClickable
                                ? "hover:-translate-y-1 hover:border-[var(--color-text-muted)] hover:shadow-lg focus-within:ring-2 focus-within:ring-[var(--color-focus-ring)]"
                                : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                                  {currentEntityLabel}
                                </p>

                                <h3 className="mt-2 truncate font-mono text-sm font-medium text-[var(--color-text)]">
                                  {allocation.name}
                                </h3>
                              </div>

                              <span className="shrink-0 rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors duration-200">
                                {formatPercentage(
                                  allocation.totalEfficiency,
                                )}
                              </span>
                            </div>

                            <div className="mt-6 flex items-end justify-between gap-4">
                              <div>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                  Total cost
                                </p>

                                <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--color-text)]">
                                  {formatCurrency(allocation.totalCost)}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-xs text-[var(--color-text-muted)]">
                                  CPU + RAM
                                </p>

                                <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">
                                  {formatCurrency(
                                    allocation.cpuCost + allocation.ramCost,
                                  )}
                                </p>
                              </div>
                            </div>

                            {isClickable && (
                              <p className="mt-5 text-xs font-medium text-[var(--color-accent)] transition-transform duration-200">
                                Explore{" "}
                                {drillLevel === "cluster"
                                  ? "namespaces"
                                  : "pods"}{" "}
                                →
                              </p>
                            )}
                          </article>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </section>
    </>
  );
}
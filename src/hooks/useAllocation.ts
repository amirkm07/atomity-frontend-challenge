"use client";

import { useQuery } from "@tanstack/react-query";
import type { OpenCostAllocationResponse } from "@/types/opencost";

type UseAllocationParams = {
  window?: string;
  aggregate?: "cluster" | "namespace" | "pod";
  step?: string;
  resolution?: string;
  filter?: string;
};

export function useAllocation({
  window = "7d",
  aggregate = "cluster",
  step,
  resolution,
  filter,
}: UseAllocationParams = {}) {
  return useQuery({
    queryKey: [
      "allocation",
      {
        window,
        aggregate,
        step,
        resolution,
        filter,
      },
    ],

    queryFn: async () => {
      const params = new URLSearchParams({
        window,
        aggregate,
      });

      if (step) {
        params.set("step", step);
      }

      if (resolution) {
        params.set("resolution", resolution);
      }

      if (filter) {
        params.set("filter", filter);
      }

      const response = await fetch(`/api/allocation?${params.toString()}`);

      let body: unknown = null;

      try {
        body = await response.json();
      } catch {
        // Leave body as null when the response is not valid JSON.
      }

      if (!response.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof body.error === "string"
            ? body.error
            : `Failed to load allocation data (${response.status}).`;

        throw new Error(message);
      }

      return body as OpenCostAllocationResponse;
    },

    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
import type { OpenCostAllocationResponse } from "@/types/opencost";

const OPENCOST_ALLOCATION_URL =
  "https://demo.infra.opencost.io/model/allocation";

export interface OpenCostAllocationParams {
  window: string;
  aggregate: "cluster" | "namespace" | "pod";
  step?: string;
  resolution?: string;
  filter?: string;
}

export async function fetchOpenCostAllocation(
  params: OpenCostAllocationParams = {
    window: "7d",
    aggregate: "cluster",
  },
): Promise<OpenCostAllocationResponse> {
  const url = new URL(OPENCOST_ALLOCATION_URL);

  url.searchParams.set("window", params.window);
  url.searchParams.set("aggregate", params.aggregate);

  if (params.step) {
    url.searchParams.set("step", params.step);
  }

  if (params.resolution) {
    url.searchParams.set("resolution", params.resolution);
  }

  if (params.filter) {
    url.searchParams.set("filter", params.filter);
  }

  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";

    throw new Error(
      `Failed to fetch OpenCost allocation data: ${message}`,
      {
        cause: error,
      },
    );
  }

  if (!response.ok) {
    throw new Error(
      `OpenCost allocation request failed with HTTP ${response.status} ${response.statusText}`.trim(),
    );
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch (error) {
    throw new Error(
      "Failed to parse the OpenCost allocation response as JSON.",
      {
        cause: error,
      },
    );
  }

  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid OpenCost allocation response structure.");
  }

  if (!("code" in body) || typeof body.code !== "number") {
    throw new Error(
      "Invalid OpenCost allocation response: code is not a number.",
    );
  }

  if (!("data" in body) || !Array.isArray(body.data)) {
    throw new Error(
      "Invalid OpenCost allocation response: data is not an array.",
    );
  }

  if (body.code !== 200) {
    throw new Error(
      `OpenCost allocation API returned a non-success code: ${body.code}`,
    );
  }

  return body as OpenCostAllocationResponse;
}
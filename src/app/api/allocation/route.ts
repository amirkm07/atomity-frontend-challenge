import { NextResponse } from "next/server";
import {
  fetchOpenCostAllocation,
  type OpenCostAllocationParams,
} from "@/lib/opencost";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const window = searchParams.get("window") ?? "7d";
  const aggregate = searchParams.get("aggregate") ?? "cluster";
  const step = searchParams.get("step");
  const resolution = searchParams.get("resolution");
  const filter = searchParams.get("filter");

  if (!window.trim()) {
    return NextResponse.json(
      { error: "Invalid window. Expected a non-empty string." },
      { status: 400 },
    );
  }

  if (
    aggregate !== "cluster" &&
    aggregate !== "namespace" &&
    aggregate !== "pod"
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid aggregate. Expected cluster, namespace, or pod.",
      },
      { status: 400 },
    );
  }

  if (step !== null && !step.trim()) {
    return NextResponse.json(
      { error: "Invalid step. Expected a non-empty string." },
      { status: 400 },
    );
  }

  if (resolution !== null && !resolution.trim()) {
    return NextResponse.json(
      { error: "Invalid resolution. Expected a non-empty string." },
      { status: 400 },
    );
  }

  if (filter !== null && !filter.trim()) {
    return NextResponse.json(
      { error: "Invalid filter. Expected a non-empty string." },
      { status: 400 },
    );
  }

  const params: OpenCostAllocationParams = {
    window,
    aggregate,
    ...(step !== null ? { step } : {}),
    ...(resolution !== null ? { resolution } : {}),
    ...(filter !== null ? { filter } : {}),
  };

  try {
    const data = await fetchOpenCostAllocation(params);

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load cost allocation data.";

    return NextResponse.json(
      {
        error: message || "Failed to load cost allocation data.",
      },
      { status: 500 },
    );
  }
}
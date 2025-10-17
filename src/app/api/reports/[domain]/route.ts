/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

import type { AnalysisJob } from "@/types/geo";
import dbConnect from "@/lib/dbConnect";
import { AnalysisJobModel } from "@/models/AnalysisJob";

function normalizeDomain(input: string): string {
  try {
    const urlish = input.includes("://") ? input : `https://${input}`;
    const u = new URL(urlish);
    return u.hostname.toLowerCase();
  } catch {
    return input.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ domain: string }> }
) {
  try {
    const { domain } = await props.params;
    console.log("[reports-by-domain] Fetching report for", domain);

    const raw = decodeURIComponent(domain || "");
    if (!raw) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    const host = normalizeDomain(raw);
    await dbConnect();

    // 24h window (use ISO strings; your schema stores createdAt as ISO string)
    const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Candidates that will match stored full URLs
    const candidates = [
      host,
      `https://${host}`,
      `http://${host}`,
      `https://www.${host}`,
      `http://www.${host}`,
    ];

    // Regex to catch any protocol/path variations, incl. www
    const safeRegex = new RegExp(`^https?://(www\\.)?${host.replace(/\./g, "\\.")}(/|$)`, "i");

    // Only consider jobs created in the last 24 hours
    const job = await AnalysisJobModel
      .findOne({
        createdAt: { $gte: sinceIso },
        $or: [
          { normalizedDomain: host }, // if/when present
          { urlHost: host },          // if/when present
          { url: { $in: candidates } },
          { url: { $regex: safeRegex } },
        ],
      })
      .sort([["createdAt", -1]]) // newest within the 24h window
      .lean<AnalysisJob>()
      .exec();

    if (!job) {
      // No job in last 24h => allow a new analysis
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // If there is a job in the 24h window:
    if (job.status !== "COMPLETED") {
      // still running or failed within 24h -> surface status (client can resume or show error)
      return NextResponse.json(
        { status: job.status, jobId: (job as any).id || (job as any)._id },
        { status: 200 }
      );
    }

    // Completed in the last 24h -> reuse it (client will redirect to /report/[domain])
    return NextResponse.json({ status: job.status, job }, { status: 200 });
  } catch (err) {
    console.error("[reports-by-domain] error", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

import { listSources } from "@/lib/rag/sources";

/* GET /api/rag/sources/ — knowledge documents + passage counts (public, no secrets). */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sources = await listSources();
    return Response.json({ sources }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch (error) {
    console.error("[rag] sources failed:", error);
    return Response.json({ sources: [] }, { status: 503 });
  }
}

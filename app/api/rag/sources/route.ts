import { isDemoId } from "@/app/data/rag-demos";
import { listSources } from "@/lib/rag/sources";

/* GET /api/rag/sources/?tenant=saas — knowledge documents + passage counts (public, no secrets). */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("tenant") ?? "jaseir";
  if (!isDemoId(requested)) return Response.json({ sources: [] }, { status: 400 });
  try {
    const sources = await listSources(requested);
    return Response.json({ sources }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch (error) {
    console.error("[rag] sources failed:", error);
    return Response.json({ sources: [] }, { status: 503 });
  }
}

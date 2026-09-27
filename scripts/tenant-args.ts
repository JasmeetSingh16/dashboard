/* ------------------------------------------------------------------ */
/* Shared CLI flags for the RAG scripts                                */
/* ------------------------------------------------------------------ */
/*
 *   (no flag)          → jaseir (Jaseir's own knowledge)
 *   --tenant <name>    → one tenant: jaseir, saas, ecommerce, clinic, realestate
 *   --all              → every tenant
 */
import { DEMO_IDS, isDemoId, type DemoId } from "../app/data/rag-demos";

export function tenantsFromArgs(argv: string[]): DemoId[] {
  if (argv.includes("--all")) return DEMO_IDS;
  const i = argv.indexOf("--tenant");
  if (i < 0) return ["jaseir"];
  const name = argv[i + 1];
  if (!isDemoId(name)) {
    throw new Error(`Unknown tenant "${name ?? ""}". Use one of: ${DEMO_IDS.join(", ")} (or --all).`);
  }
  return [name];
}

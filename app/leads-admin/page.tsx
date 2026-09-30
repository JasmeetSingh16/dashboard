import type { Metadata } from "next";
import LeadsAdmin from "./LeadsAdmin";
import "./leads-admin.css";

/* ------------------------------------------------------------------ */
/* /leads-admin/ — every lead (agent report form + RAG demo form)      */
/* ------------------------------------------------------------------ */
/*
 * The page itself holds no data: it asks for the LEADS_ADMIN_KEY and
 * fetches /api/agent-leads/ with it in a header (never in the URL).
 */

export const metadata: Metadata = {
  title: "Leads",
  robots: { index: false, follow: false },
};

export default function LeadsAdminPage() {
  return (
    <main className="la-page">
      <LeadsAdmin />
    </main>
  );
}

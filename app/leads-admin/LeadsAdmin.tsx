"use client";

import { useEffect, useState, type FormEvent } from "react";

type Lead = Record<string, string | boolean | null> & { id: string };

const KEY_STORAGE = "jaseir:leads-admin-key";
const API = "/api/agent-leads/";

const columns: { key: string; label: string }[] = [
  { key: "created_at", label: "Date" },
  { key: "source", label: "Source" },
  { key: "agent", label: "Agent" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "website", label: "Website" },
  { key: "agent_input", label: "Input" },
  { key: "result_summary", label: "Result" },
  { key: "message", label: "Message" },
];

function readKey(): string {
  try {
    return window.sessionStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

function storeKey(key: string) {
  try {
    if (key) window.sessionStorage.setItem(KEY_STORAGE, key);
    else window.sessionStorage.removeItem(KEY_STORAGE);
  } catch {
    /* storage unavailable — key kept in memory only */
  }
}

function show(lead: Lead, key: string): string {
  const value = lead[key];
  if (value === null || value === undefined || value === "") return key === "source" ? "demo_form" : "—";
  if (key === "created_at") return new Date(String(value)).toLocaleString();
  return String(value);
}

export default function LeadsAdmin() {
  const [key, setKey] = useState("");
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  /** Fetches the leads. No state changes here — see apply(). */
  async function fetchLeads(adminKey: string): Promise<{ leads: Lead[] } | { error: string }> {
    try {
      const response = await fetch(API, { headers: { "x-admin-key": adminKey }, cache: "no-store" });
      if (response.status === 404) return { error: "The leads admin is off. Set LEADS_ADMIN_KEY on the server." };
      if (response.status === 401) return { error: "Wrong key." };
      if (!response.ok) return { error: "Could not load leads. Check the server log." };
      return (await response.json()) as { leads: Lead[] };
    } catch {
      return { error: "Could not load leads." };
    }
  }

  function apply(adminKey: string, result: { leads: Lead[] } | { error: string }) {
    setBusy(false);
    if ("error" in result) {
      setLeads(null);
      storeKey("");
      setError(result.error);
      return;
    }
    setLeads(result.leads);
    setKey(adminKey);
    setError("");
    storeKey(adminKey);
  }

  useEffect(() => {
    const saved = readKey();
    if (saved) void fetchLeads(saved).then((result) => apply(saved, result));
  }, []);

  function reload(adminKey: string) {
    setBusy(true);
    setError("");
    void fetchLeads(adminKey).then((result) => apply(adminKey, result));
  }

  async function downloadCsv() {
    setError("");
    try {
      const response = await fetch(`${API}?format=csv`, { headers: { "x-admin-key": key }, cache: "no-store" });
      if (!response.ok) throw new Error("Could not export leads.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `jaseir-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not export leads.");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (key.trim()) reload(key.trim());
  }

  return (
    <div className="la-inner">
      <h1>Leads</h1>

      {leads === null ? (
        <form className="la-login" onSubmit={onSubmit}>
          <label htmlFor="la-key">Admin key</label>
          <input
            id="la-key"
            type="password"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            autoComplete="current-password"
            required
          />
          <button type="submit" disabled={busy}>
            {busy ? "Loading…" : "Show leads"}
          </button>
        </form>
      ) : (
        <>
          <div className="la-toolbar">
            <p>
              {leads.length} lead{leads.length === 1 ? "" : "s"}, newest first
            </p>
            <button type="button" onClick={() => reload(key)} disabled={busy}>
              Refresh
            </button>
            <button type="button" onClick={() => void downloadCsv()}>
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => {
                storeKey("");
                setKey("");
                setLeads(null);
              }}
            >
              Lock
            </button>
          </div>

          <div className="la-table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    {columns.map((column) => (
                      <td key={column.key}>
                        {column.key === "email" && lead.email ? (
                          <a href={`mailto:${lead.email}`}>{String(lead.email)}</a>
                        ) : (
                          show(lead, column.key)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {error && (
        <p className="la-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

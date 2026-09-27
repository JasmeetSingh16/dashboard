"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  LEAD_INDUSTRIES,
  leadCopy,
  validateLead,
  type LeadErrors,
  type LeadIndustry,
  type LeadInput,
} from "@/app/lib/leads";

/* ------------------------------------------------------------------ */
/* Lead form modal — centred dialog on desktop, bottom sheet on mobile  */
/* ------------------------------------------------------------------ */
/*
 * Closes on Esc, outside click and the × button; focus stays inside the
 * dialog while it is open. Errors show inline under each field (after the
 * field is left, and for every field on submit). A hidden honeypot field
 * ("fax") catches simple bots.
 */

type Status = "idle" | "sending" | "success" | "error" | "rate-limited";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select, textarea';

export default function LeadModal({ industry, onClose }: { industry: LeadIndustry; onClose: () => void }) {
  const id = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  // Render inside the page's themed wrapper so the design tokens apply.
  // (The modal only mounts after a click, so `document` exists.)
  const [host] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : (document.querySelector<HTMLElement>(".rag-page") ?? document.body),
  );
  const [values, setValues] = useState<LeadInput>({
    name: "",
    email: "",
    company: "",
    website: "",
    industry,
    phone: "",
    message: "",
    consent: false,
  });
  const [touched, setTouched] = useState<Partial<Record<keyof LeadInput, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<LeadErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [honeypot, setHoneypot] = useState("");
  // Parents may re-render (e.g. card hover); keep the latest onClose without re-running effects.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  const errors = { ...validateLead(values), ...serverErrors };
  const showError = (field: keyof LeadInput) => (touched[field] ? errors[field] : undefined);

  // Lock page scroll, focus the first field, Esc to close, keep Tab inside.
  useEffect(() => {
    if (!host) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>(".lead-form input")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const items = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [host]);

  // Move focus to the result message after sending.
  useEffect(() => {
    if (status === "success") dialogRef.current?.querySelector<HTMLElement>(".lead-success button")?.focus();
  }, [status]);

  const set = <K extends keyof LeadInput>(field: K, value: LeadInput[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (serverErrors[field]) setServerErrors((current) => ({ ...current, [field]: undefined }));
  };
  const blur = (field: keyof LeadInput) => setTouched((current) => ({ ...current, [field]: true }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (status === "sending") return;

    const found = validateLead(values);
    if (Object.keys(found).length > 0) {
      setTouched({ name: true, email: true, company: true, website: true, industry: true, phone: true, message: true, consent: true });
      const first = Object.keys(found)[0];
      dialogRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("/api/leads/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, fax: honeypot, sourcePage: window.location.pathname }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; errors?: LeadErrors; reason?: string };
      if (response.ok && data.ok) {
        setStatus("success");
      } else if (response.status === 400 && data.errors) {
        setServerErrors(data.errors);
        setTouched({ name: true, email: true, company: true, website: true, industry: true, phone: true, message: true, consent: true });
        setStatus("idle");
      } else {
        setStatus(data.reason === "rate-limited" ? "rate-limited" : "error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (!host) return null;

  const field = (name: "name" | "email" | "company" | "website", type: string, required: boolean, autoComplete: string) => {
    const error = showError(name);
    return (
      <div className={`lead-field ${error ? "has-error" : ""}`}>
        <label htmlFor={`${id}-${name}`}>
          {leadCopy.fields[name]}
          {required ? <span className="lead-req" aria-hidden="true"> *</span> : <span className="lead-opt"> ({leadCopy.optional})</span>}
        </label>
        <input
          id={`${id}-${name}`}
          name={name}
          type={type}
          value={values[name]}
          placeholder={leadCopy.placeholders[name]}
          autoComplete={autoComplete}
          required={required}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-${name}-error` : undefined}
          onChange={(event) => set(name, event.target.value)}
          onBlur={() => blur(name)}
        />
        {error && (
          <p className="lead-error" id={`${id}-${name}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  };

  const industryError = showError("industry");
  const phoneError = showError("phone");
  const messageError = showError("message");
  const consentError = showError("consent");

  return createPortal(
    <div
      className="lead-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="lead-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        ref={dialogRef}
      >
        <button type="button" className="lead-close" onClick={onClose} aria-label={leadCopy.close}>
          <span aria-hidden="true">×</span>
        </button>

        {status === "success" ? (
          <div className="lead-success" role="status">
            <span className="lead-success-icon" aria-hidden="true">✓</span>
            <h2 id={`${id}-title`}>{leadCopy.success}</h2>
            <button type="button" className="primary-button rag-btn-primary" onClick={onClose}>
              {leadCopy.back}
            </button>
          </div>
        ) : (
          <>
            <h2 id={`${id}-title`}>{leadCopy.title}</h2>
            <p className="lead-intro">{leadCopy.intro}</p>

            <form className="lead-form" onSubmit={submit} noValidate>
              <div className="lead-grid">
                {field("name", "text", true, "name")}
                {field("email", "email", true, "email")}
                {field("company", "text", true, "organization")}
                {field("website", "text", false, "url")}

                <div className={`lead-field ${industryError ? "has-error" : ""}`}>
                  <label htmlFor={`${id}-industry`}>
                    {leadCopy.fields.industry}
                    <span className="lead-req" aria-hidden="true"> *</span>
                  </label>
                  <select
                    id={`${id}-industry`}
                    name="industry"
                    value={values.industry}
                    required
                    aria-invalid={Boolean(industryError)}
                    aria-describedby={industryError ? `${id}-industry-error` : undefined}
                    onChange={(event) => set("industry", event.target.value)}
                    onBlur={() => blur("industry")}
                  >
                    {LEAD_INDUSTRIES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {industryError && (
                    <p className="lead-error" id={`${id}-industry-error`}>
                      {industryError}
                    </p>
                  )}
                </div>

                <div className={`lead-field ${phoneError ? "has-error" : ""}`}>
                  <label htmlFor={`${id}-phone`}>
                    {leadCopy.fields.phone}
                    <span className="lead-opt"> ({leadCopy.optional})</span>
                  </label>
                  <input
                    id={`${id}-phone`}
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    value={values.phone}
                    placeholder={leadCopy.placeholders.phone}
                    autoComplete="tel"
                    aria-invalid={Boolean(phoneError)}
                    aria-describedby={`${id}-phone-${phoneError ? "error" : "hint"}`}
                    onChange={(event) => set("phone", event.target.value)}
                    onBlur={() => blur("phone")}
                  />
                  {phoneError ? (
                    <p className="lead-error" id={`${id}-phone-error`}>
                      {phoneError}
                    </p>
                  ) : (
                    <p className="lead-hint" id={`${id}-phone-hint`}>
                      {leadCopy.phoneHint}
                    </p>
                  )}
                </div>
              </div>

              <div className={`lead-field ${messageError ? "has-error" : ""}`}>
                <label htmlFor={`${id}-message`}>
                  {leadCopy.fields.message}
                  <span className="lead-opt"> ({leadCopy.optional})</span>
                </label>
                <textarea
                  id={`${id}-message`}
                  name="message"
                  rows={3}
                  value={values.message}
                  placeholder={leadCopy.placeholders.message}
                  aria-invalid={Boolean(messageError)}
                  aria-describedby={messageError ? `${id}-message-error` : undefined}
                  onChange={(event) => set("message", event.target.value)}
                  onBlur={() => blur("message")}
                />
                {messageError && (
                  <p className="lead-error" id={`${id}-message-error`}>
                    {messageError}
                  </p>
                )}
              </div>

              {/* Honeypot — hidden from people and screen readers. */}
              <div className="lead-hp" aria-hidden="true">
                <label htmlFor={`${id}-fax`}>Fax</label>
                <input
                  id={`${id}-fax`}
                  name="fax"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                />
              </div>

              <div className={`lead-consent ${consentError ? "has-error" : ""}`}>
                <label>
                  <input
                    type="checkbox"
                    name="consent"
                    checked={values.consent}
                    required
                    aria-invalid={Boolean(consentError)}
                    aria-describedby={consentError ? `${id}-consent-error` : undefined}
                    onChange={(event) => {
                      set("consent", event.target.checked);
                      blur("consent");
                    }}
                  />
                  <span>
                    {leadCopy.consent}
                    <span className="lead-req" aria-hidden="true"> *</span>{" "}
                    <a href={leadCopy.privacyUrl} target="_blank" rel="noopener">
                      {leadCopy.privacyLabel}
                    </a>
                  </span>
                </label>
                {consentError && (
                  <p className="lead-error" id={`${id}-consent-error`}>
                    {consentError}
                  </p>
                )}
              </div>

              {(status === "error" || status === "rate-limited") && (
                <p className="lead-alert" role="alert">
                  {status === "rate-limited" ? leadCopy.rateLimited : leadCopy.error}
                </p>
              )}

              <button type="submit" className="primary-button rag-btn-primary lead-submit" disabled={status === "sending"}>
                {status === "sending" ? leadCopy.sending : leadCopy.submit}
                {status !== "sending" && <span aria-hidden="true">→</span>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    host,
  );
}

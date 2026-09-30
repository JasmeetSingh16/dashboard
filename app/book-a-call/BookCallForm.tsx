"use client";

import { ArrowRight, CircleCheck, TriangleAlert } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { bookCallCopy, validateBookCall, type BookCallErrors, type BookCallInput } from "../lib/book-call";

type Status = "idle" | "sending" | "sent";

const empty: BookCallInput = { name: "", email: "", phone: "", website: "", need: "", time: "" };

export default function BookCallForm({ whatsappUrl }: { whatsappUrl: string }) {
  const id = useId();
  const [values, setValues] = useState<BookCallInput>(empty);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<BookCallErrors>({});
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateBookCall(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = (["name", "email", "phone", "website", "need", "time"] as const).find((field) => found[field]);
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }

    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/book-call/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, fax: honeypot, pageUrl: window.location.href }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; errors?: BookCallErrors; reason?: string };
      if (response.ok && data.ok) {
        setStatus("sent");
        return;
      }
      if (data.errors) setErrors(data.errors);
      setMessage(data.reason === "rate-limited" ? bookCallCopy.rateLimited : data.errors ? "" : bookCallCopy.error);
    } catch {
      setMessage(bookCallCopy.error);
    }
    setStatus("idle");
  }

  if (status === "sent") {
    return (
      <div className="jk-card jk-card-pad bac-card bac-sent" role="status">
        <CircleCheck size={32} aria-hidden="true" className="bac-sent-icon" />
        <h2 className="bac-card-title">{bookCallCopy.successTitle}</h2>
        <p className="bac-step-text">{bookCallCopy.successText}</p>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="jk-btn jk-btn--ghost">
          {bookCallCopy.whatsapp}
        </a>
      </div>
    );
  }

  const field = (
    name: keyof BookCallInput,
    { type = "text", autoComplete, optional = false, multiline = false, hint }: {
      type?: string;
      autoComplete?: string;
      optional?: boolean;
      multiline?: boolean;
      hint?: string;
    } = {},
  ) => {
    const common = {
      id: `${id}-${name}`,
      value: values[name],
      placeholder: bookCallCopy.placeholders[name],
      required: !optional,
      "aria-invalid": errors[name] ? true : undefined,
      "aria-describedby": errors[name] ? `${id}-${name}-error` : hint ? `${id}-${name}-hint` : undefined,
    } as const;
    const onChange = (value: string) => setValues((current) => ({ ...current, [name]: value }));
    return (
      <div className="jk-field">
        <label htmlFor={`${id}-${name}`} className="jk-label">
          {bookCallCopy.fields[name]}
          {optional && <small>{bookCallCopy.optional}</small>}
        </label>
        {multiline ? (
          <textarea {...common} rows={4} maxLength={1500} className="jk-textarea" onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input
            {...common}
            type={type}
            autoComplete={autoComplete}
            maxLength={name === "email" ? 254 : 200}
            className="jk-input"
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        {errors[name] ? (
          <p id={`${id}-${name}-error`} className="jk-gate-field-error">
            {errors[name]}
          </p>
        ) : (
          hint && (
            <p id={`${id}-${name}-hint`} className="jk-hint">
              {hint}
            </p>
          )
        )}
      </div>
    );
  };

  return (
    <form className="jk-card jk-card-pad bac-card" onSubmit={onSubmit} noValidate>
      <div className="bac-row">
        {field("name", { autoComplete: "name" })}
        {field("email", { type: "email", autoComplete: "email" })}
      </div>
      <div className="bac-row">
        {field("phone", { type: "tel", autoComplete: "tel", optional: true, hint: bookCallCopy.phoneHint })}
        {field("website", { autoComplete: "url", optional: true })}
      </div>
      {field("need", { multiline: true })}
      {field("time", { optional: true })}

      {/* Honeypot: hidden from people, bots fill it in. */}
      <div className="jk-gate-hp" aria-hidden="true">
        <label htmlFor={`${id}-fax`}>Fax</label>
        <input id={`${id}-fax`} name="fax" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      {message && (
        <p className="jk-error" role="alert">
          <TriangleAlert size={18} aria-hidden="true" className="mt-px shrink-0" />
          {message}
        </p>
      )}

      <button type="submit" className="jk-btn jk-btn--primary jk-btn--lg jk-btn--block" disabled={status === "sending"}>
        {status === "sending" ? bookCallCopy.sending : bookCallCopy.submit}
        {status !== "sending" && <ArrowRight size={18} aria-hidden="true" />}
      </button>

      <p className="jk-fineprint">
        {bookCallCopy.consent}{" "}
        <a href="/privacy/" target="_blank" rel="noopener">
          {bookCallCopy.privacyLabel}
        </a>
      </p>
    </form>
  );
}

"use client";

import { useRef, useState, type ReactNode } from "react";
import type { LeadIndustry } from "@/app/lib/leads";
import LeadModal from "./LeadModal";

/*
 * A button that opens the "Get one for your business" lead form in a
 * modal, with the industry pre-selected. Server components can render it.
 */
export default function LeadButton({
  className,
  industry = "other",
  children,
}: {
  className?: string;
  industry?: LeadIndustry;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        className={className}
        aria-haspopup="dialog"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {children}
      </button>
      {open && (
        <LeadModal
          industry={industry}
          onClose={() => {
            setOpen(false);
            buttonRef.current?.focus();
          }}
        />
      )}
    </>
  );
}

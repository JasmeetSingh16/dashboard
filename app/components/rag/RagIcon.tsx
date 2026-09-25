/* Line icons for the RAG page — same 24px / 1.8 stroke style as the home page icons. */

const paths: Record<string, React.ReactNode> = {
  doc: (
    <>
      <path d="M7 3.5h7l4 4V20.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v4h4M8.5 13h7M8.5 16.3h5" />
    </>
  ),
  pricing: (
    <>
      <path d="M3.5 12V4.5a1 1 0 0 1 1-1H12l8.5 8.5-8.5 8.5L3.5 12Z" />
      <circle cx="8.2" cy="8.2" r="1.5" />
    </>
  ),
  faq: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.5M12 16.8v.2" />
    </>
  ),
  policy: (
    <>
      <path d="M12 3.5 5 6.3v5.2c0 4.3 3 7.8 7 9 4-1.2 7-4.7 7-9V6.3l-7-2.8Z" />
      <path d="m9 12 2.2 2.2L15.3 10" />
    </>
  ),
  website: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.3 2.3 3.5 5.3 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.3-3.5-8.5S9.7 5.8 12 3.5Z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 3 19.5h18L12 4Z" />
      <path d="M12 10v4.2M12 17v.2" />
    </>
  ),
  send: <path d="M4 12 20 4l-5 16-3.5-6.5L4 12Z" />,
  bolt: <path d="M13 3 5 13.5h5.3L11 21l8-10.8h-5.3L13 3Z" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3M12 14.5v2.5" />
    </>
  ),
  refresh: <path d="M19.5 7.5A8 8 0 1 0 20 13M19.5 3.5v4h-4" />,
  expand: <path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15" />,
  collapse: <path d="M9 4.5V9H4.5M19.5 9H15V4.5M15 19.5V15h4.5M4.5 15H9v4.5" />,
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c.8-3.6 3.8-5.6 7.5-5.6s6.7 2 7.5 5.6" />
    </>
  ),
  thumbUp: <path d="M7.5 10.5v9h-3v-9h3Zm0 0 3.8-6.2c.9-.1 2.2.6 2 2.2l-.6 3.5h4.8c1.2 0 2.1 1.1 1.8 2.3l-1.5 6c-.2.8-1 1.4-1.8 1.4H7.5" />,
  thumbDown: <path d="M7.5 13.5v-9h-3v9h3Zm0 0 3.8 6.2c.9.1 2.2-.6 2-2.2l-.6-3.5h4.8c1.2 0 2.1-1.1 1.8-2.3l-1.5-6c-.2-.8-1-1.4-1.8-1.4H7.5" />,
  check: <path d="m5 12.5 4.2 4.2L19 7" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chat: <path d="M4.5 5.5h15v10h-9l-4.5 3.5v-3.5H4.5v-10Z" />,
  users: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2M16 5.8a3 3 0 0 1 0 5.6M17.5 13.9c1.8.6 3 2.4 3 4.6" />
    </>
  ),
  sparkle: <path d="M12 3.5 13.5 9 19 10.5 13.5 12 12 17.5 10.5 12 5 10.5 10.5 9 12 3.5Z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5.5" rx="7" ry="2.7" />
      <path d="M5 5.5v13c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7v-13M5 12c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15l1.5-2Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  building: (
    <>
      <path d="M4.5 20.5V5.5l8-2v17M12.5 8.5l7 2.5v9.5M3 20.5h18" />
      <path d="M7.5 8.5h2M7.5 12h2M7.5 15.5h2M15.5 13.5h1.5M15.5 17h1.5" />
    </>
  ),
  health: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 8.5v7M8.5 12h7" />
    </>
  ),
  book: (
    <>
      <path d="M4.5 5.5c2.5-1 5-1 7.5.8v13.2c-2.5-1.8-5-1.8-7.5-.8V5.5ZM19.5 5.5c-2.5-1-5-1-7.5.8v13.2c2.5-1.8 5-1.8 7.5-.8V5.5Z" />
    </>
  ),
  cart: (
    <>
      <path d="M3.5 4.5h2.2l2.2 10.5h10.2l1.9-7.5H6.6" />
      <circle cx="9.5" cy="19" r="1.3" />
      <circle cx="16.5" cy="19" r="1.3" />
    </>
  ),
  file: (
    <>
      <path d="M7 3.5h7l4 4V20.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M9 12.5h6M9 16h6M9 9h2" />
    </>
  ),
  bed: (
    <>
      <path d="M3.5 18.5v-12M3.5 14.5h17v4M20.5 14.5v-3a3 3 0 0 0-3-3h-6v6" />
      <circle cx="7.5" cy="11" r="1.8" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6l-3.9.9Z" />
      <path d="M9.3 8.6c.2-.5.8-.6 1-.2l.7 1.5c.1.3 0 .6-.2.8l-.4.4c.5 1.1 1.4 2 2.5 2.5l.4-.4c.2-.2.5-.3.8-.2l1.5.7c.4.2.3.8-.2 1a3 3 0 0 1-2.9-.2 7.4 7.4 0 0 1-3.2-3.2 3 3 0 0 1 0-2.7Z" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="M16.8 7.2v.1" />
    </>
  ),
};

export default function RagIcon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name] ?? paths.doc}
    </svg>
  );
}

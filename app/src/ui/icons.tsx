// Door and window glyphs drawn for this app; the rest of the icons come from lucide (ISC licence).
type P = { size?: number; open?: boolean };

export function DoorIcon({ size = 16, open }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {open ? (
        <>
          <path d="M4 21V4l9-2v19" />
          <path d="M13 21h7M17 12v.01" />
          <path d="M4 21h9" />
        </>
      ) : (
        <>
          <rect x="5" y="3" width="14" height="18" rx="1" />
          <path d="M15 12v.01" />
          <path d="M3 21h18" />
        </>
      )}
    </svg>
  );
}

export function WindowIcon({ size = 16, open }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {open ? (
        <>
          <path d="M4 4h16v16H4z" />
          <path d="M4 12h8V4M12 20v-8h8" opacity=".45" />
          <path d="M14 14l5-5" />
        </>
      ) : (
        <>
          <rect x="4" y="4" width="16" height="16" rx="1" />
          <path d="M12 4v16M4 12h16" />
        </>
      )}
    </svg>
  );
}

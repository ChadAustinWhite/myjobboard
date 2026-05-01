const stroke = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 22,
  height: 22,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconHome({ className }: { className?: string }) {
  return (
    <svg {...stroke} className={className} viewBox="0 0 24 24" aria-hidden>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function IconBolt({ className }: { className?: string }) {
  return (
    <svg {...stroke} className={className} viewBox="0 0 24 24" aria-hidden>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function IconCheck({ className }: { className?: string }) {
  return (
    <svg {...stroke} className={className} viewBox="0 0 24 24" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconBubble({ className }: { className?: string }) {
  return (
    <svg {...stroke} className={className} viewBox="0 0 24 24" aria-hidden>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 5V9a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6Z" />
    </svg>
  );
}

export function IconRepeat({ className }: { className?: string }) {
  return (
    <svg {...stroke} className={className} viewBox="0 0 24 24" aria-hidden>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function IconHeart({ className }: { className?: string }) {
  return (
    <svg {...stroke} className={className} viewBox="0 0 24 24" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-9.74a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

export function IconShare({ className }: { className?: string }) {
  return (
    <svg {...stroke} className={className} viewBox="0 0 24 24" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}

export function IconSearch({ className }: { className?: string }) {
  return (
    <svg {...stroke} className={className} viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/** Sliders / settings — recognizable at small tap targets in the header. */
export function IconSliders({ className }: { className?: string }) {
  return (
    <svg {...stroke} className={className} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 21v-6" />
      <path d="M12 9V3" />
      <circle cx="12" cy="12" r="2" />
      <path d="M19 21v-5" />
      <path d="M19 10V3" />
      <circle cx="19" cy="8" r="2" />
      <path d="M5 21v-9" />
      <path d="M5 8V3" />
      <circle cx="5" cy="14" r="2" />
    </svg>
  );
}

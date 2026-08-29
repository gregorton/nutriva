/*
  Hand-rolled icon set — a handful of 1.5px-stroke glyphs is cheaper than a dependency
  and keeps the line weight consistent with the hairline rules used across the UI.
*/
type IconProps = { className?: string };

const base = "h-4 w-4";

export function SearchIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <circle cx="8.5" cy="8.5" r="5.25" />
      <path d="m12.5 12.5 4 4" strokeLinecap="round" />
    </svg>
  );
}

export function CartIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M2.5 3h1.8l1.9 9.4h9.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.2 10.2h9.6l1.2-5.2H5.2" strokeLinejoin="round" />
      <circle cx="7.6" cy="16.2" r="1.3" />
      <circle cx="14.4" cy="16.2" r="1.3" />
    </svg>
  );
}

export function UserIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <circle cx="10" cy="7" r="3.2" />
      <path d="M4 16.5c1.2-2.6 3.3-3.9 6-3.9s4.8 1.3 6 3.9" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="m6 8 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M4 10h11m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="m4.5 10.5 3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShieldIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M10 2.5 16 4.6v5c0 3.6-2.4 6.4-6 7.9-3.6-1.5-6-4.3-6-7.9v-5L10 2.5Z" strokeLinejoin="round" />
      <path d="m7.4 9.8 2 2 3.4-3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FlaskIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M8 2.5h4v4.2l3.6 7.3a2 2 0 0 1-1.8 2.9H6.2a2 2 0 0 1-1.8-2.9L8 6.7V2.5Z" strokeLinejoin="round" />
      <path d="M6.3 11.5h7.4" strokeLinecap="round" />
    </svg>
  );
}

export function TruckIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M2.5 5.5h8v8h-8z" strokeLinejoin="round" />
      <path d="M10.5 8.5h3.2l2.8 2.6v2.4h-6z" strokeLinejoin="round" />
      <circle cx="6" cy="15.4" r="1.4" />
      <circle cx="13.6" cy="15.4" r="1.4" />
    </svg>
  );
}

export function LeafIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M16.5 3.5c0 6.5-3.9 10.4-9.4 10.4H4.6c0-6.1 4-10.4 11.9-10.4Z" strokeLinejoin="round" />
      <path d="M4 17c1.6-4.3 4.6-7.4 8.6-9.2" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="m5.5 5.5 9 9m0-9-9 9" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronRightIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="m8 6 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* The tooltip mark the reference site puts beside anything a shopper might query. */
export function InfoIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 9v4.5" strokeLinecap="round" />
      <path d="M10 6.4v.6" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

/** Reveal a password. Its pair below is the same eye with the lid closed and a stroke through it. */
export function EyeIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M1.9 10S5 4.9 10 4.9 18.1 10 18.1 10 15 15.1 10 15.1 1.9 10 1.9 10Z" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  );
}

export function EyeOffIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path
        d="M7.3 5.4A7.9 7.9 0 0 1 10 4.9c5 0 8.1 5.1 8.1 5.1a15 15 0 0 1-2.4 2.9M12.6 14.6a7.9 7.9 0 0 1-2.6.5c-5 0-8.1-5.1-8.1-5.1a15 15 0 0 1 3-3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.3 8.3a2.5 2.5 0 0 0 3.4 3.4" strokeLinecap="round" />
      <path d="m3.5 3.5 13 13" strokeLinecap="round" />
    </svg>
  );
}

export function MinusIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M5 10h10" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M10 5v10M5 10h10" strokeLinecap="round" />
    </svg>
  );
}

/* Filled + outline: at PDP size a five-star row has to read as a rating.
   `filled` gives a solid fill with a slightly darker stroke so the edge
   reads as a subtle outline even on yellow; `false` gives a white interior
   with a colored stroke for the empty track. */
export function StarIcon({ className = base, filled = true }: IconProps & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "white"}
      stroke={filled ? "#c99700" : "currentColor"}
      strokeWidth={filled ? 1 : 1.15}
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M10 1.9l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.51l-4.94 2.59.94-5.49-4-3.9 5.53-.8L10 1.9Z" />
    </svg>
  );
}

/* Sales momentum, mirroring the reference's up-and-right spark beside "sold in 30 days". */
export function TrendIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M2.5 13.5l4.2-4.2 3 3L16 6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.4 6.5H16v3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/*
  Diet and standards marks. Geometric rather than pictorial for the certification badges —
  a shape plus its label carries the claim without borrowing a certifier's device.
*/
export function SproutIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M10 17.5v-6.4" strokeLinecap="round" />
      <path d="M10 11.1C10 8.4 8.1 6.6 5 6.6c0 2.7 1.9 4.5 5 4.5Z" strokeLinejoin="round" />
      <path d="M10 11.1c0-2.7 1.9-4.5 5-4.5 0 2.7-1.9 4.5-5 4.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function CircleSlashIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <circle cx="10" cy="10" r="7.25" />
      <path d="m5.4 14.6 9.2-9.2" strokeLinecap="round" />
    </svg>
  );
}

/* Filled rather than stroked, both of them: at the 11px the hero's rotation toggle draws them, a
   1.5px outline of a triangle is a smudge. */
export function PauseIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <rect x="6.2" y="4.6" width="2.9" height="10.8" rx="1" />
      <rect x="10.9" y="4.6" width="2.9" height="10.8" rx="1" />
    </svg>
  );
}

export function PlayIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M6.6 4.9c0-.8.9-1.3 1.6-.9l7.1 4.3c.6.4.6 1.3 0 1.7l-7.1 4.3c-.7.4-1.6-.1-1.6-.9V4.9Z" />
    </svg>
  );
}

export function SunIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <circle cx="10" cy="10" r="3.6" />
      <path d="M10 2.6v1.7M10 15.7v1.7M2.6 10h1.7M15.7 10h1.7M4.8 4.8l1.2 1.2M14 14l1.2 1.2M15.2 4.8 14 6M6 14l-1.2 1.2" strokeLinecap="round" />
    </svg>
  );
}

export function GrainIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M10 17.4V6.2" strokeLinecap="round" />
      <path d="M10 6.2c1.6-1.1 2.6-2.4 2.6-3.7-1.6 0-2.6 1.2-2.6 3.7Zm0 0C8.4 5.1 7.4 3.8 7.4 2.5c1.6 0 2.6 1.2 2.6 3.7Z" strokeLinejoin="round" />
      <path d="M10 10.5c1.7 0 3-1.1 3-2.8-1.7 0-3 1.1-3 2.8Zm0 0c-1.7 0-3-1.1-3-2.8 1.7 0 3 1.1 3 2.8Z" strokeLinejoin="round" />
      <path d="M10 14.6c1.7 0 3-1.1 3-2.8-1.7 0-3 1.1-3 2.8Zm0 0c-1.7 0-3-1.1-3-2.8 1.7 0 3 1.1 3 2.8Z" strokeLinejoin="round" />
    </svg>
  );
}

export function HexBadgeIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M10 2.4 16.3 6v8L10 17.6 3.7 14V6L10 2.4Z" strokeLinejoin="round" />
      <path d="m7.5 12.6 2-2.6 2 2.6M9.5 10 7.6 7.4h3.8L9.5 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OctagonBadgeIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M7.2 2.6h5.6l4.6 4.6v5.6l-4.6 4.6H7.2l-4.6-4.6V7.2l4.6-4.6Z" strokeLinejoin="round" />
      <path d="m7.2 10.2 2 2 3.6-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ThermometerIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M11.6 11.3V4.4a1.9 1.9 0 1 0-3.8 0v6.9a3.4 3.4 0 1 0 3.8 0Z" strokeLinejoin="round" />
      <path d="M9.7 8.2v5.2" strokeLinecap="round" />
    </svg>
  );
}

/** Saved items. `filled` is the saved state, drawn the way StarIcon handles the same distinction. */
export function HeartIcon({ className = base, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden
    >
      <path
        d="M10 16.5S3 12.4 3 7.9A3.6 3.6 0 0 1 10 6.3a3.6 3.6 0 0 1 7 1.6c0 4.5-7 8.6-7 8.6Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Sign out — a door with an arrow leaving it. */
export function ExitIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M12.4 3.5H15a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-2.6" strokeLinecap="round" />
      <path d="M9 13.2 12 10 9 6.8M12 10H3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/*
  The two brand marks, and the only glyphs here that are not 1.5px strokes in currentColor: a
  provider's logo is theirs, drawn in their colours, and recolouring it to match the palette is
  both wrong and against their brand terms. They are filled paths for that reason — do not
  restyle them to match the set above.
*/

export function GoogleGlyph({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2.1 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.1Z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.2 15.5 46 24 46Z"
      />
      <path
        fill="#FBBC05"
        d="M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.7H4.5A21.9 21.9 0 0 0 2 24c0 3.6.9 6.9 2.5 9.9l7.3-5.7Z"
      />
      <path
        fill="#EA4335"
        d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.3 29.9 2 24 2 15.5 2 8.1 6.8 4.5 13.9l7.3 5.7c1.7-5.2 6.5-8.8 12.2-8.8Z"
      />
    </svg>
  );
}

export function FacebookGlyph({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        fill="#1877F2"
        d="M46 24C46 11.8 36.2 2 24 2S2 11.8 2 24c0 11 8.1 20.1 18.6 21.7V30.4h-5.6V24h5.6v-4.9c0-5.5 3.3-8.6 8.3-8.6 2.4 0 5 .4 5 .4v5.5h-2.8c-2.8 0-3.6 1.7-3.6 3.4V24h6.1l-1 6.4h-5.1v15.3C37.9 44.1 46 35 46 24Z"
      />
      <path
        fill="#fff"
        d="m32.6 30.4 1-6.4h-6.1v-4.2c0-1.7.8-3.4 3.6-3.4h2.8v-5.5s-2.6-.4-5-.4c-5 0-8.3 3.1-8.3 8.6V24h-5.6v6.4h5.6v15.3a22.5 22.5 0 0 0 6.9 0V30.4h5.1Z"
      />
    </svg>
  );
}

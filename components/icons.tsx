import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/**
 * Icônes reprises telles quelles du fichier de design (viewBox 24, trait rond).
 * La couleur suit `currentColor` : on la pilote avec une classe `text-*`.
 */
function Stroke({ size = 20, strokeWidth = 2, children, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

function Solid({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const StarSolid = (p: IconProps) => (
  <Solid {...p}>
    <path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />
  </Solid>
);

export const Home = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 11l8-6 8 6" />
    <path d="M6 10v8a1 1 0 001 1h4v-5h2v5h4a1 1 0 001-1v-8" />
  </Stroke>
);

export const Search = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.5-4.5" />
  </Stroke>
);

export const Calendar = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="4" y="5" width="16" height="15" rx="3" />
    <path d="M4 9h16" />
  </Stroke>
);

export const Chat = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2H9l-4 4v-4H6a2 2 0 01-2-2z" />
  </Stroke>
);

export const ProfileSquare = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="4" y="4" width="16" height="16" rx="7" />
    <circle cx="12" cy="10" r="2.6" />
    <path d="M7.5 17c.8-2.3 2.4-3.4 4.5-3.4s3.7 1.1 4.5 3.4" />
  </Stroke>
);

export const User = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
  </Stroke>
);

export const Medal = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M9 11l-2 8 5-3 5 3-2-8" />
  </Stroke>
);

export const Basket = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M6 8h12l-1 12H7z" />
    <path d="M9 8V6a3 3 0 016 0v2" />
  </Stroke>
);

export const Envelope = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="3" y="6" width="14" height="12" rx="2" />
    <path d="M3 7l7 5 7-5" />
  </Stroke>
);

export const Bell = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M6 10a6 6 0 0112 0v4l1.5 2.5h-15L6 14z" />
    <path d="M10 19a2 2 0 004 0" />
  </Stroke>
);

export const Check = (p: IconProps) => (
  <Stroke strokeWidth={2.6} {...p}>
    <path d="M5 12l4 4 10-10" />
  </Stroke>
);

export const Close = (p: IconProps) => (
  <Stroke strokeWidth={2.6} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Stroke>
);

export const Plus = (p: IconProps) => (
  <Stroke strokeWidth={2.4} {...p}>
    <path d="M12 6v12M6 12h12" />
  </Stroke>
);

export const MapPin = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="10" r="3" />
    <path d="M12 21s7-6.5 7-11a7 7 0 00-14 0c0 4.5 7 11 7 11z" />
  </Stroke>
);

export const Clock = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Stroke>
);

export const Dish = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
  </Stroke>
);

export const Share = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="6" cy="12" r="2" />
    <circle cx="18" cy="6" r="2" />
    <circle cx="18" cy="18" r="2" />
    <path d="M7.7 10.8L16.3 7M7.7 13.2L16.3 17" />
  </Stroke>
);

export const Sliders = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Stroke>
);

export const Wine = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M8 3h8l-1 6a3 3 0 01-6 0z" />
    <path d="M12 9v7" />
    <path d="M9 20h6" />
  </Stroke>
);

export const Candles = (p: IconProps) => (
  <Stroke strokeWidth={1.9} {...p}>
    <rect x="7" y="10" width="3.5" height="10" rx="1.5" />
    <rect x="13.5" y="10" width="3.5" height="10" rx="1.5" />
  </Stroke>
);

export const Table = (p: IconProps) => (
  <Stroke strokeWidth={1.9} {...p}>
    <rect x="3" y="9" width="18" height="2.5" rx="1" />
    <path d="M6 11.5V19M18 11.5V19" />
  </Stroke>
);

export const Heart = (p: IconProps) => (
  <Stroke strokeWidth={1.9} {...p}>
    <path d="M12 20s-7-4.4-9.5-9A5 5 0 0112 6a5 5 0 019.5 5c-2.5 4.6-9.5 9-9.5 9z" />
  </Stroke>
);

export const ArrowRight = (p: IconProps) => (
  <Stroke strokeWidth={2.3} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Stroke>
);

export const ChevronRight = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M9 6l6 6-6 6" />
  </Stroke>
);

export const ChevronLeft = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Stroke>
);

export const Alert = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8v5M12 16.5v.1" />
  </Stroke>
);

export const XCircle = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </Stroke>
);

export const Pencil = (p: IconProps) => (
  <Stroke strokeWidth={2.2} {...p}>
    <path d="M4 20h4L18 10l-4-4L4 16z" />
  </Stroke>
);

export const Wallet = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="3" y="6" width="18" height="13" rx="3" />
    <path d="M3 10h18" />
    <circle cx="17" cy="14.5" r="1.2" />
  </Stroke>
);

export const Google = ({ size = 18, ...rest }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...rest}>
    <path
      fill="#4285F4"
      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 01-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0012 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.4 14.4a7.2 7.2 0 010-4.6V6.7H1.4a12 12 0 000 10.8l4-3.1z"
    />
    <path
      fill="#EA4335"
      d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 001.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"
    />
  </svg>
);

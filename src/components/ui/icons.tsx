// Linien-Icons aus dem Design-Artefakt (24er Raster, Strichstärke 1.6).

type Props = { size?: number; strokeWidth?: number; className?: string };

function Svg({ size = 18, strokeWidth = 1.6, className, children, fill = "none" }: Props & { children: React.ReactNode; fill?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export const SunIcon = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
  </Svg>
);
export const TasksIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M10 6h10M10 12h10M10 18h10M4 6l1.2 1.2L7.5 5M4 12l1.2 1.2L7.5 11M4 18l1.2 1.2L7.5 17" />
  </Svg>
);
export const CalendarIcon = (p: Props) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);
export const DigestIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M5 4.5h11a1 1 0 0 1 1 1V19a1.5 1.5 0 0 0 1.5 1.5H6.5A2.5 2.5 0 0 1 4 18V5.5a1 1 0 0 1 1-1z" />
    <path d="M17 9h2a1 1 0 0 1 1 1v9a1.5 1.5 0 0 1-3 0M7.5 8.5h6M7.5 12h6M7.5 15.5h4" />
  </Svg>
);
export const ChartIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M4 4v16h16" />
    <path d="M7.5 15l3.5-4 3 2.5L19.5 7" />
  </Svg>
);
export const SlidersIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Svg>
);
export const MoonIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  </Svg>
);
export const CheckIcon = (p: Props) => (
  <Svg strokeWidth={3} size={12} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const StarIcon = ({ filled, ...p }: Props & { filled?: boolean }) => (
  <Svg size={15} strokeWidth={1.5} fill={filled ? "currentColor" : "none"} {...p}>
    <path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4 7.2 18.9l.9-5.4L4.2 9.7l5.4-.8z" />
  </Svg>
);
export const RescheduleIcon = (p: Props) => (
  <Svg size={15} {...p}>
    <path d="M20 12a8 8 0 1 1-2.3-5.7" />
    <path d="M20 4v4h-4" />
  </Svg>
);
export const RefreshIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4.2h-4.2" />
  </Svg>
);
export const ExternalIcon = (p: Props) => (
  <Svg size={15} {...p}>
    <path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" />
  </Svg>
);
export const TrashIcon = (p: Props) => (
  <Svg size={15} {...p}>
    <path d="M5 7h14M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </Svg>
);
export const PlusIcon = (p: Props) => (
  <Svg strokeWidth={1.7} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const ArrowUpIcon = (p: Props) => (
  <Svg size={16} strokeWidth={2} {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Svg>
);
export const MicIcon = ({ muted, ...p }: Props & { muted?: boolean }) => (
  <Svg size={19} {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d={muted ? "M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M4 4l16 16" : "M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"} />
  </Svg>
);
export const TranscriptIcon = (p: Props) => (
  <Svg size={19} {...p}>
    <path d="M5 5.5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4.5 3.5V16.5H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z" />
    <path d="M8 10h8M8 13h5" />
  </Svg>
);
export const CloseIcon = (p: Props) => (
  <Svg size={15} strokeWidth={2} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const ChevronLeftIcon = (p: Props) => (
  <Svg size={14} strokeWidth={1.8} {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
);
export const ChevronRightIcon = (p: Props) => (
  <Svg size={14} strokeWidth={1.8} {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);
export const EyeIcon = ({ off, ...p }: Props & { off?: boolean }) => (
  <Svg size={17} {...p}>
    <path d="M3 12s3.3-6.5 9-6.5S21 12 21 12s-3.3 6.5-9 6.5S3 12 3 12z" />
    <circle cx="12" cy="12" r="2.8" />
    {off ? <path d="M4 4l16 16" /> : null}
  </Svg>
);

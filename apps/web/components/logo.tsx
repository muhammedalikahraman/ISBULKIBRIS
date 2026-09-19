import { Link } from "@/i18n/navigation";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  showText?: boolean;
};

const sizeMap = {
  sm: { mark: 28, text: "text-lg" },
  md: { mark: 36, text: "text-xl" },
  lg: { mark: 48, text: "text-2xl" },
};

export function Logo({ size = "md", variant = "dark", showText = true }: LogoProps) {
  const s = sizeMap[size];
  const textColor = variant === "light" ? "text-white" : "text-primary-900";
  const accentColor = variant === "light" ? "text-accent-400" : "text-accent-500";

  return (
    <Link href="/" className="flex items-center gap-2.5 group" aria-label="İşBulKıbrıs">
      {/* SVG Mark: stylized pin + briefcase fusion */}
      <svg
        width={s.mark}
        height={s.mark}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform group-hover:scale-105"
      >
        {/* Rounded square background */}
        <rect width="48" height="48" rx="12" fill="url(#logo-grad)" />
        {/* Location pin */}
        <path
          d="M24 10c-5.5 0-10 4.3-10 9.6 0 6.8 10 18.4 10 18.4s10-11.6 10-18.4C34 14.3 29.5 10 24 10z"
          fill="white"
          fillOpacity="0.95"
        />
        {/* Briefcase inside pin */}
        <rect x="19" y="16" width="10" height="7" rx="1.5" fill="#219EBC" />
        <path d="M21 16v-1.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5V16" stroke="#219EBC" strokeWidth="1.5" fill="none" />
        {/* Accent dot */}
        <circle cx="34" cy="14" r="3" fill="#FFB703" />
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#023047" />
            <stop offset="1" stopColor="#219EBC" />
          </linearGradient>
        </defs>
      </svg>

      {showText && (
        <span className={`font-display font-bold ${s.text} ${textColor} tracking-tight`}>
          İşBul<span className={accentColor}>Kıbrıs</span>
        </span>
      )}
    </Link>
  );
}

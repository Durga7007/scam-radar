type Props = { score: number; verdict: "safe" | "suspicious" | "phishing" };

const RiskGauge = ({ score, verdict }: Props) => {
  const clamped = Math.max(0, Math.min(100, score));
  const angle = (clamped / 100) * 180;
  const color =
    verdict === "safe" ? "hsl(var(--success))"
    : verdict === "suspicious" ? "hsl(var(--warning))"
    : "hsl(var(--destructive))";

  return (
    <div className="relative w-full max-w-xs mx-auto">
      <svg viewBox="0 0 200 120" className="w-full">
        <defs>
          <linearGradient id="gauge" x1="0" x2="1">
            <stop offset="0%" stopColor="hsl(var(--success))" />
            <stop offset="50%" stopColor="hsl(var(--warning))" />
            <stop offset="100%" stopColor="hsl(var(--destructive))" />
          </linearGradient>
        </defs>
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth="14" strokeLinecap="round" />
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#gauge)" strokeWidth="14" strokeLinecap="round"
          strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * clamped) / 100} />
        <g transform={`rotate(${angle - 90} 100 100)`}>
          <line x1="100" y1="100" x2="100" y2="35" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="6" fill={color} />
        </g>
      </svg>
      <div className="text-center mt-2">
        <div className="text-5xl font-bold tracking-tight" style={{ color }}>{clamped}</div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Risk Score</div>
      </div>
    </div>
  );
};

export default RiskGauge;

type RadarProps = { scanning?: boolean; verdict?: "safe" | "suspicious" | "phishing" };

const verdictRing: Record<NonNullable<RadarProps["verdict"]>, string> = {
  safe: "hsl(var(--success))",
  suspicious: "hsl(var(--warning))",
  phishing: "hsl(var(--destructive))",
};

const Radar = ({ scanning = false, verdict }: RadarProps) => {
  const accent = verdict ? verdictRing[verdict] : "hsl(var(--primary))";
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-64 w-64">
        <div className="absolute inset-0 rounded-full border" style={{ borderColor: `${accent.replace(")", " / 0.35)")}` }} />
        <div className="absolute inset-6 rounded-full border" style={{ borderColor: `${accent.replace(")", " / 0.25)")}` }} />
        <div className="absolute inset-12 rounded-full border" style={{ borderColor: `${accent.replace(")", " / 0.18)")}` }} />
        <div className="absolute inset-20 rounded-full border" style={{ borderColor: `${accent.replace(")", " / 0.12)")}` }} />
        {scanning && (
          <>
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-radar-pulse" />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, transparent 0deg, ${accent.replace(")", " / 0.5)")} 60deg, transparent 90deg)`,
                animation: "radar-sweep 2.4s linear infinite",
              }}
            />
          </>
        )}
        <div className="absolute inset-0 grid place-items-center">
          <div
            className="h-3 w-3 rounded-full shadow-glow"
            style={{ backgroundColor: accent }}
          />
        </div>
      </div>
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success" /> Safe
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning" /> Suspicious
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destructive" /> Phishing
        </span>
      </div>
    </div>
  );
};

export default Radar;

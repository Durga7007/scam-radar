const Radar = ({ scanning = false }: { scanning?: boolean }) => (
  <div className="relative h-64 w-64 mx-auto">
    <div className="absolute inset-0 rounded-full border border-primary/30" />
    <div className="absolute inset-6 rounded-full border border-primary/20" />
    <div className="absolute inset-12 rounded-full border border-primary/15" />
    <div className="absolute inset-20 rounded-full border border-primary/10" />
    {scanning && (
      <>
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-radar-pulse" />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary) / 0.5) 60deg, transparent 90deg)",
            animation: "radar-sweep 2.4s linear infinite",
          }}
        />
      </>
    )}
    <div className="absolute inset-0 grid place-items-center">
      <div className="h-3 w-3 rounded-full bg-primary shadow-glow" />
    </div>
  </div>
);

export default Radar;

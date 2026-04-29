import { Activity } from "lucide-react";

const labels: Record<string, string> = {
  domain: "Domain & URL shape",
  content: "Content signals",
  urgency: "Urgency / pressure",
  credentials: "Credential / payment ask",
  impersonation: "Brand impersonation",
  media_integrity: "Media integrity",
  reputation: "Reputation & history",
};

function band(v: number) {
  if (v >= 70) return "bg-destructive";
  if (v >= 40) return "bg-warning";
  if (v > 0) return "bg-primary";
  return "bg-muted";
}

const RiskBreakdown = ({ scores }: { scores?: Record<string, number> }) => {
  if (!scores) return null;
  const entries = Object.entries(scores).filter(([, v]) => typeof v === "number");
  if (entries.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-primary" />
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Risk breakdown</div>
      </div>
      <div className="space-y-2.5">
        {entries.map(([k, v]) => {
          const val = Math.max(0, Math.min(100, Math.round(v)));
          return (
            <div key={k}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{labels[k] ?? k}</span>
                <span className="font-mono">{val}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div className={`h-full ${band(val)} transition-all`} style={{ width: `${val}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RiskBreakdown;
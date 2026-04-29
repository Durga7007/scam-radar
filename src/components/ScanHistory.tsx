import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { history, type ScanRecord } from "@/lib/scanHistory";
import { History, Repeat2, Trash2, Link2, Mail, Phone, Image as ImageIcon } from "lucide-react";

const verdictColor: Record<ScanRecord["result"]["verdict"], string> = {
  safe: "bg-success/15 text-success border-success/30",
  suspicious: "bg-warning/15 text-warning border-warning/30",
  phishing: "bg-destructive/15 text-destructive border-destructive/30",
};

const typeIcon = {
  url: Link2,
  email: Mail,
  phone: Phone,
  image: ImageIcon,
} as const;

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = { onRerun?: (record: ScanRecord) => void };

const ScanHistory = ({ onRerun }: Props) => {
  const [items, setItems] = useState<ScanRecord[]>([]);

  useEffect(() => {
    setItems(history.list());
    return history.subscribe(() => setItems(history.list()));
  }, []);

  if (items.length === 0) {
    return (
      <Card className="p-8 bg-gradient-card border-border/60 text-center">
        <History className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-semibold">No scans yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Your scan history is stored locally in this browser. Run a scan above to get started.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 md:p-8 bg-gradient-card border-border/60">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Scan History</h3>
          <Badge variant="secondary" className="ml-1">{items.length}</Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            history.clear();
          }}
        >
          <Trash2 className="h-4 w-4 mr-1" /> Clear
        </Button>
      </div>

      <div className="grid gap-2">
        {items.map((it) => {
          const Icon = typeIcon[it.type];
          return (
            <div
              key={it.id}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3 hover:border-primary/40 transition-colors"
            >
              <div className="h-9 w-9 rounded-md bg-primary/10 grid place-items-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${verdictColor[it.result.verdict]} border uppercase text-[10px] tracking-wider`}>
                    {it.result.verdict}
                  </Badge>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{it.type}</span>
                  <span className="text-xs text-muted-foreground">· {formatTime(it.timestamp)}</span>
                </div>
                <div className="text-sm font-mono truncate mt-1" title={it.preview}>
                  {it.preview}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="text-xl font-bold text-gradient-primary leading-none">
                  {it.result.risk_score}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">risk</div>
              </div>
              {onRerun && it.type !== "image" && (
                <Button size="sm" variant="outline" className="shrink-0" onClick={() => onRerun(it)}>
                  <Repeat2 className="h-4 w-4 mr-1" /> Re-run
                </Button>
              )}
              <Button size="icon" variant="ghost" className="shrink-0" onClick={() => history.remove(it.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ScanHistory;
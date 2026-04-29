import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { history, type ScanRecord } from "@/lib/scanHistory";
import {
  Shield, ArrowLeft, Activity, ShieldCheck, ShieldAlert, ShieldX,
  Link2, Mail, Phone, Image as ImageIcon, TrendingUp, Trash2,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

const verdictColors = {
  safe: "hsl(var(--success))",
  suspicious: "hsl(var(--warning))",
  phishing: "hsl(var(--destructive))",
};

const typeIcon = { url: Link2, email: Mail, phone: Phone, image: ImageIcon } as const;

function useHistory() {
  const [items, setItems] = useState<ScanRecord[]>([]);
  useEffect(() => {
    setItems(history.list());
    return history.subscribe(() => setItems(history.list()));
  }, []);
  return items;
}

const Admin = () => {
  const items = useHistory();

  const stats = useMemo(() => {
    const total = items.length;
    const byVerdict = { safe: 0, suspicious: 0, phishing: 0 };
    const byType: Record<string, number> = { url: 0, email: 0, phone: 0, image: 0 };
    let scoreSum = 0;
    items.forEach((i) => {
      byVerdict[i.result.verdict]++;
      byType[i.type] = (byType[i.type] || 0) + 1;
      scoreSum += i.result.risk_score;
    });
    const avg = total ? Math.round(scoreSum / total) : 0;
    const detection = total
      ? Math.round(((byVerdict.suspicious + byVerdict.phishing) / total) * 100)
      : 0;
    return { total, byVerdict, byType, avg, detection };
  }, [items]);

  const verdictPie = [
    { name: "Safe", value: stats.byVerdict.safe, color: verdictColors.safe },
    { name: "Suspicious", value: stats.byVerdict.suspicious, color: verdictColors.suspicious },
    { name: "Phishing", value: stats.byVerdict.phishing, color: verdictColors.phishing },
  ].filter((d) => d.value > 0);

  const typeBars = Object.entries(stats.byType).map(([k, v]) => ({ type: k, count: v }));

  const trend = useMemo(() => {
    // Last 7 days
    const days: { day: string; scans: number; avg: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const dayItems = items.filter(
        (it) => it.timestamp >= d.getTime() && it.timestamp < next.getTime()
      );
      const avg =
        dayItems.length > 0
          ? Math.round(dayItems.reduce((s, it) => s + it.result.risk_score, 0) / dayItems.length)
          : 0;
      days.push({
        day: d.toLocaleDateString(undefined, { weekday: "short" }),
        scans: dayItems.length,
        avg,
      });
    }
    return days;
  }, [items]);

  const topIndicators = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((it) =>
      it.result.indicators?.forEach((ind) => counts.set(ind.label, (counts.get(ind.label) || 0) + 1))
    );
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [items]);

  const recent = items.slice(0, 8);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>Scam Shield <span className="text-gradient-primary">Radar</span></span>
            <Badge variant="secondary" className="ml-2">Admin</Badge>
          </Link>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> Back to scanner</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Clear all scan history?")) history.clear();
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Clear data
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-10 space-y-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary mb-2">Analytics dashboard</div>
          <h1 className="text-3xl md:text-4xl font-bold">Site-wide threat overview</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Aggregated analytics from scans performed in this browser. Storage is local — no data leaves your device.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPI label="Total scans" value={stats.total} icon={Activity} />
          <KPI label="Safe" value={stats.byVerdict.safe} icon={ShieldCheck} accent="text-success" />
          <KPI label="Suspicious" value={stats.byVerdict.suspicious} icon={ShieldAlert} accent="text-warning" />
          <KPI label="Phishing" value={stats.byVerdict.phishing} icon={ShieldX} accent="text-destructive" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KPI label="Avg risk score" value={stats.avg} icon={TrendingUp} suffix="/100" />
          <KPI label="Detection rate" value={stats.detection} icon={Shield} suffix="%" />
          <KPI label="Most-scanned type" value={topType(stats.byType)} icon={Activity} />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 bg-gradient-card border-border/60">
            <h3 className="font-semibold mb-4">Verdict distribution</h3>
            {verdictPie.length === 0 ? (
              <Empty />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={verdictPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                      {verdictPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="p-6 bg-gradient-card border-border/60">
            <h3 className="font-semibold mb-4">Scans by type</h3>
            {stats.total === 0 ? (
              <Empty />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeBars}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="p-6 bg-gradient-card border-border/60 lg:col-span-2">
            <h3 className="font-semibold mb-4">Activity (last 7 days)</h3>
            {stats.total === 0 ? (
              <Empty />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend />
                    <Line type="monotone" dataKey="scans" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="avg" name="avg risk" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* Top indicators + recent */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 bg-gradient-card border-border/60">
            <h3 className="font-semibold mb-4">Top threat indicators</h3>
            {topIndicators.length === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-2">
                {topIndicators.map(([label, n]) => (
                  <div key={label} className="flex items-center gap-3 rounded-md border border-border/60 bg-background/40 p-3">
                    <div className="text-sm flex-1 truncate">{label}</div>
                    <Badge variant="secondary">{n}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6 bg-gradient-card border-border/60">
            <h3 className="font-semibold mb-4">Recent scans</h3>
            {recent.length === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-2">
                {recent.map((r) => {
                  const Icon = typeIcon[r.type];
                  return (
                    <div key={r.id} className="flex items-center gap-3 rounded-md border border-border/60 bg-background/40 p-3">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate font-mono">{r.preview}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(r.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <Badge
                        className="uppercase text-[10px]"
                        style={{
                          background: verdictColors[r.result.verdict] + "26",
                          color: verdictColors[r.result.verdict],
                          border: `1px solid ${verdictColors[r.result.verdict]}55`,
                        }}
                      >
                        {r.result.verdict}
                      </Badge>
                      <div className="text-sm font-bold w-8 text-right">{r.result.risk_score}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

const KPI = ({
  label, value, icon: Icon, accent = "text-primary", suffix = "",
}: {
  label: string; value: number | string; icon: any; accent?: string; suffix?: string;
}) => (
  <Card className="p-5 bg-gradient-card border-border/60">
    <div className="flex items-center justify-between">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <Icon className={`h-4 w-4 ${accent}`} />
    </div>
    <div className="text-3xl font-bold mt-2">
      {value}
      <span className="text-base text-muted-foreground font-normal">{suffix}</span>
    </div>
  </Card>
);

const Empty = () => (
  <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
    No data yet — run a few scans first.
  </div>
);

function topType(byType: Record<string, number>) {
  const e = Object.entries(byType).filter(([, v]) => v > 0);
  if (e.length === 0) return "—";
  e.sort((a, b) => b[1] - a[1]);
  return e[0][0];
}

export default Admin;
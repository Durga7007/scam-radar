import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Link2, Mail, ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Radar from "./Radar";
import RiskGauge from "./RiskGauge";

type Indicator = { label: string; severity: "info" | "low" | "medium" | "high"; detail: string };
type Result = {
  risk_score: number;
  verdict: "safe" | "suspicious" | "phishing";
  summary: string;
  indicators: Indicator[];
  recommendation: string;
};

const verdictMeta = {
  safe: { label: "Looks Safe", icon: ShieldCheck, gradient: "bg-gradient-safe", color: "text-success" },
  suspicious: { label: "Suspicious", icon: ShieldAlert, gradient: "bg-gradient-warning", color: "text-warning" },
  phishing: { label: "Phishing Detected", icon: ShieldX, gradient: "bg-gradient-danger", color: "text-destructive" },
};

const sevColor: Record<Indicator["severity"], string> = {
  info: "bg-muted text-muted-foreground",
  low: "bg-primary/15 text-primary",
  medium: "bg-warning/20 text-warning",
  high: "bg-destructive/20 text-destructive",
};

const ThreatScanner = () => {
  const [tab, setTab] = useState<"url" | "email">("url");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const analyze = async () => {
    const input = tab === "url" ? url.trim() : email.trim();
    if (!input) {
      toast.error(`Please paste a ${tab === "url" ? "URL" : "message"} to scan.`);
      return;
    }
    if (tab === "url" && input.length > 2048) {
      toast.error("URL is too long.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-threat", {
        body: { input, type: tab },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as Result);
      toast.success("Scan complete");
    } catch (e: any) {
      toast.error(e?.message || "Scan failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const Verdict = result ? verdictMeta[result.verdict] : null;

  return (
    <div id="scanner" className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3 p-6 md:p-8 bg-gradient-card border-border/60 backdrop-blur">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "url" | "email")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="url" className="gap-2"><Link2 className="h-4 w-4" /> URL</TabsTrigger>
            <TabsTrigger value="email" className="gap-2"><Mail className="h-4 w-4" /> Email / Message</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <label className="text-sm text-muted-foreground">Paste a suspicious link to scan</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://secure-paypa1-login.com/verify"
              maxLength={2048}
              className="h-12 font-mono"
            />
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <label className="text-sm text-muted-foreground">Paste an email or message you received</label>
            <Textarea
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="From: support@amaz0n-billing.com&#10;Subject: Urgent: Verify your account&#10;&#10;Dear customer, your account has been suspended..."
              rows={9}
              maxLength={8000}
              className="font-mono text-sm"
            />
            <div className="text-xs text-muted-foreground text-right">{email.length}/8000</div>
          </TabsContent>

          <Button onClick={analyze} disabled={loading} size="lg"
            className="w-full mt-2 h-12 text-base bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
            {loading ? (<><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Scanning…</>) : (<>Run Scan</>)}
          </Button>
        </Tabs>
      </Card>

      <Card className="lg:col-span-2 p-6 md:p-8 bg-gradient-card border-border/60 backdrop-blur min-h-[420px]">
        {loading && (
          <div className="h-full flex flex-col items-center justify-center gap-6">
            <Radar scanning />
            <p className="text-sm text-muted-foreground tracking-wide uppercase">Analyzing threat signals…</p>
          </div>
        )}

        {!loading && !result && (
          <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
            <Radar />
            <div>
              <h3 className="font-semibold text-lg">Radar idle</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Paste a URL or message and run a scan to get an instant AI risk assessment.
              </p>
            </div>
          </div>
        )}

        {!loading && result && Verdict && (
          <div className="space-y-6 animate-fade-in-up">
            <div className={`rounded-xl ${Verdict.gradient} p-4 flex items-center gap-3 text-foreground`}>
              <Verdict.icon className="h-7 w-7" />
              <div>
                <div className="text-xs uppercase tracking-widest opacity-80">Verdict</div>
                <div className="font-bold text-lg">{Verdict.label}</div>
              </div>
            </div>
            <RiskGauge score={result.risk_score} verdict={result.verdict} />
            <p className="text-sm leading-relaxed">{result.summary}</p>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Recommendation</div>
              <div className="rounded-lg border border-border/60 bg-background/50 p-3 text-sm flex gap-2">
                <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>{result.recommendation}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {result && result.indicators?.length > 0 && (
        <Card className="lg:col-span-5 p-6 md:p-8 bg-gradient-card border-border/60 backdrop-blur animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Detected Indicators ({result.indicators.length})</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {result.indicators.map((ind, i) => (
              <div key={i} className="rounded-lg border border-border/60 bg-background/40 p-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="font-medium text-sm">{ind.label}</div>
                  <Badge className={`${sevColor[ind.severity]} border-0 uppercase text-[10px] tracking-wider`}>
                    {ind.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{ind.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ThreatScanner;

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Link2, Mail, Phone, Image as ImageIcon, ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, Info, Upload, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Radar from "./Radar";
import RiskGauge from "./RiskGauge";
import RiskBreakdown from "./RiskBreakdown";
import { history, type Indicator, type ScanResult, type ScanType, previewOf } from "@/lib/scanHistory";
import { presets, validate } from "@/lib/validators";

type Result = ScanResult;

const verdictMeta = {
  safe: { label: "SAFE — no fraud indicators", icon: ShieldCheck, gradient: "bg-muted/40 border border-success/30", color: "text-success" },
  suspicious: { label: "Suspicious", icon: ShieldAlert, gradient: "bg-gradient-warning", color: "text-warning" },
  phishing: { label: "Phishing Detected", icon: ShieldX, gradient: "bg-gradient-danger", color: "text-destructive" },
};

const sevColor: Record<Indicator["severity"], string> = {
  info: "bg-muted text-muted-foreground",
  low: "bg-primary/15 text-primary",
  medium: "bg-warning/20 text-warning",
  high: "bg-destructive/20 text-destructive",
};

export type ThreatScannerHandle = {
  loadInput: (type: ScanType, input: string) => void;
};

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const ThreatScanner = forwardRef<ThreatScannerHandle>((_props, ref) => {
  const [tab, setTab] = useState<ScanType>("url");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    loadInput: (type, input) => {
      setTab(type);
      if (type === "url") setUrl(input);
      else if (type === "email") setEmail(input);
      else if (type === "phone") setPhone(input);
      setResult(null);
      // Scroll the scanner into view
      requestAnimationFrame(() => {
        document.getElementById("scanner")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
  }));

  const onPickFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image too large. Max 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setImageName(file.name);
    };
    reader.onerror = () => toast.error("Could not read the image.");
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageDataUrl(null);
    setImageName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analyze = async () => {
    let body: { type: ScanType; input?: string; image?: string } = { type: tab };
    let storedInput = "";

    if (tab === "image") {
      if (!imageDataUrl) {
        toast.error("Upload an image to scan.");
        return;
      }
      body = { type: "image", image: imageDataUrl };
      storedInput = imageName || "image";
    } else {
      const raw = tab === "url" ? url : tab === "email" ? email : phone;
      const v = validate(tab, raw);
      if (v.ok === false) {
        toast.error(v.error);
        return;
      }
      // Reflect normalized value back to the input
      if (tab === "url") setUrl(v.value);
      if (tab === "phone") setPhone(v.value);
      body = { type: tab, input: v.value };
      storedInput = v.value;
    }

    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-threat", { body });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const r = data as Result;
      setResult(r);
      history.add({
        type: tab,
        input: storedInput,
        preview: previewOf(tab, storedInput),
        result: r,
      });
      toast.success("Scan complete");
    } catch (e: any) {
      toast.error(e?.message || "Scan failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const Verdict = result ? verdictMeta[result.verdict] : null;

  const PresetRow = ({ type }: { type: "url" | "email" | "phone" }) => (
    <div className="flex flex-wrap gap-2 pt-1">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground self-center mr-1 inline-flex items-center gap-1">
        <Sparkles className="h-3 w-3" /> Try a preset:
      </span>
      {presets[type].map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => {
            if (type === "url") setUrl(p.value);
            if (type === "email") setEmail(p.value);
            if (type === "phone") setPhone(p.value);
          }}
          className="text-xs rounded-full border border-border/60 bg-background/40 px-3 py-1 hover:border-primary/50 hover:text-primary transition-colors"
          title={p.hint}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  return (
    <div id="scanner" className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3 p-6 md:p-8 bg-gradient-card border-border/60 backdrop-blur">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ScanType)}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="url" className="gap-2"><Link2 className="h-4 w-4" /> URL</TabsTrigger>
            <TabsTrigger value="email" className="gap-2"><Mail className="h-4 w-4" /> Email</TabsTrigger>
            <TabsTrigger value="phone" className="gap-2"><Phone className="h-4 w-4" /> Phone</TabsTrigger>
            <TabsTrigger value="image" className="gap-2"><ImageIcon className="h-4 w-4" /> Image</TabsTrigger>
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
            <PresetRow type="url" />
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
            <PresetRow type="email" />
          </TabsContent>

          <TabsContent value="phone" className="space-y-4">
            <label className="text-sm text-muted-foreground">Enter a phone number (include country code if possible)</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 415 555 0127"
              maxLength={32}
              className="h-12 font-mono"
              inputMode="tel"
            />
            <PresetRow type="phone" />
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <label className="text-sm text-muted-foreground">
              Upload an image (screenshot, profile pic, document) — checks for morphing, fake profiles, and scam screenshots
            </label>
            {!imageDataUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors py-10 flex flex-col items-center justify-center gap-2 bg-background/30"
              >
                <Upload className="h-6 w-6 text-primary" />
                <div className="text-sm font-medium">Click to upload an image</div>
                <div className="text-xs text-muted-foreground">PNG, JPG, or WEBP · up to 4 MB</div>
              </button>
            ) : (
              <div className="relative rounded-xl border border-border/60 overflow-hidden bg-background/40">
                <img src={imageDataUrl} alt="To analyze" className="w-full max-h-64 object-contain" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-full bg-background/80 border border-border/60 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border/60 truncate">
                  {imageName}
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
              }}
            />
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
          <div className={`space-y-6 animate-fade-in-up ${result.verdict === "safe" ? "opacity-95" : ""}`}>
            <div className={`rounded-xl ${Verdict.gradient} p-4 flex items-center gap-3 ${result.verdict === "safe" ? Verdict.color : "text-foreground"}`}>
              <Verdict.icon className="h-7 w-7" />
              <div>
                <div className="text-xs uppercase tracking-widest opacity-80">Verdict</div>
                <div className="font-bold text-lg leading-tight">{Verdict.label}</div>
                {result.verdict === "safe" && (
                  <div className="text-xs text-muted-foreground mt-0.5">No phishing or scam signals detected</div>
                )}
              </div>
            </div>
            <RiskGauge score={result.risk_score} verdict={result.verdict} />
            <p className="text-sm leading-relaxed">{result.summary}</p>
            <RiskBreakdown scores={result.category_scores} />
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
                {ind.category && (
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
                    {ind.category.replace("_", " ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
});

ThreatScanner.displayName = "ThreatScanner";

export default ThreatScanner;

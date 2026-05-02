import { Brain, Zap, Radar as RadarIcon, Globe, Shield, EyeOff } from "lucide-react";

const features = [
  { icon: Brain, title: "AI-Powered Detection", desc: "Gemini-class language models inspect URLs and message text for phishing patterns and zero-day scams." },
  { icon: Zap, title: "Instant Risk Score", desc: "Get a 0–100 risk score, verdict, and itemized indicators in seconds — no signup required." },
  { icon: RadarIcon, title: "Adaptive Signals", desc: "Looks beyond blacklists: lookalike domains, urgency cues, credential traps, and brand impersonation." },
  { icon: Globe, title: "Universal Coverage", desc: "Works with any URL, email body, phone number, or image — across providers, platforms, and languages." },
  { icon: Shield, title: "Clear Guidance", desc: "Every scan includes a plain-English recommendation: open, verify, or avoid." },
  { icon: EyeOff, title: "Ignore False Positives", desc: "Mark a scan as safe to silence repeat alerts on trusted senders without losing the audit trail." },
];

const FeaturesPage = () => (
  <section className="container py-16 md:py-24">
    <div className="max-w-2xl mx-auto text-center mb-12">
      <div className="text-xs uppercase tracking-widest text-primary mb-3">Capabilities</div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Everything you need to stay safe</h1>
      <p className="text-muted-foreground mt-3 text-sm md:text-base">
        A complete toolkit — detect, decide, and defend against phishing in one place.
      </p>
    </div>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((f) => (
        <div key={f.title} className="rounded-xl border border-border/60 bg-gradient-card p-6 hover:border-primary/40 transition-colors">
          <div className="h-10 w-10 rounded-lg bg-primary/15 grid place-items-center mb-4">
            <f.icon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold">{f.title}</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

export default FeaturesPage;
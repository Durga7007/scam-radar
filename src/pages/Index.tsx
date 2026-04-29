import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  Shield, Radar as RadarIcon, Brain, Zap, Globe, ArrowRight, BarChart3,
  Flag, Ban, EyeOff, Chrome, Linkedin, Mail, Phone, MapPin, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThreatScanner, { type ThreatScannerHandle } from "@/components/ThreatScanner";
import ScanHistory from "@/components/ScanHistory";
import heroImg from "@/assets/radar-hero.jpg";

const features = [
  { icon: Brain, title: "AI-Powered Detection", desc: "Gemini-class language models inspect URLs and message text for phishing patterns and zero-day scams." },
  { icon: Zap, title: "Instant Risk Score", desc: "Get a 0–100 risk score, verdict, and itemized indicators in seconds — no signup required." },
  { icon: RadarIcon, title: "Adaptive Signals", desc: "Looks beyond blacklists: lookalike domains, urgency cues, credential traps, and brand impersonation." },
  { icon: Globe, title: "Universal Coverage", desc: "Works with any URL, email body, or text message — across providers, platforms, and languages." },
  { icon: Shield, title: "Clear Guidance", desc: "Every scan includes a plain-English recommendation: open, verify, or avoid." },
  { icon: Flag, title: "Report Suspicious", desc: "Flag any scan as a confirmed scam to enrich your local threat feed and warn future scans." },
  { icon: Ban, title: "Block Sender", desc: "Block malicious domains, emails, and phone numbers so they're auto-flagged the moment they appear again." },
  { icon: EyeOff, title: "Ignore False Positives", desc: "Mark a scan as safe to silence repeat alerts on trusted senders without losing the audit trail." },
  { icon: Chrome, title: "Browser Extension Mode", desc: "One-click radar in your browser toolbar — scan the current tab, hovered link, or selected text in real time." },
];

const Index = () => {
  const scannerRef = useRef<ThreatScannerHandle>(null);
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="container flex items-center justify-between h-16">
          <a href="#" className="flex items-center gap-2 font-bold">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>Scam Shield <span className="text-gradient-primary">Radar</span></span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#scanner" className="hover:text-foreground transition-colors">Scanner</a>
            <a href="#history" className="hover:text-foreground transition-colors">History</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#creator" className="hover:text-foreground transition-colors">Creator</a>
            <Link to="/admin" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" /> Admin
            </Link>
          </nav>
          <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            <a href="#scanner">Scan now</a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="container relative py-20 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-3 py-1 text-xs text-muted-foreground mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              AI radar online · real-time phishing detection
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Stop scams before they{" "}
              <span className="text-gradient-primary">reach you.</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-xl">
              Scam Shield Radar analyzes any URL or message with advanced AI to flag phishing, fraud, and social-engineering attacks — instantly.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow h-12">
                <a href="#scanner">Try the scanner <ArrowRight className="h-4 w-4 ml-2" /></a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 border-border/60">
                <a href="#features">See features</a>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-12 max-w-md">
              {[
                { v: "99%", l: "Pattern coverage" },
                { v: "<3s", l: "Avg scan time" },
                { v: "10+", l: "Threat signals" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-2xl font-bold text-gradient-primary">{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative animate-float-slow">
            <div className="absolute -inset-10 bg-primary/20 blur-3xl rounded-full" />
            <img
              src={heroImg}
              alt="AI security radar shield emblem detecting phishing threats"
              width={1536}
              height={1024}
              className="relative rounded-2xl border border-border/60 shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* Scanner */}
      <section className="container py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-primary mb-3">Live Scanner</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Scan a URL, message, phone, or image</h2>
          <p className="text-muted-foreground mt-3">
            Paste anything suspicious — links, messages, phone numbers, or upload an image. Our AI returns a verdict, a 0–100 risk score, and the exact signals it found.
          </p>
        </div>
        <ThreatScanner ref={scannerRef} />
      </section>

      {/* History */}
      <section id="history" className="container pb-16 md:pb-24">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-primary mb-3">Recent activity</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Your scan history</h2>
          <p className="text-muted-foreground mt-3">
            Stored locally in your browser. Re-run any past scan with one click.
          </p>
        </div>
        <ScanHistory onRerun={(rec) => scannerRef.current?.loadInput(rec.type, rec.input)} />
      </section>

      {/* Features */}
      <section id="features" className="container py-16 md:py-24 border-t border-border/60">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="text-xs uppercase tracking-widest text-primary mb-3">Capabilities</div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Everything you need to stay safe</h2>
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

      {/* How it works */}
      <section id="how" className="container py-16 md:py-24 border-t border-border/60">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="text-xs uppercase tracking-widest text-primary mb-3">How it works</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Three steps to safety</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Paste", d: "Drop in any URL, email, or text you're unsure about." },
            { n: "02", t: "Analyze", d: "Our AI inspects domain shape, content, urgency, and known scam patterns." },
            { n: "03", t: "Decide", d: "Get a clear verdict, risk score, indicators, and a next-step recommendation." },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-border/60 bg-gradient-card p-6">
              <div className="text-5xl font-bold text-gradient-primary mb-3">{s.n}</div>
              <h3 className="font-semibold text-lg">{s.t}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 md:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-hero p-10 md:p-16 text-center">
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Don't guess. Scan.</h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              The next phishing attempt is one click away. Add Scam Shield Radar to your routine.
            </p>
            <Button asChild size="lg" className="mt-8 h-12 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
              <a href="#scanner">Scan something now <ArrowRight className="h-4 w-4 ml-2" /></a>
            </Button>
          </div>
        </div>
      </section>

      {/* About the Project */}
      <section id="about" className="container py-16 md:py-24 border-t border-border/60">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-xs uppercase tracking-widest text-primary mb-3">About the project</div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Scam Shield Radar</h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Scam Shield Radar is an AI-powered phishing detection and alert system designed to protect
            everyday internet users, banking customers, and organizations from social-engineering attacks.
            It analyzes URLs, emails, phone numbers, and uploaded images in real time using advanced
            language and vision models, returning a 0–100 risk score, an itemized list of threat indicators,
            a clear verdict (safe, suspicious, or phishing), and a plain-English recommendation. Users can
            re-run past scans from a local history, drill into a category-wise risk breakdown, and visit an
            admin dashboard for aggregated analytics — all without an account. The project demonstrates a
            full-stack security workflow combining React, Tailwind, and AI inference into a single, fast,
            and privacy-respecting defense layer against modern scams.
          </p>
        </div>
      </section>

      {/* Creator */}
      <section id="creator" className="container pb-16 md:pb-24">
        <div className="max-w-4xl mx-auto rounded-3xl border border-border/60 bg-gradient-card p-8 md:p-12">
          <div className="grid md:grid-cols-[auto_1fr] gap-8 items-center">
            <div className="h-28 w-28 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow mx-auto md:mx-0">
              <User className="h-12 w-12 text-primary-foreground" />
            </div>
            <div className="text-center md:text-left">
              <div className="text-xs uppercase tracking-widest text-primary mb-2">Creator</div>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight uppercase">DURGASREE AVVARU</h3>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                Builder of Scam Shield Radar — passionate about cybersecurity, AI, and crafting tools
                that make the internet safer for everyone.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mt-6">
                <a
                  href="https://www.linkedin.com/in/durgasree-avvaru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-4 py-3 hover:border-primary/40 transition-colors"
                >
                  <Linkedin className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm truncate">LinkedIn</span>
                </a>
                <a
                  href="tel:+919059266595"
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-4 py-3 hover:border-primary/40 transition-colors"
                >
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-mono truncate">+91 90592 66595</span>
                </a>
                <a
                  href="mailto:durgasree.avvaru@gmail.com"
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-4 py-3 hover:border-primary/40 transition-colors"
                >
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm truncate">Email</span>
                </a>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-muted-foreground mt-5">
                <MapPin className="h-3.5 w-3.5" /> India
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Scam Shield Radar · AI-powered phishing detection
          </div>
          <div>© {new Date().getFullYear()} Scam Shield Radar</div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

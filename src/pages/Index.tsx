import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThreatScanner, { type ThreatScannerHandle } from "@/components/ThreatScanner";
import heroImg from "@/assets/radar-hero.jpg";

type RerunState = { rerun?: { type: "url" | "email" | "phone"; input: string } };

const Index = () => {
  const scannerRef = useRef<ThreatScannerHandle>(null);
  const location = useLocation();

  useEffect(() => {
    const state = (location.state ?? null) as RerunState | null;
    if (state?.rerun) {
      scannerRef.current?.loadInput(state.rerun.type, state.rerun.input);
    }
  }, [location.state]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="container relative py-20 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-3 py-1 text-xs text-muted-foreground mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              AI radar online · real-time phishing detection
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Stop scams before they{" "}
              <span className="text-gradient-primary">reach you.</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-xl">
              Scam Shield Radar analyzes any URL, message, phone number, or image with advanced AI to flag phishing, fraud, and social-engineering attacks — instantly.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow h-12">
                <a href="#scanner">Try the scanner <ArrowRight className="h-4 w-4 ml-2" /></a>
              </Button>
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
      <section id="scanner" className="container py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-primary mb-3">Live Scanner</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Scan a URL, message, phone, or image</h2>
          <p className="text-muted-foreground mt-3">
            Paste anything suspicious — links, messages, phone numbers, or upload an image. Our AI returns a verdict, a 0–100 risk score, and the exact signals it found.
          </p>
        </div>
        <ThreatScanner ref={scannerRef} />
      </section>
    </>
  );
};

export default Index;

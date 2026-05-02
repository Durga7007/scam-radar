const steps = [
  { n: "01", t: "Paste", d: "Drop in any URL, email, phone number, or image you're unsure about." },
  { n: "02", t: "Analyze", d: "Our AI inspects domain shape, content, urgency, sender pattern, and known scam playbooks." },
  { n: "03", t: "Decide", d: "Get a clear verdict, risk score, indicators, and a next-step recommendation." },
];

const HowItWorksPage = () => (
  <section className="container py-16 md:py-24">
    <div className="max-w-2xl mx-auto text-center mb-12">
      <div className="text-xs uppercase tracking-widest text-primary mb-3">How it works</div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Three steps to safety</h1>
      <p className="text-muted-foreground mt-3 text-sm md:text-base">
        A transparent pipeline from input to verdict — no magic, just structured reasoning.
      </p>
    </div>
    <div className="grid gap-6 md:grid-cols-3">
      {steps.map((s) => (
        <div key={s.n} className="rounded-xl border border-border/60 bg-gradient-card p-6">
          <div className="text-5xl font-bold text-gradient-primary mb-3">{s.n}</div>
          <h3 className="font-semibold text-lg">{s.t}</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.d}</p>
        </div>
      ))}
    </div>
  </section>
);

export default HowItWorksPage;
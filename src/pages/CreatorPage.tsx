import { Linkedin, Mail, MapPin, User } from "lucide-react";

const CreatorPage = () => (
  <section className="container py-16 md:py-24">
    {/* About the project */}
    <div className="max-w-3xl mx-auto text-center mb-16">
      <div className="text-xs uppercase tracking-widest text-primary mb-3">About the project</div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Scam Shield Radar</h1>
      <p className="text-muted-foreground mt-4 leading-relaxed">
        Scam Shield Radar is an AI-powered phishing detection and alert system designed to protect
        everyday internet users, banking customers, and organizations from social-engineering attacks.
        It analyzes URLs, emails, phone numbers, and uploaded images in real time using advanced
        language and vision models, returning a 0–100 risk score, an itemized list of threat indicators,
        a clear verdict (safe, suspicious, or phishing), and a plain-English recommendation.
      </p>
    </div>

    {/* About the creator */}
    <div className="max-w-4xl mx-auto rounded-3xl border border-border/60 bg-gradient-card p-8 md:p-12">
      <div className="grid md:grid-cols-[auto_1fr] gap-8 items-center">
        <div className="h-28 w-28 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow mx-auto md:mx-0">
          <User className="h-12 w-12 text-primary-foreground" />
        </div>
        <div className="text-center md:text-left">
          <div className="text-xs uppercase tracking-widest text-primary mb-2">Creator</div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight uppercase">DURGASREE AVVARU</h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            Builder of Scam Shield Radar — an AI + full-stack web developer focused on shipping
            practical, AI-powered tools that solve real problems for real users.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
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
);

export default CreatorPage;
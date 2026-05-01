import { Shield } from "lucide-react";

const SiteFooter = () => (
  <footer className="border-t border-border/60">
    <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        Scam Shield Radar · AI-powered phishing detection
      </div>
      <div>© {new Date().getFullYear()} Scam Shield Radar</div>
    </div>
  </footer>
);

export default SiteFooter;
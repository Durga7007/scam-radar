import { NavLink, Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import AnimatedLogo from "@/components/AnimatedLogo";

const navItems = [
  { to: "/", label: "Scanner", end: true },
  { to: "/history", label: "History" },
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/creator", label: "Creator" },
];

const SiteHeader = () => (
  <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
    <div className="container flex items-center justify-between h-16">
      <Link to="/" className="flex items-center gap-2 font-bold">
        <AnimatedLogo size={36} />
        <span>Scam Shield <span className="text-gradient-primary">Radar</span></span>
      </Link>
      <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
        {navItems.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `transition-colors hover:text-foreground ${isActive ? "text-foreground" : ""}`
            }
          >
            {n.label}
          </NavLink>
        ))}
        <Link to="/admin" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
          <BarChart3 className="h-3.5 w-3.5" /> Admin
        </Link>
      </nav>
    </div>
  </header>
);

export default SiteHeader;
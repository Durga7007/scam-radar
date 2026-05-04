import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { BarChart3, Menu, X } from "lucide-react";
import AnimatedLogo from "@/components/AnimatedLogo";

const navItems = [
  { to: "/", label: "Scanner", end: true },
  { to: "/history", label: "History" },
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/creator", label: "Creator" },
];

const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2 font-bold text-sm sm:text-base">
          <AnimatedLogo size={32} />
          <span className="whitespace-nowrap">Scam Shield <span className="text-gradient-primary">Radar</span></span>
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
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground"
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="container flex flex-col py-3 gap-1 text-sm">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md transition-colors ${isActive ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-background/60"}`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/60 inline-flex items-center gap-2"
            >
              <BarChart3 className="h-3.5 w-3.5" /> Admin
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default SiteHeader;
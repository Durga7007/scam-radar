import { Shield } from "lucide-react";

type Props = { size?: number; className?: string };

/**
 * Animated 3D-feel shield logo:
 * - Gentle continuous tilt (rotateY) for parallax/3D feeling
 * - Pulsing glow ring + orbiting accent dot
 * - Hover: lifts and intensifies glow
 */
const AnimatedLogo = ({ size = 40, className = "" }: Props) => {
  return (
    <div
      className={`relative grid place-items-center group ${className}`}
      style={{ width: size, height: size, perspective: 400 }}
      aria-hidden
    >
      {/* Pulsing outer glow */}
      <span
        className="absolute inset-0 rounded-xl bg-primary/30 blur-md animate-pulse"
        style={{ animationDuration: "2.4s" }}
      />
      {/* Orbit ring */}
      <span
        className="absolute rounded-full border border-primary/40"
        style={{
          width: size * 1.15,
          height: size * 1.15,
          animation: "logo-orbit 6s linear infinite",
        }}
      >
        <span
          className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent shadow-glow"
        />
      </span>
      {/* Tilting shield */}
      <span
        className="relative grid place-items-center rounded-xl bg-gradient-primary shadow-glow transition-transform duration-300 group-hover:scale-110"
        style={{
          width: size,
          height: size,
          transformStyle: "preserve-3d",
          animation: "logo-tilt 5s ease-in-out infinite",
        }}
      >
        <Shield
          className="text-primary-foreground drop-shadow"
          style={{ width: size * 0.5, height: size * 0.5 }}
        />
        {/* Glossy highlight */}
        <span
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, hsl(0 0% 100% / 0.35) 0%, transparent 45%, transparent 100%)",
          }}
        />
      </span>
    </div>
  );
};

export default AnimatedLogo;
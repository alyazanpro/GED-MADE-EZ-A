import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "google" | "accent" | "gold";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
        variant === "primary" &&
          "gradient-primary text-white hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5",
        variant === "secondary" &&
          "bg-slate-700 text-white hover:bg-slate-600 border border-slate-600",
        variant === "outline" &&
          "border-2 border-indigo-500 bg-transparent text-indigo-400 hover:bg-indigo-500/10",
        variant === "ghost" &&
          "text-slate-300 hover:bg-slate-800 hover:text-white",
        variant === "google" &&
          "bg-white text-gray-800 hover:bg-gray-100 shadow-lg border border-gray-200",
        variant === "accent" &&
          "gradient-accent text-white hover:shadow-lg hover:shadow-pink-500/30 hover:-translate-y-0.5",
        variant === "gold" &&
          "gradient-gold text-slate-900 hover:shadow-lg hover:shadow-yellow-500/30 hover:-translate-y-0.5",
        size === "sm" && "px-4 py-2 text-xs",
        size === "md" && "px-6 py-3 text-sm",
        size === "lg" && "px-8 py-4 text-base",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "gold" | "purple" | "cyan";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "badge-vibrant",
        variant === "default" && "bg-slate-700 text-slate-200",
        variant === "success" && "badge-success",
        variant === "warning" && "badge-warning",
        variant === "danger" && "badge-danger",
        variant === "info" && "badge-primary",
        variant === "gold" && "badge-gold",
        variant === "purple" && "badge-purple",
        variant === "cyan" && "badge-cyan",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className,
  hover,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "card-vibrant p-6",
        hover && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ProgressBar({
  value,
  color = "blue",
  className,
}: {
  value: number;
  color?: "indigo" | "blue" | "emerald" | "amber" | "rose" | "cyan" | "violet" | "teal";
  className?: string;
}) {
  const colors = {
    indigo: "bg-indigo-500",
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    cyan: "bg-cyan-500",
    violet: "bg-violet-500",
    teal: "bg-teal-500",
  };

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", colors[color])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

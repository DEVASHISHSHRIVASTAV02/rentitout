import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50";
  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary: "bg-zinc-950 text-white hover:bg-zinc-800",
    secondary: "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50",
    ghost: "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950",
    danger: "border border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-800",
  };

  return <button className={cn(base, variants[variant], className)} {...props} />;
}

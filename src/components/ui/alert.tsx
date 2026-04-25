import { cn } from "@/lib/utils";

interface AlertProps {
  message: string;
  type?: "success" | "error" | "info";
}

export function Alert({ message, type = "info" }: AlertProps) {
  const styles: Record<NonNullable<AlertProps["type"]>, string> = {
    success: "border-zinc-300 bg-zinc-50 text-zinc-800",
    error: "border-zinc-300 bg-zinc-50 text-zinc-800",
    info: "border-zinc-300 bg-zinc-50 text-zinc-700",
  };

  return <p className={cn("rounded-xl border px-3 py-2 text-sm", styles[type])}>{message}</p>;
}

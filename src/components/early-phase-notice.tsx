import { AlertTriangle } from "lucide-react";

export function EarlyPhaseNotice() {
  return (
    <section
      className="border-b border-amber-200 bg-amber-50/90 text-amber-950"
      role="status"
      aria-label="Early access notice"
    >
      <div className="mx-auto flex w-full max-w-screen-2xl items-start gap-3 px-4 py-3 text-sm sm:px-6">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="leading-6">
          <span className="font-semibold">Early access notice:</span> RentItOut
          is still in an early phase. If you face any issue or error, please
          email{" "}
          <a
            href="mailto:devashishshrivastavwork@gmail.com"
            className="underline decoration-amber-700 underline-offset-2 hover:text-amber-800"
          >
            devashishshrivastavwork@gmail.com
          </a>
        </p>
      </div>
    </section>
  );
}

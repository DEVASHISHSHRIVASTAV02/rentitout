"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

interface AccountCreatedPopupProps {
  title?: string;
  description?: string;
}

export function AccountCreatedPopup({
  title = "Account Created",
  description = "Welcome to RentItOut. You can now list your appliances.",
}: AccountCreatedPopupProps) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    document.body.classList.toggle("modal-open", isOpen);

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/60 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
          <p className="text-sm text-zinc-700">{description}</p>
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="button" className="w-full sm:w-auto" onClick={() => setIsOpen(false)}>
            Okay
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

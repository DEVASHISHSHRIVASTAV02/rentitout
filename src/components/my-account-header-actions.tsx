"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, MoreVertical, X } from "lucide-react";
import { deleteAccountAction, signOutAction } from "@/app/actions";
import { MyAccountListingPopup } from "@/components/my-account-listing-popup";
import { Button } from "@/components/ui/button";

interface MyAccountHeaderActionsProps {
  defaultContactEmail: string;
}

export function MyAccountHeaderActions({ defaultContactEmail }: MyAccountHeaderActionsProps) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [isDeleteAccountConfirmOpen, setIsDeleteAccountConfirmOpen] = useState(false);
  const hasOpenModal = isSignOutConfirmOpen || isDeleteAccountConfirmOpen;

  useEffect(() => {
    document.body.classList.toggle("modal-open", hasOpenModal);
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [hasOpenModal]);

  const closeActionsMenu = () => {
    menuRef.current?.removeAttribute("open");
  };

  return (
    <>
      <details ref={menuRef} className="relative ml-auto">
        <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 [&::-webkit-details-marker]:hidden">
          <MoreVertical className="h-5 w-5" />
        </summary>
        <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
          <MyAccountListingPopup
            defaultContactEmail={defaultContactEmail}
            triggerVariant="ghost"
            triggerClassName="w-full justify-start rounded-lg px-3 py-2 text-sm font-medium tracking-normal"
            onTriggerClick={closeActionsMenu}
          />
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start rounded-lg px-3 py-2 text-sm font-medium tracking-normal"
            onClick={() => {
              closeActionsMenu();
              setIsSignOutConfirmOpen(true);
            }}
          >
            Sign Out
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start rounded-lg px-3 py-2 text-sm font-medium tracking-normal !text-red-600 hover:bg-red-50 hover:!text-red-700"
            onClick={() => {
              closeActionsMenu();
              setIsDeleteAccountConfirmOpen(true);
            }}
          >
            Delete Account
            <AlertTriangle className="ml-2 h-4 w-4 !text-red-600" />
          </Button>
        </div>
      </details>

      {isSignOutConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/50 px-4 py-6 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Confirm</p>
                <h3 className="mt-1 text-lg font-semibold text-zinc-950">Log Out</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSignOutConfirmOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Close logout confirmation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-zinc-700">Do you really want to log out?</p>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsSignOutConfirmOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <form action={signOutAction} className="w-full sm:w-auto">
                <Button type="submit" className="w-full sm:w-auto">
                  Yes, Log Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteAccountConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/50 px-4 py-6 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-rose-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Caution
                </p>
                <h3 className="mt-1 text-lg font-semibold text-zinc-950">Delete Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteAccountConfirmOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Close delete account confirmation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-zinc-700">
              Are you sure you want to delete your account and all listings/info associated with it? This action is
              permanent and cannot be recovered.
            </p>

            <div className="mt-5 space-y-2">
              <form action={deleteAccountAction} className="w-full">
                <Button type="submit" variant="danger" className="w-full">
                  Confirm Delete Account
                </Button>
              </form>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setIsDeleteAccountConfirmOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

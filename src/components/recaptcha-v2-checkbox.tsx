"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

interface RecaptchaV2CheckboxProps {
  onTokenChange: (token: string | null) => void;
  resetSignal: number;
}

interface RecaptchaRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
}

interface RecaptchaApi {
  ready(callback: () => void): void;
  render(container: HTMLElement, options: RecaptchaRenderOptions): number;
  reset(widgetId?: number): void;
}

declare global {
  interface Window {
    grecaptcha?: RecaptchaApi;
  }
}

const RECAPTCHA_SCRIPT_ID = "google-recaptcha-v2";
const RECAPTCHA_SCRIPT_SRC = "https://www.google.com/recaptcha/api.js?render=explicit";
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

export function RecaptchaV2Checkbox({ onTokenChange, resetSignal }: RecaptchaV2CheckboxProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const [isScriptReady, setIsScriptReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.grecaptcha),
  );
  const [widgetError, setWidgetError] = useState("");

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || !isScriptReady || !containerRef.current || widgetIdRef.current !== null) {
      return;
    }

    const api = window.grecaptcha;
    if (!api) {
      return;
    }

    api.ready(() => {
      if (!containerRef.current || widgetIdRef.current !== null) {
        return;
      }

      widgetIdRef.current = api.render(containerRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: (token: string) => {
          setWidgetError("");
          onTokenChangeRef.current(token);
        },
        "expired-callback": () => {
          onTokenChangeRef.current(null);
        },
        "error-callback": () => {
          onTokenChangeRef.current(null);
          setWidgetError("Captcha could not load properly. Please try again.");
        },
      });
    });
  }, [isScriptReady]);

  useEffect(() => {
    if (widgetIdRef.current === null) {
      return;
    }

    window.grecaptcha?.reset(widgetIdRef.current);
    onTokenChangeRef.current(null);
    setWidgetError("");
  }, [resetSignal]);

  if (!RECAPTCHA_SITE_KEY) {
    return <p className="text-sm text-rose-700">Captcha is not configured for this environment.</p>;
  }

  return (
    <div className="space-y-2">
      <Script
        id={RECAPTCHA_SCRIPT_ID}
        src={RECAPTCHA_SCRIPT_SRC}
        onReady={() => setIsScriptReady(true)}
        onError={() => setWidgetError("Captcha script failed to load. Please refresh and try again.")}
      />
      <div ref={containerRef} className="min-h-[78px] w-full" />
      {widgetError ? <p className="text-sm text-rose-700">{widgetError}</p> : null}
    </div>
  );
}

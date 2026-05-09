"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

interface SubmitCooldownButtonProps extends Omit<ComponentProps<typeof Button>, "type"> {
  cooldownMs?: number;
}

export function SubmitCooldownButton({
  cooldownMs = 3000,
  disabled,
  onClick,
  ...props
}: SubmitCooldownButtonProps) {
  const { pending } = useFormStatus();
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const cooldownTimerRef = useRef<number | null>(null);
  const armCooldownTimerRef = useRef<number | null>(null);
  const clickLockedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (armCooldownTimerRef.current !== null) {
        window.clearTimeout(armCooldownTimerRef.current);
        armCooldownTimerRef.current = null;
      }
      if (cooldownTimerRef.current !== null) {
        window.clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
      clickLockedRef.current = false;
    };
  }, []);

  const handleClick: ComponentProps<typeof Button>["onClick"] = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }

    if (clickLockedRef.current) {
      event.preventDefault();
      return;
    }
    clickLockedRef.current = true;

    if (armCooldownTimerRef.current !== null) {
      window.clearTimeout(armCooldownTimerRef.current);
    }

    armCooldownTimerRef.current = window.setTimeout(() => {
      armCooldownTimerRef.current = null;
      setIsCoolingDown(true);

      if (cooldownTimerRef.current !== null) {
        window.clearTimeout(cooldownTimerRef.current);
      }
      cooldownTimerRef.current = window.setTimeout(() => {
        setIsCoolingDown(false);
        cooldownTimerRef.current = null;
        clickLockedRef.current = false;
      }, cooldownMs);
    }, 0);
  };

  const isDisabled = Boolean(disabled) || pending || isCoolingDown;

  return <Button type="submit" disabled={isDisabled} onClick={handleClick} {...props} />;
}

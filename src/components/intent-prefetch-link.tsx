"use client";

import { useState } from "react";
import Link from "next/link";

type IntentPrefetchLinkProps = React.ComponentProps<typeof Link>;

export function IntentPrefetchLink({
  onMouseEnter,
  onTouchStart,
  ...props
}: IntentPrefetchLinkProps) {
  const [intentDetected, setIntentDetected] = useState(false);

  return (
    <Link
      {...props}
      prefetch={intentDetected ? null : false}
      onMouseEnter={(event) => {
        setIntentDetected(true);
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        setIntentDetected(true);
        onTouchStart?.(event);
      }}
    />
  );
}

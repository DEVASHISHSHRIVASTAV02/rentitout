import Link from "next/link";

type IntentPrefetchLinkProps = React.ComponentProps<typeof Link>;

export function IntentPrefetchLink({
  prefetch,
  ...props
}: IntentPrefetchLinkProps) {
  return (
    <Link
      {...props}
      prefetch={prefetch ?? false}
    />
  );
}

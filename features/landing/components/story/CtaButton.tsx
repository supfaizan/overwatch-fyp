import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CallToAction } from "../../types";

export function CtaButton({
  cta,
  className,
}: {
  cta: CallToAction;
  className?: string;
}) {
  return (
    <Button
      asChild
      size="lg"
      className={cn(
        "group h-12 self-start rounded-full px-6 text-[15px] has-[>svg]:px-6",
        className,
      )}
    >
      <Link href={cta.href}>
        {cta.label}
        <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
    </Button>
  );
}

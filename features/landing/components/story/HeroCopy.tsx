import { HERO } from "../../static/story";
import { CtaButton } from "./CtaButton";

export function HeroCopy() {
  return (
    <>
      <h1 className="text-[clamp(2.5rem,4.6vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.035em] text-text-hi">
        {HERO.title}
        <br />
        <span className="text-signal">{HERO.titleAccent}</span>
      </h1>
      <p className="mt-6 max-w-sm text-lg leading-relaxed text-pretty text-text-mid">
        {HERO.body}
      </p>
      <CtaButton cta={HERO.cta} className="mt-10" />
    </>
  );
}

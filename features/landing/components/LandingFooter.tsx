import { APP_NAME } from "@/constants";

export function LandingFooter() {
  return (
    <footer className="border-t border-line-1">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim sm:flex-row sm:justify-between sm:px-8 lg:px-10">
        <span>{APP_NAME}</span>
        <span>FYP · UMT Lahore 2026</span>
      </div>
    </footer>
  );
}

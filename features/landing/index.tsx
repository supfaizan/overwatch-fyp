/* ============================================================
   OVERWATCH — Landing
   A scroll story: one sample system graph that changes chapter by chapter.

   components/story  layout, rail and copy (what the reader follows)
   components/stage  the illustrated graph (what the reader watches)
   lib/scene.ts      chapter → graph appearance, as a pure function
   static/           every word of copy and all sample data
   ============================================================ */

import { LandingFooter } from "./components/LandingFooter";
import { LandingNav } from "./components/LandingNav";
import { Story } from "./components/story/Story";

export function Landing() {
  return (
    <div className="min-h-full overflow-x-clip bg-ink-850 text-text-hi">
      <LandingNav />
      <main>
        <Story />
      </main>
      <LandingFooter />
    </div>
  );
}

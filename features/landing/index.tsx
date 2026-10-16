import { PRODUCT_NAME } from '@/shared/lib/env';
import Accountability from './components/accountability';
import Faq from './components/faq';
import HeroCta from './components/hero-cta';
import HeroHeadline from './components/hero-headline';
import HeroPreview from './components/hero-preview';
import { IntegrationArcs, IntegrationRow } from './components/integration-arcs';
import LandingNav from './components/landing-nav';
import { SECTION_IDS } from './constants';

export { default as Footer } from './components/footer';
export { SECTION_IDS } from './constants';

/**
 * The landing page's hero, the case for it and the FAQ. With `waitlistAnchor` the only way in is the waitlist section with that id;
 * without it, visitors sign up or log in.
 */
const Landing = ({ waitlistAnchor }: { waitlistAnchor?: string }) => {
  return (
    <>
      <section className="-mx-4 -mt-2 overflow-hidden bg-linear-to-b from-background from-35% via-primary/20 via-65% to-background pb-16">
        {/* the arcs end where the preview begins, so this area keeps their aspect ratio */}
        <div className="relative mx-auto flex max-w-[1600px] flex-col items-center gap-8 px-4 pt-28 pb-10 md:aspect-[1336/600] md:min-h-[480px] md:justify-center md:pt-12 md:pb-32">
          <IntegrationArcs />
          <LandingNav signIn={!waitlistAnchor} />
          <HeroHeadline />
          <HeroCta
            href={waitlistAnchor ? `#${waitlistAnchor}` : '/sign-up'}
            label={waitlistAnchor ? 'Join waitlist' : `Try ${PRODUCT_NAME}`}
          />
          <IntegrationRow />
        </div>
        <div className="px-4">
          <HeroPreview />
        </div>
      </section>
      <Accountability id={SECTION_IDS.why} />
      <Faq id={SECTION_IDS.faq} />
    </>
  );
};

export default Landing;

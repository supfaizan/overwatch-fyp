import { PRODUCT_NAME } from '@/shared/lib/env';
import { CheckCircle } from '@phosphor-icons/react/ssr';
import WaitlistArt from './components/waitlist-art';
import WaitlistForm from './components/waitlist-form';

const PERKS = [
  `You'll be first in line for the ${PRODUCT_NAME} private beta.`,
  "Your invite lands in your inbox as soon as there's a spot, and nothing else in between.",
  'Free for the whole beta, with no card needed.',
  'Your feedback goes straight to the people building it, and shapes what comes next.',
];

/** The waitlist signup, as a section of the landing page; `id` is what its call to action scrolls to. */
const Waitlist = ({ id }: { id: string }) => {
  return (
    <section
      id={id}
      className="mx-auto grid max-w-6xl scroll-mt-8 gap-12 px-4 py-24 lg:grid-cols-2 lg:gap-16"
    >
      <div className="relative isolate flex min-h-[36rem] flex-col overflow-hidden rounded-3xl border border-border bg-primary/5 bg-dot-grid p-8 md:p-10">
        <WaitlistArt />
        <div className="relative flex max-w-sm flex-col gap-5">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Join the waitlist</h2>
          <ul className="flex flex-col gap-3">
            {PERKS.map((perk) => {
              return (
                <li key={perk} className="flex gap-3 text-sm text-muted md:text-base">
                  <CheckCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-primary" />
                  {perk}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-semibold tracking-tight">Save your spot</h3>
          <p className="text-muted">
            {`${PRODUCT_NAME} is in private beta. Leave your details and we'll be in touch.`}
          </p>
        </div>
        <WaitlistForm />
      </div>
    </section>
  );
};

export default Waitlist;

import WaitlistGrid from './components/waitlist-grid';

const Waitlist = () => {
  return (
    <section className="relative -mx-4 -mt-2 min-h-[581px] overflow-hidden px-4 py-12">
      <h1 className="relative z-10">Waitlist here</h1>
      <div className="pointer-events-none absolute top-0 right-0 w-[min(72vw,528px)] md:w-[min(49.2vw,528px)]">
        <WaitlistGrid />
      </div>
    </section>
  );
};

export default Waitlist;

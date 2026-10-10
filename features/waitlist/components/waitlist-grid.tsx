import { useId } from 'react';

export default function WaitlistGrid() {
  const id = useId();

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 440 484"
      className="block h-auto w-full"
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" x2="440" gradientUnits="userSpaceOnUse">
          <stop className="[stop-color:var(--color-primary)]" stopOpacity="0.5" />
          <stop offset="1" className="[stop-color:var(--color-primary)]" stopOpacity="0.025" />
        </linearGradient>
        <clipPath id={`${id}-shape`}>
          <path d="M0 0H432V484H168V402H88V333H168V250H4V165H84V82H0Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-shape)`}>
        <rect width="440" height="484" fill={`url(#${id}-fill)`} />
        <path
          d="M-72 0V484M12 0V484M96 0V484M180 0V484M264 0V484M348 0V484M432 0V484M516 0V484M-84 82H524M-84 166H524M-84 250H524M-84 334H524M-84 418H524"
          className="fill-none stroke-grid motion-safe:animate-grid-drift"
          strokeWidth="1.5"
        />
        <path
          d="M6 0V82M90 82V165M10 165V250M174 250V333M94 333V402M174 402V484"
          className="fill-none stroke-primary"
          strokeWidth="12"
        />
        <path
          d="M0 0V82H84V165H4V250H168V333H88V402H168V484"
          className="fill-none stroke-primary"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}

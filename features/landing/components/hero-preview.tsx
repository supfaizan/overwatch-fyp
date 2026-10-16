'use client';

import { useEffect, useRef } from 'react';
import { HERO_VIDEO, REDUCED_MOTION } from '../constants';

/** The app at work, looping silently; with reduced motion it stays on the poster. */
export default function HeroPreview() {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!video.current || window.matchMedia(REDUCED_MOTION).matches) {
      return;
    }
    video.current.play().catch(() => {
      // autoplay can be blocked (e.g. battery saver); the poster stays up
      return undefined;
    });
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl rounded-2xl border border-border-strong bg-surface p-2 shadow-lg md:w-3/4 md:p-3">
      <video
        ref={video}
        muted
        loop
        playsInline
        preload="metadata"
        poster={HERO_VIDEO.poster}
        width={HERO_VIDEO.width}
        height={HERO_VIDEO.height}
        aria-label="A short tour of the app"
        className="block h-auto w-full rounded-lg border border-border"
      >
        <source src={HERO_VIDEO.webm} type="video/webm" />
        <source src={HERO_VIDEO.mp4} type="video/mp4" />
      </video>
    </div>
  );
}

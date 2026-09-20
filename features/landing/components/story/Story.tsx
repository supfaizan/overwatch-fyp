"use client";

import { useRef } from "react";
import { useActiveStep, useStoryRail } from "../../hooks";
import { CHAPTERS, CLOSING, HERO, STORY_SCENES } from "../../static/story";
import { Stage } from "../stage/Stage";
import { CtaButton } from "./CtaButton";
import { HeroCopy } from "./HeroCopy";
import { RailLine, ScrollCue } from "./Rail";
import { StepHeading } from "./StepHeading";
import { StoryStep } from "./StoryStep";

const CLOSING_STEP = STORY_SCENES.length - 1;

/** The scroll story. Steps run down the left column along the rail. On large
 *  screens one sticky stage on the right follows the active step. */
export function Story() {
  const stepsRef = useRef<HTMLDivElement>(null);
  const activeStep = useActiveStep(stepsRef);
  useStoryRail(stepsRef);

  const stepProps = (index: number) => ({
    index,
    active: index === activeStep,
    mode: STORY_SCENES[index],
    entryMode: STORY_SCENES[Math.max(index - 1, 0)],
  });

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-x-12 px-5 sm:px-8 lg:grid-cols-2 lg:px-10">
      <div
        ref={stepsRef}
        className="relative pl-(--rail-gutter) [--rail-gutter:1.75rem] sm:[--rail-gutter:3rem]"
      >
        <StoryStep {...stepProps(0)} className="min-h-svh pt-28 lg:min-h-svh">
          <HeroCopy />
          <ScrollCue label={HERO.scrollHint} />
        </StoryStep>

        <RailLine>
          {CHAPTERS.map((chapter, i) => {
            const index = i + 1;
            return (
              <StoryStep key={chapter.mode} {...stepProps(index)}>
                <StepHeading
                  number={index}
                  label={chapter.label}
                  title={chapter.title}
                  body={chapter.body}
                  active={index === activeStep}
                />
              </StoryStep>
            );
          })}
        </RailLine>

        <StoryStep
          {...stepProps(CLOSING_STEP)}
          className="justify-start pt-0 lg:min-h-[75svh]"
        >
          <StepHeading
            terminal
            label={CLOSING.label}
            title={CLOSING.title}
            body={CLOSING.body}
            active={CLOSING_STEP === activeStep}
          />
          <CtaButton cta={CLOSING.cta} className="mt-10" />
        </StoryStep>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-0 flex h-svh items-center pt-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(closest-side,var(--ow-signal-soft),transparent)] opacity-60"
          />
          <Stage mode={STORY_SCENES[activeStep]} />
        </div>
      </div>
    </div>
  );
}

/** Logos of the tools we connect to, under public/integrations; GitHub uses the shared GitHub mark instead. */
export const INTEGRATION_LOGOS = {
  clickup: '/integrations/clickup.png',
  confluence: '/integrations/confluence.png',
  figma: '/integrations/figma.webp',
  gitlab: '/integrations/gitlab.png',
  googleCalendar: '/integrations/google-calendar.webp',
  googleMeet: '/integrations/google-meet.png',
  granola: '/integrations/granola.png',
  jira: '/integrations/jira.png',
  slack: '/integrations/slack.webp',
} as const;

/** The `source` of items and pages made here rather than mirrored from an integration. */
export const NATIVE_SOURCE = 'native';

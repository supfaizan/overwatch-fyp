import { PRODUCT_NAME } from '@/shared/lib/env';

export type LegalDocument = {
  title: string;
  updated: string;
  intro: string;
  sections: readonly { heading: string; body: string }[];
};

const UPDATED = 'October 16, 2026';

export const LEGAL_DOCUMENTS = {
  privacy: {
    title: 'Privacy policy',
    updated: UPDATED,
    intro:
      `This policy explains what ${PRODUCT_NAME} collects, why, and the choices you have. We collect as little as we need to run the product.`,
    sections: [
      {
        heading: 'What we collect',
        body:
          'Your name, email address and username; the GitHub account you connect; and the content of the tools you connect to a workspace (repositories, tickets and pages), which we read to build your workspace. If you join the waitlist, we keep your name, email and how you heard about us.',
      },
      {
        heading: 'How we use it',
        body:
          'To run and secure your account and workspaces, to show you how your code and decisions connect, to send emails you need (sign-in codes, invites, beta invitations), and to improve the product. We never sell your data.',
      },
      {
        heading: 'Who we share it with',
        body:
          'Only the providers that host and run the service for us (hosting, database and email delivery), under agreements that keep your data confidential, or when the law requires it.',
      },
      {
        heading: 'How long we keep it',
        body:
          'For as long as your account or workspace exists. When you disconnect a repository, its copy and graph are deleted; when you delete your account, your personal data is deleted within 30 days, except where we must keep records by law.',
      },
      {
        heading: 'Your rights',
        body:
          'You can see, correct, export or delete your data at any time from your settings, or by contacting us. You can unsubscribe from the waitlist by replying to any email we send.',
      },
    ],
  },
  terms: {
    title: 'Terms of service',
    updated: UPDATED,
    intro:
      `These terms apply when you use ${PRODUCT_NAME}. By creating an account or joining the waitlist, you agree to them.`,
    sections: [
      {
        heading: 'Your account',
        body:
          'Keep your sign-in details safe and tell us if you think someone else has used your account. You are responsible for what happens in workspaces you own.',
      },
      {
        heading: 'Your content',
        body:
          'You keep all rights to the code, documents and data you bring in. You give us permission to process them only to provide the service to you and your team.',
      },
      {
        heading: 'Acceptable use',
        body:
          "Don't break the law with the service, try to access other people's workspaces, overload or reverse engineer it, or connect content you don't have the right to share.",
      },
      {
        heading: 'Beta',
        body:
          'During the private beta the service is free and provided as is. Features may change or stop, and we may limit access while we grow.',
      },
      {
        heading: 'Ending',
        body:
          'You can stop using the service and delete your account at any time. We may suspend accounts that break these terms. We will tell you before we change these terms in ways that matter.',
      },
      {
        heading: 'Liability',
        body:
          'To the extent the law allows, we are not liable for indirect or consequential losses, and our total liability is limited to what you paid us in the last 12 months.',
      },
    ],
  },
  cookies: {
    title: 'Cookie policy',
    updated: UPDATED,
    intro:
      `${PRODUCT_NAME} uses a small number of cookies and similar storage, only to keep you signed in and remember your preferences. We don't use advertising or tracking cookies.`,
    sections: [
      {
        heading: 'Strictly necessary',
        body:
          'A secure session cookie keeps you signed in, and a short-lived cookie protects sign-in with GitHub. The service cannot work without them, so they are always on.',
      },
      {
        heading: 'Preferences',
        body:
          "Your browser's local storage remembers choices such as your theme, board views and panel sizes. They never leave your device.",
      },
      {
        heading: 'Managing cookies',
        body:
          'You can clear or block cookies in your browser settings. Blocking the necessary ones will sign you out.',
      },
    ],
  },
} as const satisfies Record<string, LegalDocument>;

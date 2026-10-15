/**
 * Sites whose links can play inside a page. Each turns one of its share links into the address its
 * player lives at, or says no (a profile page, say), and the link shows as a card instead. Add a site
 * here and it's embeddable everywhere; `EMBED_ORIGINS` lets the browser frame exactly these players.
 */
type EmbedProvider = {
  name: string;
  /** The hosts its share links come from; subdomains count too. */
  hosts: string[];
  /** Where its player is; must be one of `frames`. */
  frames: string[];
  player: (url: URL) => string | null;
};

const lastSegment = (url: URL) => {
  return url.pathname.split('/').filter(Boolean).at(-1) ?? '';
};

const PROVIDERS: EmbedProvider[] = [
  {
    name: 'Loom',
    hosts: ['loom.com'],
    frames: ['https://www.loom.com'],
    player: (
      url,
    ) => {
      return (/^\/(share|embed)\//.test(url.pathname)
        ? `https://www.loom.com/embed/${lastSegment(url)}`
        : null);
    },
  },
  {
    name: 'YouTube',
    hosts: ['youtube.com', 'youtu.be'],
    frames: ['https://www.youtube-nocookie.com'],
    player: (url) => {
      const id = url.hostname.endsWith('youtu.be')
        ? lastSegment(url)
        : (url.searchParams.get('v')
          ?? (/^\/(embed|shorts|live)\//.test(url.pathname) ? lastSegment(url) : null));
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    },
  },
  {
    name: 'Vimeo',
    hosts: ['vimeo.com'],
    frames: ['https://player.vimeo.com'],
    player: (
      url,
    ) => {
      return (/^\d+$/.test(lastSegment(url))
        ? `https://player.vimeo.com/video/${lastSegment(url)}`
        : null);
    },
  },
  {
    name: 'Figma',
    hosts: ['figma.com'],
    frames: ['https://embed.figma.com'],
    player: (url) => {
      return /^\/(file|design|proto|board|slides)\//.test(url.pathname)
        ? `https://embed.figma.com${url.pathname}?${new URLSearchParams({
          ...Object.fromEntries(url.searchParams),
          'embed-host': 'overwatch',
        })}`
        : null;
    },
  },
  {
    name: 'Google Docs',
    hosts: ['docs.google.com'],
    frames: ['https://docs.google.com'],
    player: (url) => {
      const doc = url.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/[\w-]+/);
      return doc ? `https://docs.google.com${doc[0]}/preview` : null;
    },
  },
];

/** The sites that can play in a page, for telling people which. */
export const EMBED_PROVIDERS = PROVIDERS.map((provider) => {
  return provider.name;
});

/** Where the browser may frame pages from. */
export const EMBED_ORIGINS = PROVIDERS.flatMap((provider) => {
  return provider.frames;
});

const parse = (link: string) => {
  try {
    const url = new URL(link);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
};

const matches = (hostname: string, host: string) => {
  return hostname === host || hostname.endsWith(`.${host}`);
};

/** The player for a link and whose it is, or null when it isn't one of the embeddable sites. */
export function embedFor(link: string): { src: string; provider: string } | null {
  const url = parse(link);
  const provider = url
    && PROVIDERS.find((candidate) => {
      return candidate.hosts.some((host) => {
        return matches(url.hostname, host);
      });
    });
  const src = url && provider?.player(url);
  return src && provider ? { src, provider: provider.name } : null;
}

/** A link's host without `www.`, what its card shows when nothing better is known. */
export function hostOf(link: string): string {
  return parse(link)?.hostname.replace(/^www\./, '') ?? link;
}

/** Whether pasted text is just one web link. */
export const isWebLink = (text: string) => {
  return !/\s/.test(text.trim()) && parse(text.trim()) !== null;
};

import { describe, expect, it } from 'vitest';
import { embedFor, hostOf, isWebLink } from './embeds';

describe('embedFor', () => {
  it.each([
    ['https://www.loom.com/share/abc123?sid=x', 'https://www.loom.com/embed/abc123'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
    ['https://vimeo.com/76979871', 'https://player.vimeo.com/video/76979871'],
    ['https://docs.google.com/document/d/1AbC-d_E/edit#heading=h', 'https://docs.google.com/document/d/1AbC-d_E/preview'],
  ])('plays %s from its player', (link, src) => {
    expect(embedFor(link)?.src).toBe(src);
  });

  it('frames Figma files through its embed host', () => {
    expect(embedFor('https://www.figma.com/design/KEY/Name?node-id=1-2')?.src).toBe('https://embed.figma.com/design/KEY/Name?node-id=1-2&embed-host=overwatch');
  });

  it.each([
    'https://loom.com.evil.io/share/abc',
    'https://evilloom.com/share/abc',
    'https://www.loom.com/looms/videos',
    'https://www.youtube.com/@channel',
    'javascript:alert(1)',
    'not a link',
  ])('shows %s as a card instead', (link) => {
    expect(embedFor(link)).toBeNull();
  });
});

describe('links', () => {
  it('names a link by its host and knows a pasted link from text', () => {
    expect(hostOf('https://www.loom.com/share/a')).toBe('loom.com');
    expect(isWebLink('  https://x.dev/a  ')).toBe(true);
    expect(isWebLink('see https://x.dev')).toBe(false);
    expect(isWebLink('mailto:a@b.c')).toBe(false);
  });
});

import Markdown from '@/shared/components/markdown';

const SAMPLE = `### Acceptance criteria

- \`GET /orders/:id\` returns no **components** field on a plain line
- Kit lines are unchanged ([spec](https://example.com))

\`\`\`ts
const lines = order.items.filter((item) => item.components?.length);
\`\`\`

![a diagram from somewhere](https://example.com/diagram.png)`;

export function Default() {
  return <Markdown>{SAMPLE}</Markdown>;
}

export function Streaming() {
  return (
    <Markdown streaming>
      {'Writing **this answer** as it arrives:\n\n- first point\n- seco'}
    </Markdown>
  );
}

export function RevealedWhileStreaming() {
  return (
    <Markdown streaming reveal>
      {'Each new word **fades in** as the answer arrives, unless reduced motion is on.'}
    </Markdown>
  );
}

export function HighlightedCode() {
  return <Markdown highlightCode>{SAMPLE}</Markdown>;
}

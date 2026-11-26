import React from 'react';

export type MarkdownInlineToken =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'italic'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'link'; label: string; href: string };

export type MarkdownBlockNode =
  | { kind: 'heading'; level: 1 | 2 | 3; tokens: MarkdownInlineToken[] }
  | { kind: 'paragraph'; tokens: MarkdownInlineToken[] }
  | { kind: 'unordered-list'; items: MarkdownInlineToken[][] }
  | { kind: 'ordered-list'; items: MarkdownInlineToken[][] }
  | { kind: 'blockquote'; lines: MarkdownInlineToken[][] }
  | { kind: 'code-block'; language: string; code: string }
  | { kind: 'divider' };

/**
 * Validates URLs strictly to http/https so unsafe protocols (e.g. javascript:, data:)
 * are never rendered as clickable anchors.
 */
export function sanitizeMarkdownLinkUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Pure, XSS-safe inline Markdown tokenizer supporting **bold**, *italic*,
 * `inline code`, and [label](https://...) links without dangerouslySetInnerHTML.
 */
export function parseMarkdownInline(input: string): MarkdownInlineToken[] {
  if (!input) return [];
  const tokens: MarkdownInlineToken[] = [];
  const pattern =
    /(`[^`\n]+`|\*\*[^*\n]+?\*\*|__[^_\n]+?__|(?<!\*)\*[^*\n]+?\*(?!\*)|(?<!_)_[^_\n]+?_(?!_)|\[[^\]\n]+\]\([^)\s\n]+\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: 'text', text: input.slice(lastIndex, match.index) });
    }

    const segment = match[0];
    if (segment.startsWith('`') && segment.endsWith('`')) {
      tokens.push({ kind: 'code', text: segment.slice(1, -1) });
    } else if (
      (segment.startsWith('**') && segment.endsWith('**')) ||
      (segment.startsWith('__') && segment.endsWith('__'))
    ) {
      tokens.push({ kind: 'bold', text: segment.slice(2, -2) });
    } else if (
      (segment.startsWith('*') && segment.endsWith('*')) ||
      (segment.startsWith('_') && segment.endsWith('_'))
    ) {
      tokens.push({ kind: 'italic', text: segment.slice(1, -1) });
    } else if (segment.startsWith('[')) {
      const closeBracket = segment.indexOf('](');
      const label = segment.slice(1, closeBracket);
      const rawUrl = segment.slice(closeBracket + 2, -1);
      const safeHref = sanitizeMarkdownLinkUrl(rawUrl);
      if (safeHref && label) {
        tokens.push({ kind: 'link', label, href: safeHref });
      } else {
        tokens.push({ kind: 'text', text: label || segment });
      }
    } else {
      tokens.push({ kind: 'text', text: segment });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < input.length) {
    tokens.push({ kind: 'text', text: input.slice(lastIndex) });
  }

  return tokens;
}

/**
 * Pure Markdown block parser producing an AST rendered strictly with React elements.
 */
export function parseMarkdownBlocks(markdown: string): MarkdownBlockNode[] {
  const normalized = markdown.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const blocks: MarkdownBlockNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code block ```
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({
        kind: 'code-block',
        language,
        code: codeLines.join('\n'),
      });
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push({ kind: 'divider' });
      i++;
      continue;
    }

    // Headings # / ## / ###
    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3;
      blocks.push({
        kind: 'heading',
        level,
        tokens: parseMarkdownInline(headingMatch[2].trim()),
      });
      i++;
      continue;
    }

    // Blockquote >
    if (/^>\s?/.test(trimmed)) {
      const quoteLines: MarkdownInlineToken[][] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        const text = lines[i].trim().replace(/^>\s?/, '');
        quoteLines.push(parseMarkdownInline(text));
        i++;
      }
      blocks.push({ kind: 'blockquote', lines: quoteLines });
      continue;
    }

    // Unordered list (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      const items: MarkdownInlineToken[][] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(parseMarkdownInline(lines[i].trim().replace(/^[-*]\s+/, '')));
        i++;
      }
      blocks.push({ kind: 'unordered-list', items });
      continue;
    }

    // Ordered list (1. 2. ...)
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: MarkdownInlineToken[][] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(parseMarkdownInline(lines[i].trim().replace(/^\d+\.\s+/, '')));
        i++;
      }
      blocks.push({ kind: 'ordered-list', items });
      continue;
    }

    // Paragraph (join consecutive plain text lines)
    const paraLines: string[] = [];
    while (i < lines.length) {
      const curr = lines[i].trim();
      if (
        !curr ||
        curr.startsWith('```') ||
        /^(#{1,3})\s+/.test(curr) ||
        /^>\s?/.test(curr) ||
        /^[-*]\s+/.test(curr) ||
        /^\d+\.\s+/.test(curr) ||
        /^(-{3,}|\*{3,})$/.test(curr)
      ) {
        break;
      }
      paraLines.push(curr);
      i++;
    }
    blocks.push({
      kind: 'paragraph',
      tokens: parseMarkdownInline(paraLines.join(' ')),
    });
  }

  return blocks;
}

function renderInlineTokens(tokens: MarkdownInlineToken[], keyPrefix: string): React.ReactNode {
  return tokens.map((token, idx) => {
    const key = `${keyPrefix}-${idx}`;
    switch (token.kind) {
      case 'bold':
        return (
          <strong key={key} className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
            {token.text}
          </strong>
        );
      case 'italic':
        return (
          <em key={key} className="italic">
            {token.text}
          </em>
        );
      case 'code':
        return (
          <code
            key={key}
            className="px-1.5 py-0.5 rounded-md bg-[#F2EEE8] dark:bg-[#22252A] font-mono-tabular text-[11px] text-[#C4622D] dark:text-[#E07B46]"
          >
            {token.text}
          </code>
        );
      case 'link':
        return (
          <a
            key={key}
            href={token.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[#146C53]/50 text-[#146C53] dark:text-[#2EB88B] hover:opacity-80"
          >
            {token.label}
          </a>
        );
      case 'text':
      default:
        return <React.Fragment key={key}>{token.text}</React.Fragment>;
    }
  });
}

export const MarkdownPreview: React.FC<{
  content: string;
  className?: string;
}> = ({ content, className = '' }) => {
  const blocks = parseMarkdownBlocks(content);

  if (blocks.length === 0) {
    return (
      <p className={`text-xs italic text-[#8A847A] ${className}`}>
        Nothing written yet.
      </p>
    );
  }

  return (
    <div className={`space-y-2.5 text-xs sm:text-sm leading-relaxed text-[#43484E] dark:text-[#C4C9D0] ${className}`}>
      {blocks.map((block, index) => {
        const key = `md-block-${index}`;
        switch (block.kind) {
          case 'heading': {
            if (block.level === 1) {
              return (
                <h4
                  key={key}
                  className="font-display text-base font-semibold text-[#17191C] dark:text-[#F4F2EE] pt-1"
                >
                  {renderInlineTokens(block.tokens, key)}
                </h4>
              );
            }
            if (block.level === 2) {
              return (
                <h5
                  key={key}
                  className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE] pt-0.5"
                >
                  {renderInlineTokens(block.tokens, key)}
                </h5>
              );
            }
            return (
              <h6
                key={key}
                className="text-xs font-semibold uppercase tracking-wider text-[#146C53] dark:text-[#2EB88B] pt-0.5"
              >
                {renderInlineTokens(block.tokens, key)}
              </h6>
            );
          }
          case 'paragraph':
            return <p key={key}>{renderInlineTokens(block.tokens, key)}</p>;
          case 'unordered-list':
            return (
              <ul key={key} className="list-disc pl-5 space-y-1">
                {block.items.map((itemTokens, itemIdx) => (
                  <li key={`${key}-li-${itemIdx}`}>
                    {renderInlineTokens(itemTokens, `${key}-li-${itemIdx}`)}
                  </li>
                ))}
              </ul>
            );
          case 'ordered-list':
            return (
              <ol key={key} className="list-decimal pl-5 space-y-1">
                {block.items.map((itemTokens, itemIdx) => (
                  <li key={`${key}-ol-${itemIdx}`}>
                    {renderInlineTokens(itemTokens, `${key}-ol-${itemIdx}`)}
                  </li>
                ))}
              </ol>
            );
          case 'blockquote':
            return (
              <blockquote
                key={key}
                className="border-l-2 border-[#C4622D] dark:border-[#E07B46] pl-3 py-1 bg-[#FAF8F5] dark:bg-[#121315] rounded-r-lg italic text-[#575B62] dark:text-[#A3A7AE] space-y-1"
              >
                {block.lines.map((lineTokens, lineIdx) => (
                  <p key={`${key}-q-${lineIdx}`}>
                    {renderInlineTokens(lineTokens, `${key}-q-${lineIdx}`)}
                  </p>
                ))}
              </blockquote>
            );
          case 'code-block':
            return (
              <pre
                key={key}
                className="rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-2.5 overflow-x-auto font-mono-tabular text-[11px] text-[#17191C] dark:text-[#F4F2EE]"
              >
                <code>{block.code}</code>
              </pre>
            );
          case 'divider':
            return <hr key={key} className="border-[#E8E3DB] dark:border-[#2C3037]" />;
          default:
            return null;
        }
      })}
    </div>
  );
};

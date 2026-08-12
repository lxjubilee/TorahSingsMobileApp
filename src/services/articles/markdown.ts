import type { Block } from '@/content/articles/types';

/**
 * Converts a published article's Markdown into the app's `Block[]` body.
 *
 * The article bodies on the CDN use a deliberately narrow subset of Markdown —
 * YAML frontmatter, `##` sub-headings, `>` scripture blockquotes, `-` bullets,
 * and inline emphasis. That was verified against the published collection, so
 * this parser handles exactly that subset and degrades anything else to a
 * paragraph rather than dropping it.
 *
 * Inline emphasis is flattened to plain text because `Block` bodies are plain
 * strings rendered by <AppText> — keeping the markers would print literal
 * asterisks on screen.
 */

/** Remove the leading `---` YAML frontmatter block, if present. */
export function stripFrontmatter(markdown: string): string {
  const text = markdown.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  if (!text.startsWith('---\n')) return text;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return text; // unterminated — treat the whole file as body
  return text.slice(text.indexOf('\n', end + 1) + 1);
}

/**
 * A standalone image line: `![alt](src)` or `![alt](src "title")`.
 *
 * Bodies reference figures by bare filename (`shalom-…-1.webp`) rather than by
 * path, so the src is resolved against the collection's image directory — see
 * `resolveImageSrc`.
 */
const IMAGE_LINE = /^!\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+"[^"]*")?\s*\)$/;

/**
 * Resolve a body's image reference to a CDN-relative path. A bare filename is
 * assumed to live in the collection's `images/` directory, which is how the
 * published bodies reference their figures.
 */
function resolveImageSrc(src: string, imageBase: string): string {
  if (/^https?:\/\//i.test(src) || src.includes('/')) return src;
  return imageBase ? `${imageBase.replace(/\/+$/, '')}/${src}` : src;
}

/** Flatten inline Markdown (links, emphasis, code) to plain text. */
function inlineText(value: string): string {
  return (
    value
      // Images first — otherwise the link rule would strip the `!` and keep alt text.
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      // Only unwrap `_underscore_` at word boundaries, so snake_case survives.
      .replace(/(^|\s)_([^_]+)_(?=[\s.,;:!?)]|$)/g, '$1$2')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/** Strip the quotation marks a pull-quote is already wrapped in — the reader adds its own. */
const unwrapQuotes = (value: string): string =>
  value
    .replace(/^["“”'']+/, '')
    .replace(/["“”'']+$/, '')
    .trim();

/**
 * Split a blockquote into its text and its citation. Bodies cite scripture as a
 * trailing parenthesical — `… (Mark 14:36).` — which maps onto `Block.quote`'s
 * `cite`. Anything longer than a citation is left as part of the quote.
 */
function splitCitation(value: string): { text: string; cite: string } {
  const match = value.match(/\(([^()]{2,44})\)\s*[.。]?\s*$/);
  if (!match) return { text: unwrapQuotes(value), cite: '' };
  return {
    text: unwrapQuotes(value.slice(0, match.index).trim()),
    cite: match[1].trim(),
  };
}

const isHeading = (line: string) => /^#{1,6}\s+/.test(line);
const isQuote = (line: string) => /^>\s?/.test(line);
const isBullet = (line: string) => /^[-*+]\s+/.test(line);

/**
 * Parse a full Markdown document (frontmatter included) into renderable blocks.
 *
 * `imageBase` is the collection's image directory (e.g.
 * `articles/learn-hebrew/images`), used to resolve figures referenced by bare
 * filename. Omit it for collections that publish no inline figures.
 */
export function markdownToBlocks(markdown: string, imageBase = ''): Block[] {
  const body = stripFrontmatter(markdown);
  const blocks: Block[] = [];

  // Blank lines separate blocks; everything inside one chunk belongs together.
  for (const chunk of body.split(/\n{2,}/)) {
    const lines = chunk.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) continue;

    // A figure on its own line becomes an image block rather than being dropped.
    const image = lines.length === 1 ? lines[0].trim().match(IMAGE_LINE) : null;
    if (image) {
      blocks.push({
        type: 'img',
        src: resolveImageSrc(image[2], imageBase),
        alt: inlineText(image[1]),
      });
      continue;
    }

    if (isHeading(lines[0])) {
      const text = inlineText(lines[0].replace(/^#{1,6}\s+/, ''));
      if (text) blocks.push({ type: 'h', text });
      // A heading chunk may carry trailing prose when the source omits the
      // blank line; keep it rather than dropping it.
      const rest = inlineText(lines.slice(1).join(' '));
      if (rest) blocks.push({ type: 'p', text: rest });
      continue;
    }

    if (lines.every(isQuote)) {
      const joined = inlineText(lines.map((l) => l.replace(/^>\s?/, '')).join(' '));
      const { text, cite } = splitCitation(joined);
      if (text) blocks.push({ type: 'quote', text, cite });
      continue;
    }

    if (lines.every(isBullet)) {
      for (const line of lines) {
        const text = inlineText(line.replace(/^[-*+]\s+/, ''));
        if (text) blocks.push({ type: 'p', text: `•  ${text}` });
      }
      continue;
    }

    const text = inlineText(lines.join(' '));
    if (text) blocks.push({ type: 'p', text });
  }

  return blocks;
}

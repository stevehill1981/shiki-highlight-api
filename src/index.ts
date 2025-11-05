/**
 * shiki-highlight-api
 * High-performance syntax highlighting using CSS Custom Highlight API
 *
 * Reduces DOM nodes by 80-90% compared to traditional span-based highlighting
 * while maintaining identical visual output.
 */

import {
  createHighlighter,
  bundledLanguages,
  type BundledLanguage,
  type Highlighter,
  type LanguageRegistration,
} from 'shiki';
import type { ThemedToken } from 'shiki';

// Singleton highlighter instance
let highlighterInstance: Highlighter | null = null;

/**
 * Get or create the shared highlighter instance
 */
async function getHighlighter(): Promise<Highlighter> {
  if (highlighterInstance) {
    return highlighterInstance;
  }

  // Create highlighter with bundled languages
  highlighterInstance = await createHighlighter({
    themes: ['dark-plus'],
    langs: [],
  });

  // Load common languages by default
  await highlighterInstance.loadLanguage(bundledLanguages.javascript);
  await highlighterInstance.loadLanguage(bundledLanguages.typescript);

  return highlighterInstance;
}

export interface HighlightResult {
  /** Clean HTML structure with one text node per line */
  html: string;
  /** CSS with ::highlight() pseudo-element styles */
  css: string;
  /** Client-side script to register highlights */
  script: string;
  /** Performance statistics */
  stats: {
    /** Total number of tokens */
    tokens: number;
    /** Total number of lines (equals DOM nodes in Highlight API approach) */
    lines: number;
    /** Number of unique colors/styles */
    uniqueStyles: number;
  };
}

export interface HighlightOptions {
  /** Language identifier (e.g., 'javascript', 'python', 'rust') */
  lang: string;
  /** Shiki theme name (default: 'dark-plus') */
  theme?: string;
  /** Optional unique block ID (auto-generated if omitted) */
  blockId?: string;
}

/**
 * Convert code to HTML with CSS Custom Highlight API
 *
 * @example
 * ```typescript
 * const result = await codeToHighlightHtml('const x = 42;', {
 *   lang: 'javascript',
 *   theme: 'dark-plus'
 * });
 *
 * // Use in your HTML
 * document.body.innerHTML = result.html + result.css + result.script;
 * ```
 */
export async function codeToHighlightHtml(
  code: string,
  options: HighlightOptions
): Promise<HighlightResult> {
  const { lang, theme = 'dark-plus', blockId = generateId() } = options;

  // Get highlighter instance
  const highlighter = await getHighlighter();

  // Tokenize code using Shiki
  const tokens = highlighter.codeToTokens(code, {
    lang: lang as BundledLanguage,
    theme,
  });

  // Generate HTML (single text node per line)
  const html = generateHtml(code, blockId);

  // Generate CSS (::highlight() styles)
  const css = generateCss(tokens.tokens, theme, blockId);

  // Generate client-side script to register highlights
  const script = generateScript(tokens.tokens, blockId);

  // Stats
  const stats = {
    tokens: tokens.tokens.flat().length,
    lines: tokens.tokens.length,
    uniqueStyles: new Set(tokens.tokens.flat().map((t) => t.color)).size,
  };

  return { html, css, script, stats };
}

/**
 * Load a custom language grammar
 *
 * @example
 * ```typescript
 * import customGrammar from './my-language.tmLanguage.json';
 *
 * await loadCustomLanguage({
 *   ...customGrammar,
 *   name: 'my-lang',
 * });
 * ```
 */
export async function loadCustomLanguage(grammar: LanguageRegistration): Promise<void> {
  const highlighter = await getHighlighter();
  await highlighter.loadLanguage(grammar);
}

/**
 * Generate clean HTML with single text node per line
 */
function generateHtml(code: string, blockId: string): string {
  const lines = code.split('\n');

  const linesHtml = lines
    .map((line, i) => {
      const lineId = `${blockId}-L${i}`;
      // Escape HTML entities
      const escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      return `<span id="${lineId}" class="line">${escaped}</span>`;
    })
    .join('\n');

  return `<pre class="shiki" data-highlight-block="${blockId}"><code>${linesHtml}</code></pre>`;
}

/**
 * Generate CSS with ::highlight() pseudo-elements
 */
function generateCss(tokens: ThemedToken[][], theme: string, blockId: string): string {
  // Collect unique colors
  const colorMap = new Map<string, string>();
  let colorIndex = 0;

  tokens.flat().forEach((token) => {
    if (token.color && !colorMap.has(token.color)) {
      const highlightName = `hl-${blockId}-${colorIndex++}`;
      colorMap.set(token.color, highlightName);
    }
  });

  // Generate ::highlight() rules
  const rules = Array.from(colorMap.entries())
    .map(([color, name]) => {
      return `::highlight(${name}) { color: ${color}; }`;
    })
    .join('\n');

  return `<style data-highlight-styles="${blockId}">\n${rules}\n</style>`;
}

/**
 * Generate script to register CSS highlights on client
 */
function generateScript(tokens: ThemedToken[][], blockId: string): string {
  // Build highlight data structure
  interface HighlightRange {
    line: number;
    start: number;
    end: number;
    color: string;
  }

  const ranges: HighlightRange[] = [];

  tokens.forEach((line, lineIndex) => {
    let offset = 0;
    line.forEach((token) => {
      if (token.color) {
        ranges.push({
          line: lineIndex,
          start: offset,
          end: offset + token.content.length,
          color: token.color,
        });
      }
      offset += token.content.length;
    });
  });

  // Generate color to highlight name mapping
  const colorMap = new Map<string, string>();
  let colorIndex = 0;
  tokens.flat().forEach((token) => {
    if (token.color && !colorMap.has(token.color)) {
      colorMap.set(token.color, `hl-${blockId}-${colorIndex++}`);
    }
  });

  const colorMapJson = JSON.stringify(Object.fromEntries(colorMap));
  const rangesJson = JSON.stringify(ranges);

  return `
<script type="module">
(function() {
  // Check for CSS Custom Highlight API support
  if (!CSS.highlights) {
    console.warn('CSS Custom Highlight API not supported');
    return;
  }

  const blockId = '${blockId}';
  const colorMap = ${colorMapJson};
  const ranges = ${rangesJson};

  // Group ranges by color
  const rangesByColor = new Map();
  ranges.forEach(r => {
    if (!rangesByColor.has(r.color)) {
      rangesByColor.set(r.color, []);
    }
    rangesByColor.get(r.color).push(r);
  });

  // Create Range objects and register highlights
  rangesByColor.forEach((rangeList, color) => {
    const domRanges = rangeList.map(r => {
      const lineElement = document.getElementById(\`\${blockId}-L\${r.line}\`);
      if (!lineElement || !lineElement.firstChild) return null;

      const range = new Range();
      try {
        const textNode = lineElement.firstChild;
        range.setStart(textNode, r.start);
        range.setEnd(textNode, r.end);
        return range;
      } catch (e) {
        console.error('Range creation failed:', e);
        return null;
      }
    }).filter(r => r !== null);

    const highlightName = colorMap[color];
    if (highlightName && domRanges.length > 0) {
      const highlight = new Highlight(...domRanges);
      CSS.highlights.set(highlightName, highlight);
    }
  });
})();
</script>
  `.trim();
}

/**
 * Generate unique ID for code block
 */
function generateId(): string {
  return `hl-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Fallback: generate traditional span-based HTML for unsupported browsers
 *
 * @example
 * ```typescript
 * const html = await codeToHtmlFallback('const x = 42;', {
 *   lang: 'javascript',
 *   theme: 'dark-plus'
 * });
 * ```
 */
export async function codeToHtmlFallback(code: string, options: HighlightOptions): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, {
    lang: options.lang as BundledLanguage,
    theme: options.theme || 'dark-plus',
  });
}

/**
 * Advanced: Create a persistent highlighter with custom configuration
 *
 * @example
 * ```typescript
 * const highlighter = await createCustomHighlighter({
 *   themes: ['github-dark', 'github-light'],
 *   langs: ['javascript', 'python', 'rust']
 * });
 * ```
 */
export async function createCustomHighlighter(options: {
  themes?: string[];
  langs?: string[];
}): Promise<Highlighter> {
  return createHighlighter({
    themes: options.themes || ['dark-plus'],
    langs: options.langs || [],
  });
}

// Re-export types from Shiki for convenience
export type { Highlighter, BundledLanguage, ThemedToken };

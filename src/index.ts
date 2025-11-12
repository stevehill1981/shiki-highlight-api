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
  type ShikiTransformer,
} from 'shiki';
import type { ThemedToken } from 'shiki';
import { buildTransformers } from './transformer-builder';
import { extractMetadata } from './metadata-extraction';
import type { Metadata } from './metadata';

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

  // Transformer support
  /** Shiki transformers for custom code processing */
  transformers?: ShikiTransformer[];

  // Convenience options (converted to transformers internally)
  /** Enable line numbers. Pass true for default (starting at 1), or { start: number } to customize */
  lineNumbers?: boolean | { start?: number };
  /** Lines to highlight. Can be array [1,3,5] or string "1,3,5-7" */
  highlightLines?: number[] | string;
  /** Lines showing diff additions/removals */
  diffLines?: { added?: number[]; removed?: number[] };
  /** Lines to focus (blurs other lines) */
  focusLines?: number[];
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

  // Build transformers from options
  const transformers = buildTransformers(options);

  // Extract metadata if transformers are present
  let metadata: Metadata | undefined;
  if (transformers.length > 0) {
    try {
      const hast = highlighter.codeToHast(code, {
        lang: lang as BundledLanguage,
        theme,
        transformers,
      });
      metadata = extractMetadata(hast);
    } catch (error) {
      console.warn('Transformer processing failed, falling back to basic highlighting:', error);
      // Fall through to fast path
    }
  }

  // Tokenize code using Shiki (always needed for syntax colors)
  const tokens = highlighter.codeToTokens(code, {
    lang: lang as BundledLanguage,
    theme,
  });

  // Generate HTML with optional metadata
  const html = generateHtml(code, blockId, metadata);

  // Generate CSS with optional metadata
  const css = generateCss(tokens.tokens, theme, blockId, metadata);

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
function generateHtml(code: string, blockId: string, metadata?: Metadata): string {
  const lines = code.split('\n');

  const linesHtml = lines
    .map((line, i) => {
      const lineNum = i + 1;
      const lineId = `${blockId}-L${i}`;

      // Build classes - use metadata.lineClasses if available (includes custom transformer classes)
      const classes: string[] = [];

      if (metadata && metadata.lineClasses.has(lineNum)) {
        // Use all classes from metadata (includes custom transformer classes)
        classes.push(...metadata.lineClasses.get(lineNum)!);
      } else {
        // Fallback to basic 'line' class
        classes.push('line');
      }

      // Ensure 'line' class is always present
      if (!classes.includes('line')) {
        classes.unshift('line');
      }

      // Add blur effect for non-focused lines (not captured in HAST)
      if (metadata && metadata.focusLines.size > 0 && !metadata.focusLines.has(lineNum)) {
        if (!classes.includes('blurred')) {
          classes.push('blurred');
        }
      }

      // Escape HTML entities
      const escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

      let lineContent = '';

      // Add diff marker
      if (metadata) {
        if (metadata.diffLines.added.has(lineNum)) {
          lineContent += '<span class="diff-marker">+</span>';
        } else if (metadata.diffLines.removed.has(lineNum)) {
          lineContent += '<span class="diff-marker">-</span>';
        }
      }

      // Add line number
      if (metadata && metadata.lineNumbers) {
        const start =
          typeof metadata.lineNumbers === 'object' ? metadata.lineNumbers.start || 1 : 1;
        lineContent += `<span class="line-number">${start + i}</span>`;
      }

      // Add code
      lineContent += `<span class="line-content">${escaped}</span>`;

      return `<span id="${lineId}" class="${classes.join(' ')}">${lineContent}</span>`;
    })
    .join('\n');

  return `<pre class="shiki" data-highlight-block="${blockId}"><code>${linesHtml}</code></pre>`;
}

/**
 * Generate CSS with ::highlight() pseudo-elements
 */
function generateCss(
  tokens: ThemedToken[][],
  theme: string,
  blockId: string,
  metadata?: Metadata
): string {
  // Collect unique colors
  const colorMap = new Map<string, string>();
  let colorIndex = 0;

  tokens.flat().forEach((token) => {
    if (token.color && !colorMap.has(token.color)) {
      const highlightName = `hl-${blockId}-${colorIndex++}`;
      colorMap.set(token.color, highlightName);
    }
  });

  // Generate ::highlight() rules for token colors
  const tokenRules = Array.from(colorMap.entries())
    .map(([color, name]) => {
      return `::highlight(${name}) { color: ${color}; }`;
    })
    .join('\n');

  // Generate line-level styles if metadata present
  const lineStyles: string[] = [];

  if (metadata) {
    if (metadata.highlightedLines.size > 0) {
      lineStyles.push(
        `
[data-highlight-block="${blockId}"] .line.highlighted {
  background-color: rgba(255, 255, 0, 0.1);
  border-left: 3px solid rgba(255, 255, 0, 0.5);
  padding-left: 0.5em;
}
      `.trim()
      );
    }

    if (metadata.diffLines.added.size > 0 || metadata.diffLines.removed.size > 0) {
      lineStyles.push(
        `
[data-highlight-block="${blockId}"] .line.diff.add {
  background-color: rgba(0, 255, 0, 0.1);
}
[data-highlight-block="${blockId}"] .line.diff.remove {
  background-color: rgba(255, 0, 0, 0.1);
  text-decoration: line-through;
}
[data-highlight-block="${blockId}"] .diff-marker {
  display: inline-block;
  width: 1ch;
  user-select: none;
}
      `.trim()
      );
    }

    if (metadata.focusLines.size > 0) {
      lineStyles.push(
        `
[data-highlight-block="${blockId}"] .line.blurred {
  opacity: 0.3;
  filter: blur(0.5px);
}
      `.trim()
      );
    }

    if (metadata.lineNumbers) {
      lineStyles.push(
        `
[data-highlight-block="${blockId}"] .line-number {
  display: inline-block;
  width: 3ch;
  text-align: right;
  margin-right: 1em;
  color: #6e7681;
  user-select: none;
}
      `.trim()
      );
    }
  }

  const allRules = [tokenRules, ...lineStyles].filter(Boolean).join('\n\n');

  return `<style data-highlight-styles="${blockId}">\n${allRules}\n</style>`;
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
      if (!lineElement) return null;

      // Find the .line-content element which contains the actual code text
      const lineContentElement = lineElement.querySelector('.line-content');
      if (!lineContentElement || !lineContentElement.firstChild) return null;

      const range = new Range();
      try {
        const textNode = lineContentElement.firstChild;

        // Additional safety check
        if (!textNode || textNode.nodeType !== 3) {
          console.warn(\`Line \${r.line}: No text node found\`);
          return null;
        }

        const textLength = textNode.nodeValue ? textNode.nodeValue.length : 0;
        if (r.start > textLength || r.end > textLength) {
          console.error(\`Line \${r.line}: Range overflow - text length: \${textLength}, range: \${r.start}-\${r.end}\`);
          return null;
        }

        range.setStart(textNode, r.start);
        range.setEnd(textNode, r.end);
        return range;
      } catch (e) {
        console.error(\`Range creation failed for line \${r.line}, range \${r.start}-\${r.end}:\`, e);
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
export type { Highlighter, BundledLanguage, ThemedToken, ShikiTransformer };

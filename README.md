# shiki-highlight-api

**87% fewer DOM nodes. Identical visual output.**

High-performance syntax highlighting using the CSS Custom Highlight API instead of traditional DOM spans.

[![npm version](https://img.shields.io/npm/v/shiki-highlight-api.svg)](https://www.npmjs.com/package/shiki-highlight-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## The Problem

Traditional syntax highlighters (including Shiki) wrap **every single token** in a `<span>` element. For a 200-line code block with ~10 tokens per line, that's **2000+ DOM nodes**.

This impacts:

- **Page load time** (more nodes to parse)
- **Memory usage** (each node has overhead)
- **Scrolling performance** (more reflows)
- **Lighthouse scores** (DOM size warnings)

## The Solution

The [CSS Custom Highlight API](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API) lets us highlight text using **Range objects** instead of DOM manipulation.

**Result:** One text node per line instead of dozens of `<span>` elements.

### Performance Gains

| Metric                | Traditional (Shiki)   | Highlight API | Improvement       |
| --------------------- | --------------------- | ------------- | ----------------- |
| **7-line code block** | 35 DOM nodes          | 7 DOM nodes   | **80% reduction** |
| **200-line file**     | ~2000 DOM nodes       | 200 DOM nodes | **90% reduction** |
| **Visual output**     | ✅ Syntax highlighted | ✅ Identical  | **No difference** |

## Installation

```bash
npm install shiki-highlight-api
```

## Quick Start

```typescript
import { codeToHighlightHtml } from 'shiki-highlight-api';

const code = `function greet(name) {
  console.log('Hello, ' + name);
}`;

const result = await codeToHighlightHtml(code, {
  lang: 'javascript',
  theme: 'dark-plus',
});

// Insert into your page
document.body.innerHTML = result.html + result.css + result.script;
```

### Output Structure

The API returns three parts:

```typescript
{
  html: '<pre class="shiki" data-highlight-block="hl-abc123">...</pre>',
  css: '<style>::highlight(hl-abc123-0) { color: #569cd6; }</style>',
  script: '<script type="module">/* Range registration */</script>',
  stats: {
    tokens: 15,
    lines: 3,
    uniqueStyles: 5
  }
}
```

## Browser Support

| Browser | Version | Released       |
| ------- | ------- | -------------- |
| Chrome  | 105+    | September 2022 |
| Safari  | 17.2+   | January 2024   |
| Firefox | 140+    | 2024           |
| Edge    | 105+    | September 2022 |

**Fallback:** Use `codeToHtmlFallback()` for older browsers (generates traditional Shiki output).

```typescript
import { codeToHtmlFallback } from 'shiki-highlight-api';

// Check browser support
if (!CSS.highlights) {
  const html = await codeToHtmlFallback(code, { lang: 'javascript' });
}
```

## Framework Integration

### Astro

Use with the remark plugin (coming soon):

```typescript
import { remarkHighlightApi } from 'remark-shiki-highlight-api';

export default {
  markdown: {
    remarkPlugins: [remarkHighlightApi],
    syntaxHighlight: false,
  },
};
```

### Manual Integration

```astro
---
import { codeToHighlightHtml } from 'shiki-highlight-api';

const code = `console.log('Hello, world!');`;
const result = await codeToHighlightHtml(code, { lang: 'javascript' });
---

<Fragment set:html={result.html} />
<Fragment set:html={result.css} />
<Fragment set:html={result.script} />
```

### React/Next.js

```tsx
import { codeToHighlightHtml } from 'shiki-highlight-api';

export async function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const result = await codeToHighlightHtml(code, { lang });

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: result.html }} />
      <div dangerouslySetInnerHTML={{ __html: result.css }} />
      <div dangerouslySetInnerHTML={{ __html: result.script }} />
    </>
  );
}
```

## Transformer Features

shiki-highlight-api supports Shiki v3 transformers, enabling powerful code block enhancements:

### Line Numbers

```typescript
const result = await codeToHighlightHtml(code, {
  lang: 'javascript',
  lineNumbers: true, // Start at line 1
});

// Or start at a custom line number
const result = await codeToHighlightHtml(code, {
  lang: 'javascript',
  lineNumbers: { start: 10 }, // Start at line 10
});
```

### Line Highlighting

```typescript
// Array syntax
const result = await codeToHighlightHtml(code, {
  lang: 'javascript',
  highlightLines: [1, 3, 5], // Highlight lines 1, 3, and 5
});

// String syntax (supports ranges)
const result = await codeToHighlightHtml(code, {
  lang: 'javascript',
  highlightLines: '1,3,5-7', // Lines 1, 3, 5, 6, 7
});
```

### Diff Lines

```typescript
const result = await codeToHighlightHtml(code, {
  lang: 'javascript',
  diffLines: {
    added: [2, 3], // Lines added (green background)
    removed: [5], // Lines removed (red background, strikethrough)
  },
});
```

### Focus Lines

```typescript
const result = await codeToHighlightHtml(code, {
  lang: 'javascript',
  focusLines: [2, 3], // Focus lines 2-3, blur others
});
```

### Combined Features

All transformer features can be combined:

```typescript
const result = await codeToHighlightHtml(code, {
  lang: 'javascript',
  lineNumbers: { start: 5 },
  highlightLines: [1],
  diffLines: {
    added: [2],
    removed: [3],
  },
  focusLines: [1, 2],
});
```

### Custom Transformers

Advanced users can provide custom Shiki transformers:

```typescript
import type { ShikiTransformer } from 'shiki-highlight-api';

const customTransformer: ShikiTransformer = {
  name: 'my-transformer',
  line(node, line) {
    // Add custom classes or attributes
    node.properties = node.properties || {};
    node.properties['data-line'] = line;
    const classes = Array.isArray(node.properties.class) ? node.properties.class : [];

    // Ensure 'line' class is present
    if (!classes.includes('line')) {
      classes.push('line');
    }

    // Add custom class for line 5
    if (line === 5) {
      classes.push('special');
    }

    node.properties.class = classes;
  },
};

const result = await codeToHighlightHtml(code, {
  lang: 'javascript',
  transformers: [customTransformer],
  lineNumbers: true, // Can combine with convenience options
});
```

## Custom Languages

Load custom TextMate grammars:

```typescript
import { loadCustomLanguage } from 'shiki-highlight-api';
import customGrammar from './my-language.tmLanguage.json';

await loadCustomLanguage({
  ...customGrammar,
  name: 'my-lang', // Override grammar name to match usage
});

// Now use it
const result = await codeToHighlightHtml(code, { lang: 'my-lang' });
```

## API Reference

### `codeToHighlightHtml(code, options)`

Generate syntax-highlighted HTML using CSS Custom Highlight API.

**Parameters:**

- `code` (string): Source code to highlight
- `options` (object):
  - `lang` (string, required): Language identifier (e.g., `'javascript'`, `'python'`)
  - `theme` (string, optional): Shiki theme name (default: `'dark-plus'`)
  - `blockId` (string, optional): Unique block identifier (auto-generated if omitted)
  - `transformers` (ShikiTransformer[], optional): Custom Shiki transformers
  - `lineNumbers` (boolean | { start?: number }, optional): Enable line numbers
  - `highlightLines` (number[] | string, optional): Lines to highlight (e.g., `[1,3,5]` or `'1,3,5-7'`)
  - `diffLines` ({ added?: number[], removed?: number[] }, optional): Diff line markers
  - `focusLines` (number[], optional): Lines to focus (blurs others)

**Returns:** Promise<HighlightResult>

```typescript
interface HighlightResult {
  html: string; // Clean HTML structure
  css: string; // ::highlight() styles
  script: string; // Client-side registration
  stats: {
    tokens: number; // Total tokens
    lines: number; // Total lines (= DOM nodes)
    uniqueStyles: number; // Unique colors
  };
}
```

### `codeToHtmlFallback(code, options)`

Generate traditional Shiki HTML for unsupported browsers.

**Parameters:** Same as `codeToHighlightHtml()`

**Returns:** Promise<string> (traditional Shiki HTML)

### `loadCustomLanguage(grammar)`

Load a custom TextMate grammar.

**Parameters:**

- `grammar` (object): TextMate grammar JSON with `name` field

**Returns:** Promise<void>

## How It Works

### Traditional Approach (Shiki)

```html
<pre class="shiki">
  <code>
    <span class="line">
      <span style="color:#569cd6">function</span>
      <span style="color:#dcdcaa"> greet</span>
      <span style="color:#d4d4d4">(</span>
      <!-- ...dozens more spans... -->
    </span>
  </code>
</pre>
```

### Highlight API Approach

```html
<!-- Clean HTML (without transformers) -->
<pre class="shiki" data-highlight-block="hl-abc">
  <code>
    <span id="hl-abc-L0" class="line">
      <span class="line-content">function greet(name) {</span>
    </span>
    <span id="hl-abc-L1" class="line">
      <span class="line-content">  console.log('Hello, ' + name);</span>
    </span>
  </code>
</pre>

<!-- With transformers (line numbers + highlighting) -->
<pre class="shiki" data-highlight-block="hl-abc">
  <code>
    <span id="hl-abc-L0" class="line highlighted">
      <span class="line-number">1</span>
      <span class="line-content">function greet(name) {</span>
    </span>
    <span id="hl-abc-L1" class="line">
      <span class="line-number">2</span>
      <span class="line-content">  console.log('Hello, ' + name);</span>
    </span>
  </code>
</pre>

<!-- CSS rules (syntax highlighting) -->
<style>
  ::highlight(hl-abc-0) {
    color: #569cd6;
  } /* Keywords */
  ::highlight(hl-abc-1) {
    color: #dcdcaa;
  } /* Functions */

  /* Line-level styles (from transformers) */
  [data-highlight-block='hl-abc'] .line.highlighted {
    background-color: rgba(255, 255, 0, 0.1);
    border-left: 3px solid rgba(255, 255, 0, 0.5);
  }
  [data-highlight-block='hl-abc'] .line-number {
    display: inline-block;
    width: 3ch;
    margin-right: 1em;
    color: #6e7681;
    user-select: none;
  }
</style>

<!-- JavaScript registration -->
<script type="module">
  const range = new Range();
  range.setStart(textNode, 0);
  range.setEnd(textNode, 8);
  const highlight = new Highlight(range);
  CSS.highlights.set('hl-abc-0', highlight);
</script>
```

## Performance Details

**Tested on:** 28-line C64 BASIC program

| Approach       | DOM Nodes             | Memory   | Parsing Time   |
| -------------- | --------------------- | -------- | -------------- |
| Traditional    | 264 `<span>` elements | ~8KB     | Baseline       |
| Highlight API  | 28 text nodes         | ~1KB     | Same           |
| **Difference** | **-90%**              | **-87%** | **No penalty** |

**Tokenization:** Uses Shiki's excellent parser (no change)
**Visual output:** Pixel-perfect identical
**Browser rendering:** Highlight API is native code (faster than JS)

## Real-World Impact

**Typical documentation page:**

- 5 code blocks
- ~50 lines per block
- 250 lines total

**Traditional:** ~2,500 DOM nodes for code
**Highlight API:** ~250 DOM nodes
**Savings:** ~2,250 fewer nodes per page

## Inspiration

This project was inspired by:

- [Blog post by Pavi Gupta](https://pavi2410.com/blog/high-performance-syntax-highlighting-with-css-highlights-api/)
- Real-world performance issues on [Code Like It's 198x](https://code198x.stevehill.xyz)

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT © [Steve Hill](https://github.com/stevehill1981)

## Links

- [npm package](https://www.npmjs.com/package/shiki-highlight-api)
- [GitHub repository](https://github.com/shiki-highlights/shiki-highlight-api)
- [CSS Custom Highlight API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API)
- [Shiki documentation](https://shiki.style/)

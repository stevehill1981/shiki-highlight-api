# Transformer Support Design - v1.0.0

**Date:** January 12, 2025
**Version:** 1.0.0 (stable release)
**Status:** Design approved

## Goal

Add full Shiki transformer support to shiki-highlight-api while maintaining the 80-90% DOM node reduction that makes the Highlight API approach valuable.

## Motivation

The current implementation uses only `codeToTokens()` for syntax highlighting, which provides excellent performance but lacks common features users expect: line numbers, diff highlighting, focus/blur regions, and custom decorations. Shiki's transformer ecosystem provides these features, but `codeToHtml()` generates span-heavy HTML that defeats our performance goal.

This design bridges the gap: extract metadata from Shiki transformers, then apply it in a Highlight-API-compatible way.

## Architecture

### Three-Stage Process

**Stage 1: Enhanced Tokenization**

When transformers are present, generate HAST:

```typescript
const hast = highlighter.codeToHast(code, {
  lang,
  theme,
  transformers: [...]
});
```

Also get clean tokens for highlighting:

```typescript
const tokens = highlighter.codeToTokens(code, { lang, theme });
```

**Stage 2: Metadata Extraction**

Parse the HAST tree to extract semantic information:

```typescript
function extractMetadata(hast: HastRoot): Metadata {
  const metadata = {
    lineNumbers: false,
    highlightedLines: new Set<number>(),
    diffLines: { added: new Set<number>(), removed: new Set<number>() },
    focusLines: new Set<number>(),
    lineClasses: new Map<number, string[]>(),
    lineStyles: new Map<number, Record<string, string>>()
  };

  visit(hast, 'element', (node) => {
    if (node.tagName === 'span' && node.properties.class?.includes('line')) {
      const lineNum = parseInt(node.properties['data-line']);
      const classes = node.properties.class || [];

      if (classes.includes('highlighted')) {
        metadata.highlightedLines.add(lineNum);
      }
      if (classes.includes('diff')) {
        if (classes.includes('add')) metadata.diffLines.added.add(lineNum);
        if (classes.includes('remove')) metadata.diffLines.removed.add(lineNum);
      }
      if (classes.includes('focused') || classes.includes('has-focus')) {
        metadata.focusLines.add(lineNum);
      }

      metadata.lineClasses.set(lineNum, classes);
      if (node.properties.style) {
        metadata.lineStyles.set(lineNum, parseInlineStyles(node.properties.style));
      }
    }
  });

  return metadata;
}
```

**Stage 3: Generate Output**

Apply metadata to Highlight API HTML, CSS, and script:

- **HTML**: Add line numbers, diff markers, and CSS classes to line spans
- **CSS**: Generate token colors via `::highlight()` plus line backgrounds and borders
- **Script**: Register token highlights (unchanged from current implementation)

### Fast Path Preservation

Code without transformers takes the fast path:

```typescript
function codeToHighlightHtml(code: string, options: HighlightOptions) {
  const transformers = buildTransformers(options);

  if (transformers.length === 0) {
    return generateFastPath(code, options);  // Current implementation
  }

  return generateWithMetadata(code, options, transformers);
}
```

## API Design

### Core Package (shiki-highlight-api)

```typescript
export interface HighlightOptions {
  lang: string;
  theme?: string;
  blockId?: string;

  // Transformer support
  transformers?: ShikiTransformer[];

  // Convenience options (converted to transformers internally)
  lineNumbers?: boolean | { start?: number };
  highlightLines?: number[] | string;  // [1,3,5] or "1,3,5-7"
  diffLines?: { added?: number[], removed?: number[] };
  focusLines?: number[];
}
```

Example usage:

```typescript
// Simple
const result = await codeToHighlightHtml(code, {
  lang: 'javascript',
  lineNumbers: true,
  highlightLines: [1, 3, 5]
});

// Advanced
const result = await codeToHighlightHtml(code, {
  lang: 'javascript',
  transformers: [myCustomTransformer()]
});
```

### Remark Plugin (remark-shiki-highlight-api)

```typescript
export interface RemarkHighlightApiOptions {
  theme?: string;
  loadLanguages?: () => Promise<void>;
  parseMetaString?: boolean;  // default: true
  transformers?: ShikiTransformer[];
}
```

Meta strings work automatically:

````markdown
```javascript {1-3,5} showLineNumbers
function hello() {    // highlighted
  console.log('hi');  // highlighted
}                     // highlighted
                      // not highlighted
console.log('done');  // highlighted (line 5)
```
````

The plugin parses meta strings and converts them to the appropriate options.

### Default Behavior

- **Core package**: No transformers by default (fast path)
- **Remark plugin**: Meta string parsing enabled by default (`parseMetaString: true`)
- Empty meta string = fast path automatically

## HTML Generation

Enhanced structure with metadata applied:

```typescript
function generateHtml(code: string, blockId: string, metadata?: Metadata): string {
  const lines = code.split('\n');

  const linesHtml = lines.map((line, i) => {
    const lineNum = i + 1;
    const lineId = `${blockId}-L${i}`;

    // Build classes
    const classes = ['line'];
    if (metadata?.highlightedLines.has(lineNum)) classes.push('highlighted');
    if (metadata?.diffLines.added.has(lineNum)) classes.push('diff', 'add');
    if (metadata?.diffLines.removed.has(lineNum)) classes.push('diff', 'remove');
    if (metadata?.focusLines.size > 0 && !metadata.focusLines.has(lineNum)) {
      classes.push('blurred');
    }

    const escaped = escapeHtml(line);
    let lineContent = '';

    // Add diff marker
    if (metadata?.diffLines.added.has(lineNum)) {
      lineContent += '<span class="diff-marker">+</span>';
    } else if (metadata?.diffLines.removed.has(lineNum)) {
      lineContent += '<span class="diff-marker">-</span>';
    }

    // Add line number
    if (metadata?.lineNumbers) {
      const start = metadata.lineNumbers.start || 1;
      lineContent += `<span class="line-number">${start + i}</span>`;
    }

    // Add code
    lineContent += `<span class="line-content">${escaped}</span>`;

    return `<span id="${lineId}" class="${classes.join(' ')}">${lineContent}</span>`;
  }).join('\n');

  return `<pre class="shiki" data-highlight-block="${blockId}"><code>${linesHtml}</code></pre>`;
}
```

**DOM Node Count (200 lines with all features):**
- Base: 200 line spans
- Line numbers: +200 = 400 total
- Diff markers on 10 lines: +10 = 410 total
- **Still 80% reduction vs. Shiki's ~2000 token spans**

## CSS Generation

```typescript
function generateCss(
  tokens: ThemedToken[][],
  theme: string,
  blockId: string,
  metadata?: Metadata
): string {
  // Token colors via ::highlight() (existing)
  const colorMap = new Map<string, string>();
  let colorIndex = 0;
  tokens.flat().forEach((token) => {
    if (token.color && !colorMap.has(token.color)) {
      colorMap.set(token.color, `hl-${blockId}-${colorIndex++}`);
    }
  });

  const tokenRules = Array.from(colorMap.entries())
    .map(([color, name]) => `::highlight(${name}) { color: ${color}; }`)
    .join('\n');

  // Line styles (new)
  const lineStyles = [];

  if (metadata?.highlightedLines.size > 0) {
    lineStyles.push(`
      [data-highlight-block="${blockId}"] .line.highlighted {
        background-color: rgba(255, 255, 0, 0.1);
        border-left: 3px solid rgba(255, 255, 0, 0.5);
        padding-left: 0.5em;
      }
    `);
  }

  if (metadata?.diffLines.added.size > 0 || metadata?.diffLines.removed.size > 0) {
    lineStyles.push(`
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
    `);
  }

  if (metadata?.focusLines.size > 0) {
    lineStyles.push(`
      [data-highlight-block="${blockId}"] .line.blurred {
        opacity: 0.3;
        filter: blur(0.5px);
      }
    `);
  }

  if (metadata?.lineNumbers) {
    lineStyles.push(`
      [data-highlight-block="${blockId}"] .line-number {
        display: inline-block;
        width: 3ch;
        text-align: right;
        margin-right: 1em;
        color: #6e7681;
        user-select: none;
      }
    `);
  }

  return `<style data-highlight-styles="${blockId}">\n${tokenRules}\n${lineStyles.join('\n')}\n</style>`;
}
```

## Error Handling

**Transformer Failures:**

```typescript
try {
  const hast = highlighter.codeToHast(code, { lang, theme, transformers });
  const metadata = extractMetadata(hast);
  return generateWithMetadataApplied(code, tokens, metadata, options);
} catch (error) {
  console.warn('Transformer processing failed, falling back to basic highlighting:', error);
  return generateFastPath(code, options);
}
```

**Edge Cases:**

- **Invalid line numbers**: Filter silently (only apply to valid lines)
- **Conflicting metadata**: Use CSS cascade (diff.add > diff.remove, focused > blurred)
- **Missing language**: Same as current behavior (fallback to 'text')
- **Empty code**: Line numbers still render (showing empty file with numbering)
- **Browser compatibility**: `codeToHtmlFallback()` already handles unsupported browsers

## Testing Strategy

**Coverage Target:** Maintain 100% coverage across all metrics.

**Test Areas:**

1. **Core functionality**: Fast path, line numbers, highlights, diffs, focus, combined features
2. **Meta string parsing**: Line syntax, combined meta, full markdown pipeline
3. **Edge cases**: Invalid line numbers, transformer errors, empty code
4. **Performance**: Fast path has no overhead, hybrid path remains significantly faster than traditional Shiki

## Migration Strategy

**Version:** 0.1.x → 1.0.0

**Why v1.0.0:**
- Graduation from beta (0.x) to stable
- Feature-complete with transformer support
- Production-ready with 100% test coverage
- Signals: "This is the official stable release"

**Breaking Changes:**
- API remains backward compatible
- Fast path unchanged (no transformers = existing behavior)
- Package exports may be cleaned up (remove internal functions)

**Migration Guide:**
Most code works unchanged. New features available but optional.

## Implementation Order

1. **Core metadata extraction** (shiki-highlight-api)
   - HAST visitor
   - Metadata types
   - Extraction logic

2. **HTML generation with metadata** (shiki-highlight-api)
   - Enhanced generateHtml()
   - Line number rendering
   - Diff marker rendering

3. **CSS generation with metadata** (shiki-highlight-api)
   - Line backgrounds
   - Diff styles
   - Focus/blur styles

4. **Convenience options** (shiki-highlight-api)
   - buildTransformers() helper
   - Convert lineNumbers, highlightLines, etc. to transformers

5. **Meta string parsing** (remark-shiki-highlight-api)
   - Parse {1-3,5} syntax
   - Parse showLineNumbers
   - Pass to codeToHighlightHtml()

6. **Tests** (both packages)
   - Core functionality tests
   - Meta parsing tests
   - Edge case tests
   - Performance tests

7. **Documentation** (both packages)
   - Update READMEs
   - Add examples
   - Migration guide

## Success Criteria

- ✅ Full Shiki transformer support
- ✅ 80-90% DOM node reduction maintained
- ✅ 100% test coverage
- ✅ Backward compatible (fast path unchanged)
- ✅ Meta strings work automatically in markdown
- ✅ Clear migration path to v1.0.0

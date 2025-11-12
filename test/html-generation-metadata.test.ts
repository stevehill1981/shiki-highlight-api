import { describe, it, expect } from 'vitest';
import { codeToHighlightHtml } from '../src/index';
import type { Element } from 'hast';

describe('HTML Generation with Metadata', () => {
  it('generates basic HTML without metadata (fast path)', async () => {
    const code = 'const x = 1;';
    const result = await codeToHighlightHtml(code, {
      lang: 'javascript',
      blockId: 'test-basic',
    });

    expect(result.html).toContain('<pre class="shiki"');
    expect(result.html).toContain('const x = 1;');
    expect(result.html).not.toContain('line-number');
    expect(result.html).not.toContain('highlighted');
  });

  it('generates HTML with line numbers (boolean)', async () => {
    const code = 'const x = 1;\nconst y = 2;';
    const result = await codeToHighlightHtml(code, {
      lang: 'javascript',
      blockId: 'test-line-nums',
      lineNumbers: true,
    });

    expect(result.html).toContain('line-number');
    expect(result.html).toContain('>1</span>');
    expect(result.html).toContain('>2</span>');
  });

  it('generates HTML with line numbers starting at custom number', async () => {
    const code = 'const x = 1;\nconst y = 2;';
    const result = await codeToHighlightHtml(code, {
      lang: 'javascript',
      blockId: 'test-line-start',
      lineNumbers: { start: 10 },
    });

    expect(result.html).toContain('line-number');
    expect(result.html).toContain('>10</span>');
    expect(result.html).toContain('>11</span>');
  });

  it('generates HTML with highlighted lines (array)', async () => {
    const code = 'line 1\nline 2\nline 3';
    const result = await codeToHighlightHtml(code, {
      lang: 'text',
      blockId: 'test-highlight-array',
      highlightLines: [1, 3],
    });

    const lines = result.html.split('\n');
    const line1 = lines.find((l) => l.includes('test-highlight-array-L0'));
    const line2 = lines.find((l) => l.includes('test-highlight-array-L1'));
    const line3 = lines.find((l) => l.includes('test-highlight-array-L2'));

    expect(line1).toContain('highlighted');
    expect(line2).not.toContain('highlighted');
    expect(line3).toContain('highlighted');
  });

  it('generates HTML with highlighted lines (string)', async () => {
    const code = 'line 1\nline 2\nline 3\nline 4\nline 5';
    const result = await codeToHighlightHtml(code, {
      lang: 'text',
      blockId: 'test-highlight-string',
      highlightLines: '1,3-4',
    });

    expect(result.html).toContain('highlighted');
  });

  it('generates HTML with diff lines', async () => {
    const code = 'line 1\nline 2\nline 3\nline 4';
    const result = await codeToHighlightHtml(code, {
      lang: 'text',
      blockId: 'test-diff',
      diffLines: {
        added: [1, 2],
        removed: [3, 4],
      },
    });

    expect(result.html).toContain('diff');
    expect(result.html).toContain('add');
    expect(result.html).toContain('remove');
    expect(result.html).toContain('diff-marker');
  });

  it('generates HTML with focus lines', async () => {
    const code = 'line 1\nline 2\nline 3';
    const result = await codeToHighlightHtml(code, {
      lang: 'text',
      blockId: 'test-focus',
      focusLines: [2],
    });

    const lines = result.html.split('\n');
    const line1 = lines.find((l) => l.includes('test-focus-L0'));
    const line2 = lines.find((l) => l.includes('test-focus-L1'));
    const line3 = lines.find((l) => l.includes('test-focus-L2'));

    // Line 2 should be focused, others blurred
    expect(line1).toContain('blurred');
    expect(line2).not.toContain('blurred');
    expect(line3).toContain('blurred');
  });

  it('generates HTML with combined features', async () => {
    const code = 'const a = 1;\nconst b = 2;\nconst c = 3;';
    const result = await codeToHighlightHtml(code, {
      lang: 'javascript',
      blockId: 'test-combined',
      lineNumbers: true,
      highlightLines: [1, 3],
      diffLines: {
        added: [1],
      },
    });

    expect(result.html).toContain('line-number');
    expect(result.html).toContain('highlighted');
    expect(result.html).toContain('diff');
    expect(result.html).toContain('add');
  });

  it('generates HTML with custom transformers', async () => {
    const customTransformer = {
      name: 'test-transformer',
      line(node: Element) {
        node.properties = node.properties || {};
        node.properties['data-custom'] = 'test-value';
      },
    };

    const code = 'const x = 1;';
    const result = await codeToHighlightHtml(code, {
      lang: 'javascript',
      blockId: 'test-custom',
      transformers: [customTransformer],
    });

    // Custom transformers should be processed
    expect(result.html).toBeDefined();
  });

  it('generates HTML escaping special characters with metadata', async () => {
    const code = 'const html = "<div>&nbsp;</div>";';
    const result = await codeToHighlightHtml(code, {
      lang: 'javascript',
      blockId: 'test-escape-meta',
      lineNumbers: true,
    });

    expect(result.html).toContain('&lt;div&gt;');
    expect(result.html).toContain('&amp;');
    expect(result.html).toContain('line-number');
  });
});

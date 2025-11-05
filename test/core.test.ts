import { describe, it, expect } from 'vitest';
import { codeToHighlightHtml, codeToHtmlFallback } from '../src/index';

describe('codeToHighlightHtml', () => {
  it('generates HTML, CSS, and script for JavaScript code', async () => {
    const code = 'const x = 42;';
    const result = await codeToHighlightHtml(code, {
      lang: 'javascript',
      theme: 'dark-plus',
      blockId: 'test-1',
    });

    expect(result.html).toContain('<pre');
    expect(result.html).toContain('<code');
    expect(result.html).toContain('const x = 42;');
    expect(result.css).toContain('<style');
    expect(result.css).toContain('::highlight(');
    expect(result.script).toContain('<script');
    expect(result.script).toContain('CSS.highlights.set');
  });

  it('tracks statistics correctly', async () => {
    const code = 'const x = 42;\nconst y = 100;';
    const result = await codeToHighlightHtml(code, {
      lang: 'javascript',
      theme: 'dark-plus',
      blockId: 'test-2',
    });

    expect(result.stats.lines).toBe(2);
    expect(result.stats.tokens).toBeGreaterThan(0);
    expect(result.stats.uniqueStyles).toBeGreaterThan(0);
  });

  it('generates unique block IDs when not provided', async () => {
    const code = 'console.log("test");';
    const result1 = await codeToHighlightHtml(code, {
      lang: 'javascript',
      theme: 'dark-plus',
    });
    const result2 = await codeToHighlightHtml(code, {
      lang: 'javascript',
      theme: 'dark-plus',
    });

    const id1 = result1.html.match(/id="([^"]+)"/)?.[1];
    const id2 = result2.html.match(/id="([^"]+)"/)?.[1];

    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
  });

  it('uses provided block ID', async () => {
    const code = 'const x = 1;';
    const result = await codeToHighlightHtml(code, {
      lang: 'javascript',
      theme: 'dark-plus',
      blockId: 'custom-id',
    });

    expect(result.html).toContain('data-highlight-block="custom-id"');
    expect(result.css).toContain('custom-id');
    expect(result.script).toContain('custom-id');
  });

  it('handles multiple lines correctly', async () => {
    const code = `function hello() {
  console.log('world');
  return true;
}`;
    const result = await codeToHighlightHtml(code, {
      lang: 'javascript',
      theme: 'dark-plus',
      blockId: 'test-3',
    });

    expect(result.stats.lines).toBe(4);
    expect(result.html).toContain('function hello()');
    // HTML encodes quotes as &#39;
    expect(result.html).toContain('console.log(&#39;world&#39;)');
  });

  it('defaults to dark-plus theme', async () => {
    const code = 'const x = 42;';
    const result = await codeToHighlightHtml(code, {
      lang: 'javascript',
      blockId: 'test-4',
    });

    expect(result.css).toContain('::highlight(');
    expect(result.html).toBeDefined();
  });

  it('works with TypeScript', async () => {
    const code = 'const x: number = 42;';
    const result = await codeToHighlightHtml(code, {
      lang: 'typescript',
      theme: 'dark-plus',
      blockId: 'test-5',
    });

    expect(result.html).toContain('const x: number = 42;');
    expect(result.stats.tokens).toBeGreaterThan(0);
  });

  it('handles empty code', async () => {
    const code = '';
    const result = await codeToHighlightHtml(code, {
      lang: 'javascript',
      theme: 'dark-plus',
      blockId: 'test-6',
    });

    expect(result.html).toContain('<code');
    // Empty string still creates one line in Shiki
    expect(result.stats.lines).toBeGreaterThanOrEqual(0);
    expect(result.stats.tokens).toBeGreaterThanOrEqual(0);
  });
});

describe('codeToHtmlFallback', () => {
  it('generates traditional Shiki HTML', async () => {
    const code = 'const x = 42;';
    const html = await codeToHtmlFallback(code, {
      lang: 'javascript',
      theme: 'dark-plus',
    });

    expect(html).toContain('<pre');
    expect(html).toContain('<span');
    expect(html).toContain('const');
    expect(html).toContain('42');
  });

  it('works with JavaScript', async () => {
    const code = 'function test() {}';
    const html = await codeToHtmlFallback(code, {
      lang: 'javascript',
      theme: 'dark-plus',
    });

    expect(html).toContain('function');
    expect(html).toContain('test');
  });
});

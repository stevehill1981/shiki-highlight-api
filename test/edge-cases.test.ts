import { describe, it, expect } from 'vitest';
import {
  codeToHighlightHtml,
  codeToHtmlFallback,
  createCustomHighlighter,
  loadCustomLanguage,
} from '../src/index';

describe('Edge Cases', () => {
  describe('HTML escaping', () => {
    it('escapes ampersands', async () => {
      const code = 'const result = a && b;';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-escape-1',
      });

      expect(result.html).toContain('&amp;&amp;');
      expect(result.html).not.toContain('&&');
    });

    it('escapes less-than and greater-than', async () => {
      const code = 'if (x < 10 && y > 5) {}';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-escape-2',
      });

      expect(result.html).toContain('&lt;');
      expect(result.html).toContain('&gt;');
      expect(result.html).not.toMatch(/<(?!\/?(pre|code|span|style|script))/);
    });

    it('escapes quotes', async () => {
      const code = 'const str = "hello"; const other = \'world\';';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-escape-3',
      });

      expect(result.html).toContain('&quot;');
      expect(result.html).toContain('&#39;');
    });

    it('handles all special characters together', async () => {
      const code = 'const html = "<div>&copy; 2024</div>";';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-escape-4',
      });

      expect(result.html).toContain('&lt;div&gt;&amp;copy;');
      expect(result.html).toContain('&quot;');
    });
  });

  describe('Empty and whitespace content', () => {
    it('handles code with trailing newline', async () => {
      const code = 'const x = 1;\n';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-newline-1',
      });

      expect(result.stats.lines).toBe(2); // Two lines: code + empty
      expect(result.html).toContain('const x = 1;');
    });

    it('handles code with multiple trailing newlines', async () => {
      const code = 'const x = 1;\n\n\n';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-newline-2',
      });

      expect(result.stats.lines).toBe(4);
    });

    it('handles empty lines in the middle', async () => {
      const code = 'const x = 1;\n\nconst y = 2;';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-empty-lines',
      });

      expect(result.stats.lines).toBe(3);
      expect(result.html).toContain(
        '<span id="test-empty-lines-L1" class="line"><span class="line-content"></span></span>'
      );
    });

    it('handles only whitespace', async () => {
      const code = '   \n\t\t\n   ';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-whitespace',
      });

      expect(result.html).toBeDefined();
      expect(result.stats.lines).toBe(3);
    });
  });

  describe('Singleton highlighter behavior', () => {
    it('reuses highlighter instance across calls', async () => {
      // First call initializes highlighter
      const result1 = await codeToHighlightHtml('const a = 1;', {
        lang: 'javascript',
        blockId: 'test-singleton-1',
      });

      // Second call should reuse highlighter (hitting the if branch on line 25)
      const result2 = await codeToHighlightHtml('const b = 2;', {
        lang: 'javascript',
        blockId: 'test-singleton-2',
      });

      expect(result1.html).toBeDefined();
      expect(result2.html).toBeDefined();
      expect(result1.html).not.toBe(result2.html);
    });

    it('works after loading custom language', async () => {
      const customGrammar = {
        name: 'test-reuse',
        scopeName: 'source.test-reuse',
        patterns: [
          {
            match: '\\b(KEYWORD)\\b',
            name: 'keyword',
          },
        ],
      };

      await loadCustomLanguage(customGrammar);

      // Should reuse the highlighter with the loaded language
      const result = await codeToHighlightHtml('KEYWORD', {
        lang: 'test-reuse',
        blockId: 'test-after-custom',
      });

      expect(result.html).toContain('KEYWORD');
    });
  });

  describe('Different themes', () => {
    it('works with dark-plus theme (default)', async () => {
      const code = 'const x = 42;';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        theme: 'dark-plus',
        blockId: 'test-theme-1',
      });

      expect(result.css).toContain('::highlight(');
      expect(result.html).toBeDefined();
    });

    it('uses default theme when not specified', async () => {
      const code = 'const x = 42;';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-theme-2',
      });

      expect(result.css).toContain('::highlight(');
      expect(result.html).toBeDefined();
    });

    it('fallback works with default theme', async () => {
      const code = 'const x = 42;';
      const html = await codeToHtmlFallback(code, {
        lang: 'javascript',
        theme: 'dark-plus',
      });

      expect(html).toContain('<span');
      expect(html).toContain('const');
    });

    it('fallback uses default theme when not provided', async () => {
      const code = 'const x = 42;';
      const html = await codeToHtmlFallback(code, {
        lang: 'javascript',
        // No theme provided - should default to 'dark-plus'
      });

      expect(html).toContain('<span');
      expect(html).toContain('const');
    });
  });

  describe('Very long content', () => {
    it('handles long single line', async () => {
      const code = 'const x = ' + '1234567890'.repeat(100) + ';';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-long-line',
      });

      expect(result.stats.lines).toBe(1);
      expect(result.html.length).toBeGreaterThan(1000);
    });

    it('handles many lines', async () => {
      const lines = Array.from({ length: 1000 }, (_, i) => `const x${i} = ${i};`);
      const code = lines.join('\n');
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-many-lines',
      });

      expect(result.stats.lines).toBe(1000);
      expect(result.stats.tokens).toBeGreaterThan(3000); // At least 3 tokens per line
    });
  });

  describe('Special language cases', () => {
    it('handles plain text language', async () => {
      const code = 'Just plain text\nNo syntax here';
      const result = await codeToHighlightHtml(code, {
        lang: 'text',
        blockId: 'test-text',
      });

      expect(result.html).toContain('Just plain text');
      expect(result.stats.lines).toBe(2);
    });
  });

  describe('Block ID generation', () => {
    it('generates different IDs when not provided', async () => {
      const code = 'const x = 1;';
      const result1 = await codeToHighlightHtml(code, {
        lang: 'javascript',
      });
      const result2 = await codeToHighlightHtml(code, {
        lang: 'javascript',
      });

      const id1 = result1.html.match(/data-highlight-block="([^"]+)"/)?.[1];
      const id2 = result2.html.match(/data-highlight-block="([^"]+)"/)?.[1];

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('uses provided block ID consistently', async () => {
      const code = 'const x = 1;';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'my-custom-id',
      });

      expect(result.html).toContain('data-highlight-block="my-custom-id"');
      expect(result.css).toContain('data-highlight-styles="my-custom-id"');
      expect(result.script).toContain("blockId = 'my-custom-id'");
    });
  });

  describe('Stats accuracy', () => {
    it('counts tokens correctly for complex code', async () => {
      const code = 'function test(x: number): string { return x.toString(); }';
      const result = await codeToHighlightHtml(code, {
        lang: 'typescript',
        blockId: 'test-stats',
      });

      expect(result.stats.tokens).toBeGreaterThan(10);
      expect(result.stats.lines).toBe(1);
      expect(result.stats.uniqueStyles).toBeGreaterThan(1);
    });

    it('counts unique styles correctly', async () => {
      const code = `const x = 1;
const y = 2;
const z = 3;`;
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-unique-styles',
      });

      // Should have multiple unique colors (keywords, numbers, operators, etc.)
      expect(result.stats.uniqueStyles).toBeGreaterThan(2);
    });
  });
});

describe('createCustomHighlighter', () => {
  it('creates highlighter with default options', async () => {
    const highlighter = await createCustomHighlighter({});

    expect(highlighter).toBeDefined();
    expect(typeof highlighter.codeToHtml).toBe('function');
    expect(typeof highlighter.loadLanguage).toBe('function');
  });

  it('creates highlighter with custom themes', async () => {
    const highlighter = await createCustomHighlighter({
      themes: ['github-dark', 'github-light'],
    });

    expect(highlighter).toBeDefined();
    expect(typeof highlighter.codeToHtml).toBe('function');
    expect(typeof highlighter.loadLanguage).toBe('function');
  });

  it('creates highlighter with custom langs', async () => {
    const highlighter = await createCustomHighlighter({
      langs: ['python', 'rust'],
    });

    expect(highlighter).toBeDefined();
    const html = await highlighter.codeToHtml('def test():\n    pass', {
      lang: 'python',
      theme: 'dark-plus',
    });

    expect(html).toContain('def');
  });

  it('creates highlighter with both themes and langs', async () => {
    const highlighter = await createCustomHighlighter({
      themes: ['monokai'],
      langs: ['go'],
    });

    expect(highlighter).toBeDefined();
    const html = await highlighter.codeToHtml('func main() {}', {
      lang: 'go',
      theme: 'monokai',
    });

    expect(html).toContain('func');
  });
});

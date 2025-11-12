import { describe, it, expect, beforeAll } from 'vitest';
import { codeToHighlightHtml, type ShikiTransformer, loadCustomLanguage } from '../src/index';
import { bundledLanguages } from 'shiki';
import type { Element } from 'hast';

describe('Integration Tests', () => {
  beforeAll(async () => {
    // Load languages needed for real-world scenario tests
    await loadCustomLanguage(bundledLanguages.python);
    await loadCustomLanguage(bundledLanguages.html);
    await loadCustomLanguage(bundledLanguages.json);
    await loadCustomLanguage(bundledLanguages.bash);
  });

  describe('Combined transformer features', () => {
    it('combines line numbers with highlighting', async () => {
      const code = 'const x = 1;\nconst y = 2;\nconst z = 3;';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-combo-1',
        lineNumbers: true,
        highlightLines: [2],
      });

      expect(result.html).toContain('line-number');
      expect(result.html).toContain('highlighted');
      expect(result.css).toContain('line-number');
      expect(result.css).toContain('highlighted');
    });

    it('combines line numbers with diff lines', async () => {
      const code = 'const x = 1;\nconst y = 2;\nconst z = 3;';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-combo-2',
        lineNumbers: { start: 10 },
        diffLines: {
          added: [1, 3],
          removed: [2],
        },
      });

      expect(result.html).toContain('line-number">10</span>');
      expect(result.html).toContain('line-number">11</span>');
      expect(result.html).toContain('line-number">12</span>');
      expect(result.html).toContain('diff-marker">+</span>');
      expect(result.html).toContain('diff-marker">-</span>');
      expect(result.css).toContain('diff.add');
      expect(result.css).toContain('diff.remove');
    });

    it('combines highlighting with focus lines', async () => {
      const code = 'const x = 1;\nconst y = 2;\nconst z = 3;\nconst w = 4;';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-combo-3',
        highlightLines: [2],
        focusLines: [2, 3],
      });

      expect(result.html).toContain('highlighted');
      expect(result.html).toContain('blurred');
      expect(result.css).toContain('highlighted');
      expect(result.css).toContain('blurred');
    });

    it('combines all features together', async () => {
      const code = 'const x = 1;\nconst y = 2;\nconst z = 3;\nconst w = 4;';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-combo-all',
        lineNumbers: { start: 5 },
        highlightLines: [1],
        diffLines: {
          added: [2],
          removed: [3],
        },
        focusLines: [1, 2],
      });

      expect(result.html).toContain('line-number">5</span>');
      expect(result.html).toContain('highlighted');
      expect(result.html).toContain('diff-marker">+</span>');
      expect(result.html).toContain('diff-marker">-</span>');
      expect(result.html).toContain('blurred');
      expect(result.css).toContain('line-number');
      expect(result.css).toContain('highlighted');
      expect(result.css).toContain('diff.add');
      expect(result.css).toContain('diff.remove');
      expect(result.css).toContain('blurred');
    });
  });

  describe('String parsing integration', () => {
    it('parses highlightLines as string with ranges', async () => {
      const code = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join('\n');
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-parse-1',
        highlightLines: '1,3,5-7',
      });

      // Should highlight lines 1, 3, 5, 6, 7
      const htmlLines = result.html.split('\n');
      const line1 = htmlLines.find((l) => l.includes('test-parse-1-L0'));
      const line3 = htmlLines.find((l) => l.includes('test-parse-1-L2'));
      const line5 = htmlLines.find((l) => l.includes('test-parse-1-L4'));
      const line6 = htmlLines.find((l) => l.includes('test-parse-1-L5'));
      const line7 = htmlLines.find((l) => l.includes('test-parse-1-L6'));
      const line2 = htmlLines.find((l) => l.includes('test-parse-1-L1'));

      expect(line1).toContain('highlighted');
      expect(line3).toContain('highlighted');
      expect(line5).toContain('highlighted');
      expect(line6).toContain('highlighted');
      expect(line7).toContain('highlighted');
      expect(line2).not.toContain('highlighted');
    });

    it('combines string parsing with other features', async () => {
      const code = 'a\nb\nc\nd\ne';
      const result = await codeToHighlightHtml(code, {
        lang: 'text',
        blockId: 'test-parse-2',
        lineNumbers: true,
        highlightLines: '2,4-5',
        diffLines: {
          added: [1],
        },
      });

      expect(result.html).toContain('line-number');
      expect(result.html).toContain('highlighted');
      expect(result.html).toContain('diff-marker">+</span>');
    });
  });

  describe('Custom transformers', () => {
    it('works with user-provided transformers', async () => {
      const customTransformer: ShikiTransformer = {
        name: 'test-custom',
        line(node: Element, line: number) {
          node.properties = node.properties || {};
          node.properties['data-line'] = line;
          const classes = Array.isArray(node.properties.class) ? node.properties.class : [];
          if (!classes.includes('line')) {
            classes.push('line');
          }
          if (line === 2) {
            classes.push('custom-marker');
          }
          node.properties.class = classes;
        },
      };

      const code = 'const x = 1;\nconst y = 2;\nconst z = 3;';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-custom',
        transformers: [customTransformer],
      });

      // Custom transformer should add 'custom-marker' class to line 2
      const line2 = result.html.split('\n').find((l) => l.includes('test-custom-L1'));
      expect(line2).toContain('custom-marker');
    });

    it('combines custom transformers with convenience options', async () => {
      const customTransformer: ShikiTransformer = {
        name: 'test-custom-2',
        line(node: Element, line: number) {
          node.properties = node.properties || {};
          node.properties['data-line'] = line;
          const classes = Array.isArray(node.properties.class) ? node.properties.class : [];
          if (!classes.includes('line')) {
            classes.push('line');
          }
          if (line === 1) {
            classes.push('important');
          }
          node.properties.class = classes;
        },
      };

      const code = 'const x = 1;\nconst y = 2;';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-custom-combo',
        transformers: [customTransformer],
        lineNumbers: true,
        highlightLines: [2],
      });

      expect(result.html).toContain('important');
      expect(result.html).toContain('line-number');
      expect(result.html).toContain('highlighted');
    });
  });

  describe('Error handling and fallbacks', () => {
    it('handles invalid language gracefully', async () => {
      const code = 'const x = 1;';

      // Invalid language should throw or return fallback
      await expect(
        codeToHighlightHtml(code, {
          lang: 'invalid-language-xyz',
          blockId: 'test-error-1',
        })
      ).rejects.toThrow();
    });

    it('handles empty code', async () => {
      const code = '';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-empty',
        lineNumbers: true,
      });

      expect(result.html).toBeDefined();
      expect(result.stats.lines).toBe(1); // Empty string has one line
    });

    it('handles code with only whitespace', async () => {
      const code = '   \n\t\n   ';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-whitespace',
        lineNumbers: true,
        highlightLines: [2],
      });

      expect(result.html).toBeDefined();
      expect(result.stats.lines).toBe(3);
    });

    it('handles invalid line numbers gracefully', async () => {
      const code = 'const x = 1;\nconst y = 2;';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-invalid-lines',
        highlightLines: [999], // Line doesn't exist
        diffLines: {
          added: [1000], // Line doesn't exist
        },
        focusLines: [2000], // Line doesn't exist
      });

      // Should not crash, just not apply non-existent lines
      expect(result.html).toBeDefined();
      expect(result.stats.lines).toBe(2);
    });
  });

  describe('Fast path verification', () => {
    it('uses fast path when no transformers', async () => {
      const code = 'const x = 1;';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-fast',
      });

      // Fast path should not have any metadata classes
      expect(result.html).not.toContain('line-number');
      expect(result.html).not.toContain('highlighted');
      expect(result.html).not.toContain('diff');
      expect(result.html).not.toContain('blurred');

      // But should still have syntax highlighting
      expect(result.css).toContain('::highlight(');
      expect(result.script).toContain('CSS.highlights');
    });

    it('fast path and transformer path produce compatible structures', async () => {
      const code = 'const x = 1;';

      const fastResult = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-compat-1',
      });

      const transformerResult = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-compat-2',
        lineNumbers: true,
      });

      // Both should have the same basic structure
      expect(fastResult.html).toContain('<pre class="shiki"');
      expect(transformerResult.html).toContain('<pre class="shiki"');
      expect(fastResult.html).toContain('<code>');
      expect(transformerResult.html).toContain('<code>');
      expect(fastResult.html).toContain('class="line"');
      expect(transformerResult.html).toContain('class="line');
    });
  });

  describe('Performance and statistics', () => {
    it('reports accurate statistics with transformers', async () => {
      const code = 'const x = 1;\nconst y = 2;';
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-stats',
        lineNumbers: true,
        highlightLines: [1],
      });

      expect(result.stats.lines).toBe(2);
      expect(result.stats.tokens).toBeGreaterThan(0);
      expect(result.stats.uniqueStyles).toBeGreaterThan(0);
    });

    it('handles large code blocks with transformers', async () => {
      const lines = Array.from({ length: 100 }, (_, i) => `const x${i} = ${i};`);
      const code = lines.join('\n');
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        blockId: 'test-large',
        lineNumbers: { start: 1 },
        highlightLines: [1, 50, 100],
      });

      expect(result.stats.lines).toBe(100);
      expect(result.html).toContain('line-number">1</span>');
      expect(result.html).toContain('line-number">100</span>');
    });
  });

  describe('Real-world scenarios', () => {
    it('handles TypeScript with type annotations', async () => {
      const code = `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}`;
      const result = await codeToHighlightHtml(code, {
        lang: 'typescript',
        blockId: 'test-ts',
        lineNumbers: true,
        highlightLines: [2],
      });

      expect(result.html).toContain('function greet');
      expect(result.html).toContain('string');
      expect(result.stats.lines).toBe(3);
    });

    it('handles Python with indentation', async () => {
      const code = `def greet(name):
    return f"Hello, {name}!"`;
      const result = await codeToHighlightHtml(code, {
        lang: 'python',
        blockId: 'test-py',
        lineNumbers: true,
        diffLines: {
          added: [2],
        },
      });

      expect(result.html).toContain('def greet');
      expect(result.html).toContain('return');
      expect(result.html).toContain('diff-marker">+</span>');
    });

    it('handles HTML code with special characters', async () => {
      const code = '<div class="container">\n  <p>Hello & goodbye</p>\n</div>';
      const result = await codeToHighlightHtml(code, {
        lang: 'html',
        blockId: 'test-html',
        lineNumbers: true,
        highlightLines: [2],
      });

      // Should escape special characters
      expect(result.html).toContain('&lt;div');
      expect(result.html).toContain('&gt;');
      expect(result.html).toContain('&amp;');
      expect(result.html).toContain('&quot;');
    });

    it('handles JSON formatting', async () => {
      const code = `{
  "name": "test",
  "version": "1.0.0"
}`;
      const result = await codeToHighlightHtml(code, {
        lang: 'json',
        blockId: 'test-json',
        lineNumbers: true,
        highlightLines: [2, 3],
      });

      expect(result.html).toContain('name');
      expect(result.html).toContain('test');
      expect(result.html).toContain('version');
      expect(result.stats.lines).toBe(4);
    });

    it('handles shell commands', async () => {
      const code = `npm install
npm test
npm run build`;
      const result = await codeToHighlightHtml(code, {
        lang: 'bash',
        blockId: 'test-bash',
        lineNumbers: true,
        diffLines: {
          added: [1],
          removed: [2],
        },
      });

      expect(result.html).toContain('npm install');
      expect(result.html).toContain('npm test');
      expect(result.html).toContain('diff-marker">+</span>');
      expect(result.html).toContain('diff-marker">-</span>');
    });
  });
});

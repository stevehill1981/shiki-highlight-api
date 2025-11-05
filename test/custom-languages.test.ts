import { describe, it, expect } from 'vitest';
import { loadCustomLanguage, codeToHighlightHtml } from '../src/index';

describe('loadCustomLanguage', () => {
  it('loads a custom language successfully', async () => {
    // Simple test grammar
    const customGrammar = {
      name: 'test-lang',
      scopeName: 'source.test',
      patterns: [
        {
          match: '\\b(TEST|KEYWORD)\\b',
          name: 'keyword.control.test',
        },
      ],
    };

    await loadCustomLanguage(customGrammar);

    // Should be able to use the custom language
    const code = 'TEST KEYWORD';
    const result = await codeToHighlightHtml(code, {
      lang: 'test-lang',
      theme: 'dark-plus',
      blockId: 'test-custom-1',
    });

    expect(result.html).toContain('TEST KEYWORD');
    expect(result.stats.tokens).toBeGreaterThanOrEqual(0);
  });

  it('handles languages with complex patterns', async () => {
    const complexGrammar = {
      name: 'complex-test',
      scopeName: 'source.complex',
      patterns: [
        {
          match: '\\d+',
          name: 'constant.numeric',
        },
        {
          match: '"[^"]*"',
          name: 'string.quoted.double',
        },
        {
          match: '\\b(func|var)\\b',
          name: 'keyword',
        },
      ],
    };

    await loadCustomLanguage(complexGrammar);

    const code = 'func test 42 "hello"';
    const result = await codeToHighlightHtml(code, {
      lang: 'complex-test',
      theme: 'dark-plus',
      blockId: 'test-custom-2',
    });

    expect(result.html).toBeDefined();
    expect(result.css).toContain('::highlight(');
  });
});

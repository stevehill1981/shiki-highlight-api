import { describe, it, expect } from 'vitest';
import type { HighlightOptions, ShikiTransformer } from '../src/index';

describe('HighlightOptions Interface', () => {
  it('accepts basic options', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
      theme: 'dark-plus',
      blockId: 'test-block',
    };

    expect(options.lang).toBe('javascript');
    expect(options.theme).toBe('dark-plus');
    expect(options.blockId).toBe('test-block');
  });

  it('accepts transformers array', () => {
    const mockTransformer: ShikiTransformer = {
      name: 'test-transformer',
    };

    const options: HighlightOptions = {
      lang: 'javascript',
      transformers: [mockTransformer],
    };

    expect(options.transformers).toBeDefined();
    expect(options.transformers?.length).toBe(1);
    expect(options.transformers?.[0].name).toBe('test-transformer');
  });

  it('accepts lineNumbers as boolean', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
      lineNumbers: true,
    };

    expect(options.lineNumbers).toBe(true);
  });

  it('accepts lineNumbers as object with start', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
      lineNumbers: { start: 10 },
    };

    expect(options.lineNumbers).toEqual({ start: 10 });
  });

  it('accepts highlightLines as number array', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
      highlightLines: [1, 3, 5, 7],
    };

    expect(options.highlightLines).toEqual([1, 3, 5, 7]);
  });

  it('accepts highlightLines as string', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
      highlightLines: '1,3,5-7',
    };

    expect(options.highlightLines).toBe('1,3,5-7');
  });

  it('accepts diffLines with added and removed', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
      diffLines: {
        added: [1, 2, 3],
        removed: [5, 6],
      },
    };

    expect(options.diffLines?.added).toEqual([1, 2, 3]);
    expect(options.diffLines?.removed).toEqual([5, 6]);
  });

  it('accepts diffLines with only added', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
      diffLines: {
        added: [1, 2],
      },
    };

    expect(options.diffLines?.added).toEqual([1, 2]);
    expect(options.diffLines?.removed).toBeUndefined();
  });

  it('accepts diffLines with only removed', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
      diffLines: {
        removed: [3, 4],
      },
    };

    expect(options.diffLines?.removed).toEqual([3, 4]);
    expect(options.diffLines?.added).toBeUndefined();
  });

  it('accepts focusLines array', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
      focusLines: [2, 3, 4],
    };

    expect(options.focusLines).toEqual([2, 3, 4]);
  });

  it('accepts all options combined', () => {
    const mockTransformer: ShikiTransformer = {
      name: 'test-transformer',
    };

    const options: HighlightOptions = {
      lang: 'typescript',
      theme: 'monokai',
      blockId: 'custom-block',
      transformers: [mockTransformer],
      lineNumbers: { start: 5 },
      highlightLines: '1-3,5,7',
      diffLines: {
        added: [1, 2],
        removed: [5],
      },
      focusLines: [3, 4, 5],
    };

    expect(options.lang).toBe('typescript');
    expect(options.theme).toBe('monokai');
    expect(options.blockId).toBe('custom-block');
    expect(options.transformers?.length).toBe(1);
    expect(options.lineNumbers).toEqual({ start: 5 });
    expect(options.highlightLines).toBe('1-3,5,7');
    expect(options.diffLines?.added).toEqual([1, 2]);
    expect(options.diffLines?.removed).toEqual([5]);
    expect(options.focusLines).toEqual([3, 4, 5]);
  });

  it('accepts minimal options (only lang required)', () => {
    const options: HighlightOptions = {
      lang: 'rust',
    };

    expect(options.lang).toBe('rust');
    expect(options.theme).toBeUndefined();
    expect(options.blockId).toBeUndefined();
    expect(options.transformers).toBeUndefined();
    expect(options.lineNumbers).toBeUndefined();
    expect(options.highlightLines).toBeUndefined();
    expect(options.diffLines).toBeUndefined();
    expect(options.focusLines).toBeUndefined();
  });
});

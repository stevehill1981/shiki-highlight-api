import { describe, it, expect } from 'vitest';
import { buildTransformers } from '../src/transformer-builder';
import type { HighlightOptions } from '../src/index';
import type { Element } from 'hast';

describe('buildTransformers', () => {
  it('returns empty array when no transformer options provided', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
    };

    const transformers = buildTransformers(options);
    expect(transformers).toEqual([]);
  });

  it('returns user-provided transformers when given', () => {
    const customTransformer = {
      name: 'custom-transformer',
      pre(node: Element) {
        node.properties = node.properties || {};
        node.properties['data-custom'] = 'true';
      },
    };

    const options: HighlightOptions = {
      lang: 'javascript',
      transformers: [customTransformer],
    };

    const transformers = buildTransformers(options);
    expect(transformers).toHaveLength(1);
    expect(transformers[0].name).toBe('custom-transformer');
  });

  it('builds transformer for line numbers (boolean)', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
      lineNumbers: true,
    };

    const transformers = buildTransformers(options);
    expect(transformers.length).toBeGreaterThan(0);
    expect(transformers.some((t) => t.name?.includes('line-number'))).toBe(true);
  });

  it('builds transformer for line numbers (with start)', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
      lineNumbers: { start: 10 },
    };

    const transformers = buildTransformers(options);
    expect(transformers.length).toBeGreaterThan(0);
    expect(transformers.some((t) => t.name?.includes('line-number'))).toBe(true);
  });

  it('builds transformer for highlight lines (array)', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
      highlightLines: [1, 3, 5],
    };

    const transformers = buildTransformers(options);
    expect(transformers.length).toBeGreaterThan(0);
    expect(transformers.some((t) => t.name?.includes('highlight'))).toBe(true);
  });

  it('builds transformer for highlight lines (string)', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
      highlightLines: '1,3,5-7',
    };

    const transformers = buildTransformers(options);
    expect(transformers.length).toBeGreaterThan(0);
    expect(transformers.some((t) => t.name?.includes('highlight'))).toBe(true);
  });

  it('builds transformer for diff lines', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
      diffLines: {
        added: [1, 2],
        removed: [5, 6],
      },
    };

    const transformers = buildTransformers(options);
    expect(transformers.length).toBeGreaterThan(0);
    expect(transformers.some((t) => t.name?.includes('diff'))).toBe(true);
  });

  it('builds transformer for focus lines', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
      focusLines: [2, 3, 4],
    };

    const transformers = buildTransformers(options);
    expect(transformers.length).toBeGreaterThan(0);
    expect(transformers.some((t) => t.name?.includes('focus'))).toBe(true);
  });

  it('combines user transformers with generated ones', () => {
    const customTransformer = {
      name: 'custom',
    };

    const options: HighlightOptions = {
      lang: 'javascript',
      transformers: [customTransformer],
      lineNumbers: true,
      highlightLines: [1, 2, 3],
    };

    const transformers = buildTransformers(options);
    expect(transformers.length).toBeGreaterThan(2); // custom + lineNumbers + highlight
    expect(transformers.some((t) => t.name === 'custom')).toBe(true);
    expect(transformers.some((t) => t.name?.includes('line-number'))).toBe(true);
    expect(transformers.some((t) => t.name?.includes('highlight'))).toBe(true);
  });

  it('handles all convenience options together', () => {
    const options: HighlightOptions = {
      lang: 'javascript',
      lineNumbers: { start: 1 },
      highlightLines: '1-3',
      diffLines: {
        added: [5],
        removed: [10],
      },
      focusLines: [2, 3],
    };

    const transformers = buildTransformers(options);
    // Should have transformers for all features
    expect(transformers.length).toBeGreaterThanOrEqual(4);
  });
});

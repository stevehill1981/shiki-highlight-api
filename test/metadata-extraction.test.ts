import { describe, it, expect } from 'vitest';
import { extractMetadata } from '../src/metadata-extraction';
import type { Root as HastRoot } from 'hast';

describe('extractMetadata', () => {
  it('returns empty metadata for simple code without transformer classes', () => {
    const hast: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          properties: { class: ['shiki'] },
          children: [
            {
              type: 'element',
              tagName: 'code',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'span',
                  properties: { class: ['line'], 'data-line': '1' },
                  children: [{ type: 'text', value: 'const x = 1;' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const metadata = extractMetadata(hast);

    expect(metadata.lineNumbers).toBe(false);
    expect(metadata.highlightedLines.size).toBe(0);
    expect(metadata.diffLines.added.size).toBe(0);
    expect(metadata.diffLines.removed.size).toBe(0);
    expect(metadata.focusLines.size).toBe(0);
  });

  it('detects highlighted lines', () => {
    const hast: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'code',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'span',
                  properties: { class: ['line', 'highlighted'], 'data-line': '1' },
                  children: [{ type: 'text', value: 'line 1' }],
                },
                {
                  type: 'element',
                  tagName: 'span',
                  properties: { class: ['line'], 'data-line': '2' },
                  children: [{ type: 'text', value: 'line 2' }],
                },
                {
                  type: 'element',
                  tagName: 'span',
                  properties: { class: ['line', 'highlighted'], 'data-line': '3' },
                  children: [{ type: 'text', value: 'line 3' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const metadata = extractMetadata(hast);

    expect(metadata.highlightedLines.has(1)).toBe(true);
    expect(metadata.highlightedLines.has(2)).toBe(false);
    expect(metadata.highlightedLines.has(3)).toBe(true);
    expect(metadata.highlightedLines.size).toBe(2);
  });

  it('detects diff added lines', () => {
    const hast: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'code',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'span',
                  properties: { class: ['line', 'diff', 'add'], 'data-line': '1' },
                  children: [{ type: 'text', value: '+ added line' }],
                },
                {
                  type: 'element',
                  tagName: 'span',
                  properties: { class: ['line'], 'data-line': '2' },
                  children: [{ type: 'text', value: 'unchanged' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const metadata = extractMetadata(hast);

    expect(metadata.diffLines.added.has(1)).toBe(true);
    expect(metadata.diffLines.added.size).toBe(1);
    expect(metadata.diffLines.removed.size).toBe(0);
  });

  it('detects diff removed lines', () => {
    const hast: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'code',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'span',
                  properties: { class: ['line', 'diff', 'remove'], 'data-line': '1' },
                  children: [{ type: 'text', value: '- removed line' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const metadata = extractMetadata(hast);

    expect(metadata.diffLines.removed.has(1)).toBe(true);
    expect(metadata.diffLines.removed.size).toBe(1);
    expect(metadata.diffLines.added.size).toBe(0);
  });

  it('detects focused lines', () => {
    const hast: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'code',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'span',
                  properties: { class: ['line', 'focused'], 'data-line': '2' },
                  children: [{ type: 'text', value: 'focused line' }],
                },
                {
                  type: 'element',
                  tagName: 'span',
                  properties: { class: ['line', 'has-focus'], 'data-line': '3' },
                  children: [{ type: 'text', value: 'also focused' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const metadata = extractMetadata(hast);

    expect(metadata.focusLines.has(2)).toBe(true);
    expect(metadata.focusLines.has(3)).toBe(true);
    expect(metadata.focusLines.size).toBe(2);
  });

  it('captures line classes', () => {
    const hast: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'code',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'span',
                  properties: {
                    class: ['line', 'highlighted', 'important', 'custom'],
                    'data-line': '1',
                  },
                  children: [{ type: 'text', value: 'line' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const metadata = extractMetadata(hast);

    expect(metadata.lineClasses.get(1)).toEqual(['line', 'highlighted', 'important', 'custom']);
  });

  it('parses inline styles', () => {
    const hast: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'code',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'span',
                  properties: {
                    class: ['line'],
                    'data-line': '1',
                    style: 'background-color: yellow; color: black;',
                  },
                  children: [{ type: 'text', value: 'styled line' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const metadata = extractMetadata(hast);

    const styles = metadata.lineStyles.get(1);
    expect(styles).toBeDefined();
    expect(styles?.['background-color']).toBe('yellow');
    expect(styles?.['color']).toBe('black');
  });

  it('handles multiple features on the same line', () => {
    const hast: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'code',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'span',
                  properties: {
                    class: ['line', 'highlighted', 'diff', 'add', 'focused'],
                    'data-line': '1',
                    style: 'font-weight: bold;',
                  },
                  children: [{ type: 'text', value: 'complex line' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const metadata = extractMetadata(hast);

    expect(metadata.highlightedLines.has(1)).toBe(true);
    expect(metadata.diffLines.added.has(1)).toBe(true);
    expect(metadata.focusLines.has(1)).toBe(true);
    expect(metadata.lineClasses.get(1)).toContain('highlighted');
    expect(metadata.lineClasses.get(1)).toContain('diff');
    expect(metadata.lineStyles.get(1)?.['font-weight']).toBe('bold');
  });

  it('handles lines without data-line attribute', () => {
    const hast: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'code',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'span',
                  properties: { class: ['line', 'highlighted'] },
                  children: [{ type: 'text', value: 'no data-line' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const metadata = extractMetadata(hast);

    // Should not crash, but won't capture this line
    expect(metadata.highlightedLines.size).toBe(0);
  });

  it('handles invalid line numbers gracefully', () => {
    const hast: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'code',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'span',
                  properties: { class: ['line', 'highlighted'], 'data-line': 'invalid' },
                  children: [{ type: 'text', value: 'bad line number' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const metadata = extractMetadata(hast);

    // NaN should not be added to sets
    expect(metadata.highlightedLines.size).toBe(0);
  });
});

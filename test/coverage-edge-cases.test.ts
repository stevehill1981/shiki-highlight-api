import { describe, it, expect } from 'vitest';
import { parseLineNumbers } from '../src/line-parser';
import { extractMetadata } from '../src/metadata-extraction';
import type { Root as HastRoot, Element } from 'hast';

describe('Coverage Edge Cases', () => {
  describe('Line parser edge cases', () => {
    it('handles empty segments', () => {
      const result = parseLineNumbers('1,,3');
      expect(result.has(1)).toBe(true);
      expect(result.has(3)).toBe(true);
      expect(result.size).toBe(2);
    });

    it('handles invalid range with multiple dashes', () => {
      const result = parseLineNumbers('1-2-3');
      expect(result.size).toBe(0); // Invalid range ignored
    });

    it('handles range with zero', () => {
      const result = parseLineNumbers('0-5');
      expect(result.size).toBe(0); // Zero is invalid
    });

    it('handles range with negative numbers', () => {
      const result = parseLineNumbers('-1-5');
      expect(result.size).toBe(0); // Negative is invalid
    });

    it('handles trailing commas', () => {
      const result = parseLineNumbers('1,2,3,');
      expect(result.size).toBe(3);
      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(true);
      expect(result.has(3)).toBe(true);
    });

    it('handles leading commas', () => {
      const result = parseLineNumbers(',1,2');
      expect(result.size).toBe(2);
      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(true);
    });

    it('handles whitespace-only segments', () => {
      const result = parseLineNumbers('1,   ,3');
      expect(result.size).toBe(2);
      expect(result.has(1)).toBe(true);
      expect(result.has(3)).toBe(true);
    });
  });

  describe('Metadata extraction edge cases', () => {
    it('extracts line numbers from line-numbered class without data-line', () => {
      const hast: HastRoot = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: {
              class: ['line-numbered'],
              'data-line-number': 1,
            },
            children: [],
          } as Element,
        ],
      };

      const metadata = extractMetadata(hast);
      expect(metadata.lineNumbers).toEqual({ start: 1 });
    });

    it('handles invalid data-line-number in line-numbered element', () => {
      const hast: HastRoot = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: {
              class: ['line-numbered'],
              'data-line-number': 'invalid',
            },
            children: [],
          } as Element,
        ],
      };

      const metadata = extractMetadata(hast);
      expect(metadata.lineNumbers).toBe(false);
    });

    it('handles element without data-line-number', () => {
      const hast: HastRoot = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: {
              class: ['line-numbered'],
            },
            children: [],
          } as Element,
        ],
      };

      const metadata = extractMetadata(hast);
      expect(metadata.lineNumbers).toBe(false);
    });

    it('skips elements without data-line that are not line-numbered', () => {
      const hast: HastRoot = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: {
              class: ['some-other-class'],
            },
            children: [],
          } as Element,
        ],
      };

      const metadata = extractMetadata(hast);
      expect(metadata.lineNumbers).toBe(false);
      expect(metadata.highlightedLines.size).toBe(0);
    });
  });
});

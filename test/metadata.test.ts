import { describe, it, expect } from 'vitest';
import { createEmptyMetadata, type Metadata } from '../src/metadata';

describe('Metadata', () => {
  describe('createEmptyMetadata', () => {
    it('creates metadata with default values', () => {
      const metadata = createEmptyMetadata();

      expect(metadata.lineNumbers).toBe(false);
      expect(metadata.highlightedLines).toBeInstanceOf(Set);
      expect(metadata.highlightedLines.size).toBe(0);
      expect(metadata.diffLines.added).toBeInstanceOf(Set);
      expect(metadata.diffLines.added.size).toBe(0);
      expect(metadata.diffLines.removed).toBeInstanceOf(Set);
      expect(metadata.diffLines.removed.size).toBe(0);
      expect(metadata.focusLines).toBeInstanceOf(Set);
      expect(metadata.focusLines.size).toBe(0);
      expect(metadata.lineClasses).toBeInstanceOf(Map);
      expect(metadata.lineClasses.size).toBe(0);
      expect(metadata.lineStyles).toBeInstanceOf(Map);
      expect(metadata.lineStyles.size).toBe(0);
    });

    it('allows lineNumbers to be boolean', () => {
      const metadata = createEmptyMetadata();
      metadata.lineNumbers = true;

      expect(metadata.lineNumbers).toBe(true);
    });

    it('allows lineNumbers to be object with start', () => {
      const metadata = createEmptyMetadata();
      metadata.lineNumbers = { start: 10 };

      expect(metadata.lineNumbers).toEqual({ start: 10 });
    });

    it('allows adding highlighted lines', () => {
      const metadata = createEmptyMetadata();
      metadata.highlightedLines.add(1);
      metadata.highlightedLines.add(3);
      metadata.highlightedLines.add(5);

      expect(metadata.highlightedLines.has(1)).toBe(true);
      expect(metadata.highlightedLines.has(2)).toBe(false);
      expect(metadata.highlightedLines.has(3)).toBe(true);
      expect(metadata.highlightedLines.size).toBe(3);
    });

    it('allows adding diff lines', () => {
      const metadata = createEmptyMetadata();
      metadata.diffLines.added.add(1);
      metadata.diffLines.added.add(2);
      metadata.diffLines.removed.add(5);

      expect(metadata.diffLines.added.has(1)).toBe(true);
      expect(metadata.diffLines.added.has(2)).toBe(true);
      expect(metadata.diffLines.removed.has(5)).toBe(true);
      expect(metadata.diffLines.added.size).toBe(2);
      expect(metadata.diffLines.removed.size).toBe(1);
    });

    it('allows adding focus lines', () => {
      const metadata = createEmptyMetadata();
      metadata.focusLines.add(3);
      metadata.focusLines.add(4);

      expect(metadata.focusLines.has(3)).toBe(true);
      expect(metadata.focusLines.has(4)).toBe(true);
      expect(metadata.focusLines.size).toBe(2);
    });

    it('allows adding line classes', () => {
      const metadata = createEmptyMetadata();
      metadata.lineClasses.set(1, ['highlighted', 'important']);
      metadata.lineClasses.set(2, ['diff', 'add']);

      expect(metadata.lineClasses.get(1)).toEqual(['highlighted', 'important']);
      expect(metadata.lineClasses.get(2)).toEqual(['diff', 'add']);
      expect(metadata.lineClasses.size).toBe(2);
    });

    it('allows adding line styles', () => {
      const metadata = createEmptyMetadata();
      metadata.lineStyles.set(1, { backgroundColor: 'yellow', color: 'black' });
      metadata.lineStyles.set(2, { fontWeight: 'bold' });

      expect(metadata.lineStyles.get(1)).toEqual({ backgroundColor: 'yellow', color: 'black' });
      expect(metadata.lineStyles.get(2)).toEqual({ fontWeight: 'bold' });
      expect(metadata.lineStyles.size).toBe(2);
    });
  });

  describe('Metadata type', () => {
    it('satisfies the Metadata interface', () => {
      const metadata: Metadata = {
        lineNumbers: { start: 1 },
        highlightedLines: new Set([1, 2, 3]),
        diffLines: {
          added: new Set([1]),
          removed: new Set([5]),
        },
        focusLines: new Set([2, 3]),
        lineClasses: new Map([[1, ['custom-class']]]),
        lineStyles: new Map([[1, { color: 'red' }]]),
      };

      expect(metadata).toBeDefined();
      expect(metadata.lineNumbers).toEqual({ start: 1 });
      expect(metadata.highlightedLines.size).toBe(3);
    });
  });
});

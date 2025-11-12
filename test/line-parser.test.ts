import { describe, it, expect } from 'vitest';
import { parseLineNumbers } from '../src/line-parser';

describe('parseLineNumbers', () => {
  it('parses single line number', () => {
    const result = parseLineNumbers('5');
    expect(result.has(5)).toBe(true);
    expect(result.size).toBe(1);
  });

  it('parses comma-separated line numbers', () => {
    const result = parseLineNumbers('1,3,5');
    expect(result.has(1)).toBe(true);
    expect(result.has(3)).toBe(true);
    expect(result.has(5)).toBe(true);
    expect(result.size).toBe(3);
  });

  it('parses line ranges', () => {
    const result = parseLineNumbers('1-5');
    expect(result.has(1)).toBe(true);
    expect(result.has(2)).toBe(true);
    expect(result.has(3)).toBe(true);
    expect(result.has(4)).toBe(true);
    expect(result.has(5)).toBe(true);
    expect(result.size).toBe(5);
  });

  it('parses mixed single numbers and ranges', () => {
    const result = parseLineNumbers('1,3-5,7,10-12');
    expect(result.has(1)).toBe(true);
    expect(result.has(2)).toBe(false);
    expect(result.has(3)).toBe(true);
    expect(result.has(4)).toBe(true);
    expect(result.has(5)).toBe(true);
    expect(result.has(6)).toBe(false);
    expect(result.has(7)).toBe(true);
    expect(result.has(8)).toBe(false);
    expect(result.has(9)).toBe(false);
    expect(result.has(10)).toBe(true);
    expect(result.has(11)).toBe(true);
    expect(result.has(12)).toBe(true);
    expect(result.size).toBe(8);
  });

  it('handles whitespace around numbers', () => {
    const result = parseLineNumbers(' 1 , 3 - 5 , 7 ');
    expect(result.has(1)).toBe(true);
    expect(result.has(3)).toBe(true);
    expect(result.has(4)).toBe(true);
    expect(result.has(5)).toBe(true);
    expect(result.has(7)).toBe(true);
    expect(result.size).toBe(5);
  });

  it('returns empty set for empty string', () => {
    const result = parseLineNumbers('');
    expect(result.size).toBe(0);
  });

  it('returns empty set for whitespace-only string', () => {
    const result = parseLineNumbers('   ');
    expect(result.size).toBe(0);
  });

  it('ignores invalid numbers', () => {
    const result = parseLineNumbers('1,abc,3');
    expect(result.has(1)).toBe(true);
    expect(result.has(3)).toBe(true);
    expect(result.size).toBe(2);
  });

  it('handles invalid ranges gracefully', () => {
    const result = parseLineNumbers('1,3-abc,5');
    expect(result.has(1)).toBe(true);
    expect(result.has(5)).toBe(true);
    expect(result.size).toBe(2);
  });

  it('handles reversed ranges (ignores them)', () => {
    const result = parseLineNumbers('5-3');
    // Reversed ranges should be ignored
    expect(result.size).toBe(0);
  });

  it('handles zero and negative numbers (ignores them)', () => {
    const result = parseLineNumbers('0,-1,3,5');
    // Only valid positive line numbers should be included
    expect(result.has(3)).toBe(true);
    expect(result.has(5)).toBe(true);
    expect(result.size).toBe(2);
  });

  it('handles very large ranges', () => {
    const result = parseLineNumbers('1-1000');
    expect(result.has(1)).toBe(true);
    expect(result.has(500)).toBe(true);
    expect(result.has(1000)).toBe(true);
    expect(result.size).toBe(1000);
  });

  it('handles duplicate numbers (deduplicates via Set)', () => {
    const result = parseLineNumbers('1,2,2,3,3,3');
    expect(result.has(1)).toBe(true);
    expect(result.has(2)).toBe(true);
    expect(result.has(3)).toBe(true);
    expect(result.size).toBe(3);
  });

  it('handles overlapping ranges', () => {
    const result = parseLineNumbers('1-5,3-7');
    expect(result.has(1)).toBe(true);
    expect(result.has(3)).toBe(true);
    expect(result.has(5)).toBe(true);
    expect(result.has(7)).toBe(true);
    expect(result.size).toBe(7); // 1,2,3,4,5,6,7
  });

  it('handles complex real-world example', () => {
    const result = parseLineNumbers('1-3,5,7-9,15,20-22,100');
    expect(result.has(1)).toBe(true);
    expect(result.has(2)).toBe(true);
    expect(result.has(3)).toBe(true);
    expect(result.has(4)).toBe(false);
    expect(result.has(5)).toBe(true);
    expect(result.has(6)).toBe(false);
    expect(result.has(7)).toBe(true);
    expect(result.has(8)).toBe(true);
    expect(result.has(9)).toBe(true);
    expect(result.has(15)).toBe(true);
    expect(result.has(20)).toBe(true);
    expect(result.has(21)).toBe(true);
    expect(result.has(22)).toBe(true);
    expect(result.has(100)).toBe(true);
    expect(result.size).toBe(12); // 1,2,3 + 5 + 7,8,9 + 15 + 20,21,22 + 100
  });
});

/**
 * Parses line number strings like "1,3,5-7" into a Set of line numbers.
 *
 * Supports:
 * - Single numbers: "5"
 * - Comma-separated: "1,3,5"
 * - Ranges: "1-5"
 * - Mixed: "1,3-5,7,10-12"
 *
 * Invalid inputs (non-numbers, zero, negative, reversed ranges) are ignored.
 *
 * @example
 * parseLineNumbers("1,3,5-7")  // Set(5) { 1, 3, 5, 6, 7 }
 * parseLineNumbers("1-3,5")    // Set(4) { 1, 2, 3, 5 }
 */
export function parseLineNumbers(input: string): Set<number> {
  const lines = new Set<number>();

  // Trim and check for empty string
  const trimmed = input.trim();
  if (!trimmed) {
    return lines;
  }

  // Split by comma and process each segment
  const segments = trimmed.split(',');

  for (const segment of segments) {
    const trimmedSegment = segment.trim();
    if (!trimmedSegment) continue;

    // Check if it's a range (contains dash)
    if (trimmedSegment.includes('-')) {
      const parts = trimmedSegment.split('-');
      if (parts.length !== 2) continue;

      const start = parseInt(parts[0].trim(), 10);
      const end = parseInt(parts[1].trim(), 10);

      // Validate range
      if (isNaN(start) || isNaN(end)) continue;
      if (start <= 0 || end <= 0) continue;
      if (start > end) continue; // Reversed ranges are invalid

      // Add all numbers in range
      for (let i = start; i <= end; i++) {
        lines.add(i);
      }
    } else {
      // Single number
      const num = parseInt(trimmedSegment, 10);
      if (!isNaN(num) && num > 0) {
        lines.add(num);
      }
    }
  }

  return lines;
}

/**
 * Metadata extracted from Shiki transformers for line-level features.
 */
export interface Metadata {
  /**
   * Whether to display line numbers.
   * - false: No line numbers
   * - true: Line numbers starting at 1
   * - { start: number }: Line numbers starting at specified number
   */
  lineNumbers: boolean | { start: number };

  /**
   * Set of line numbers that should be highlighted.
   */
  highlightedLines: Set<number>;

  /**
   * Lines that show diff additions or removals.
   */
  diffLines: {
    added: Set<number>;
    removed: Set<number>;
  };

  /**
   * Lines that should be in focus (blurs all other lines).
   */
  focusLines: Set<number>;

  /**
   * Additional CSS classes to apply to specific lines.
   * Maps line number to array of class names.
   */
  lineClasses: Map<number, string[]>;

  /**
   * Inline styles to apply to specific lines.
   * Maps line number to style object.
   */
  lineStyles: Map<number, Record<string, string>>;
}

/**
 * Creates an empty metadata object with default values.
 */
export function createEmptyMetadata(): Metadata {
  return {
    lineNumbers: false,
    highlightedLines: new Set<number>(),
    diffLines: {
      added: new Set<number>(),
      removed: new Set<number>(),
    },
    focusLines: new Set<number>(),
    lineClasses: new Map<number, string[]>(),
    lineStyles: new Map<number, Record<string, string>>(),
  };
}

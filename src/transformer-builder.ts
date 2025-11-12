import type { ShikiTransformer } from 'shiki';
import type { Element } from 'hast';
import type { HighlightOptions } from './index';
import { parseLineNumbers } from './line-parser';

/**
 * Builds an array of Shiki transformers from convenience options.
 * Combines user-provided transformers with generated ones.
 */
export function buildTransformers(options: HighlightOptions): ShikiTransformer[] {
  const transformers: ShikiTransformer[] = [];

  // Start with user-provided transformers
  if (options.transformers && options.transformers.length > 0) {
    transformers.push(...options.transformers);
  }

  // Build transformer for line numbers
  if (options.lineNumbers) {
    transformers.push(createLineNumberTransformer(options.lineNumbers));
  }

  // Build transformer for highlighted lines
  if (options.highlightLines) {
    const lines =
      typeof options.highlightLines === 'string'
        ? parseLineNumbers(options.highlightLines)
        : new Set(options.highlightLines);
    transformers.push(createHighlightLinesTransformer(lines));
  }

  // Build transformer for diff lines
  if (options.diffLines) {
    transformers.push(createDiffLinesTransformer(options.diffLines));
  }

  // Build transformer for focus lines
  if (options.focusLines && options.focusLines.length > 0) {
    transformers.push(createFocusLinesTransformer(new Set(options.focusLines)));
  }

  return transformers;
}

/**
 * Creates a transformer that adds line number metadata to line elements.
 */
function createLineNumberTransformer(config: boolean | { start?: number }): ShikiTransformer {
  const start = typeof config === 'object' ? config.start || 1 : 1;

  return {
    name: 'highlight-api-line-numbers',
    line(node: Element, line: number) {
      node.properties = node.properties || {};
      node.properties['data-line'] = line;
      node.properties['data-line-number'] = start + line - 1;
      const classes = Array.isArray(node.properties.class) ? node.properties.class : [];
      if (!classes.includes('line')) {
        classes.push('line');
      }
      if (!classes.includes('line-numbered')) {
        classes.push('line-numbered');
      }
      node.properties.class = classes;
    },
  };
}

/**
 * Creates a transformer that adds 'highlighted' class to specified lines.
 */
function createHighlightLinesTransformer(lines: Set<number>): ShikiTransformer {
  return {
    name: 'highlight-api-highlight-lines',
    line(node: Element, line: number) {
      node.properties = node.properties || {};
      node.properties['data-line'] = line;
      const classes = Array.isArray(node.properties.class) ? node.properties.class : [];
      if (!classes.includes('line')) {
        classes.push('line');
      }
      if (lines.has(line)) {
        if (!classes.includes('highlighted')) {
          classes.push('highlighted');
        }
      }
      node.properties.class = classes;
    },
  };
}

/**
 * Creates a transformer that adds diff classes to specified lines.
 */
function createDiffLinesTransformer(config: {
  added?: number[];
  removed?: number[];
}): ShikiTransformer {
  const added = new Set(config.added || []);
  const removed = new Set(config.removed || []);

  return {
    name: 'highlight-api-diff-lines',
    line(node: Element, line: number) {
      node.properties = node.properties || {};
      node.properties['data-line'] = line;
      const classes = Array.isArray(node.properties.class) ? node.properties.class : [];

      if (!classes.includes('line')) {
        classes.push('line');
      }

      if (added.has(line) || removed.has(line)) {
        if (!classes.includes('diff')) {
          classes.push('diff');
        }

        if (added.has(line) && !classes.includes('add')) {
          classes.push('add');
        }

        if (removed.has(line) && !classes.includes('remove')) {
          classes.push('remove');
        }
      }

      node.properties.class = classes;
    },
  };
}

/**
 * Creates a transformer that adds 'focused' class to specified lines.
 */
function createFocusLinesTransformer(lines: Set<number>): ShikiTransformer {
  return {
    name: 'highlight-api-focus-lines',
    line(node: Element, line: number) {
      node.properties = node.properties || {};
      node.properties['data-line'] = line;
      const classes = Array.isArray(node.properties.class) ? node.properties.class : [];
      if (!classes.includes('line')) {
        classes.push('line');
      }
      if (lines.has(line)) {
        if (!classes.includes('focused')) {
          classes.push('focused');
        }
      }
      node.properties.class = classes;
    },
  };
}

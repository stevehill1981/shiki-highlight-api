import { describe, it, expect, beforeEach, vi } from 'vitest';
import { codeToHighlightHtml } from '../src/index';

describe('Singleton Highlighter - Concurrency Safety', () => {
  beforeEach(() => {
    // Clear any console warnings captured during tests
    vi.clearAllMocks();
  });

  it('prevents duplicate highlighter instances with concurrent calls', async () => {
    // Simulate parallel build scenario (like Astro processing 220+ pages)
    const code = 'const x = 42;';
    const concurrentCalls = 50;

    // Spy on console to catch Shiki warnings
    const consoleWarnSpy = vi.spyOn(console, 'warn');

    // Create 50 parallel calls to codeToHighlightHtml
    const promises = Array.from({ length: concurrentCalls }, (_, i) =>
      codeToHighlightHtml(code, {
        lang: 'javascript',
        theme: 'dark-plus',
        blockId: `concurrent-test-${i}`,
      })
    );

    // Wait for all to complete
    const results = await Promise.all(promises);

    // Verify all completed successfully
    expect(results).toHaveLength(concurrentCalls);
    results.forEach((result) => {
      expect(result.html).toContain('const x = 42;');
      expect(result.css).toContain('::highlight(');
      expect(result.script).toContain('CSS.highlights.set');
    });

    // Critical: Verify no Shiki instance warnings
    const shikiWarnings = consoleWarnSpy.mock.calls.filter((call) =>
      call.some((arg) => String(arg).includes('instances have been created'))
    );

    expect(shikiWarnings).toHaveLength(0);

    consoleWarnSpy.mockRestore();
  });

  it('handles mixed concurrent calls to different functions', async () => {
    const code = 'const x = 42;';
    const consoleWarnSpy = vi.spyOn(console, 'warn');

    // Mix of codeToHighlightHtml calls with different languages (both pre-loaded)
    const promises = [
      ...Array.from({ length: 20 }, (_, i) =>
        codeToHighlightHtml(code, {
          lang: 'javascript',
          theme: 'dark-plus',
          blockId: `mixed-test-js-${i}`,
        })
      ),
      ...Array.from({ length: 10 }, (_, i) =>
        codeToHighlightHtml('const x: number = 42;', {
          lang: 'typescript',
          theme: 'dark-plus',
          blockId: `mixed-test-ts-${i}`,
        })
      ),
    ];

    await Promise.all(promises);

    // Verify no duplicate instance warnings
    const shikiWarnings = consoleWarnSpy.mock.calls.filter((call) =>
      call.some((arg) => String(arg).includes('instances have been created'))
    );

    expect(shikiWarnings).toHaveLength(0);

    consoleWarnSpy.mockRestore();
  });

  it('sequential calls also work correctly', async () => {
    const code = 'const x = 42;';

    // Sequential calls should also work
    for (let i = 0; i < 10; i++) {
      const result = await codeToHighlightHtml(code, {
        lang: 'javascript',
        theme: 'dark-plus',
        blockId: `sequential-test-${i}`,
      });

      expect(result.html).toContain('const x = 42;');
    }

    // No errors expected
  });

  it('handles race condition at initialization', async () => {
    // This test specifically targets the race condition where multiple
    // async calls start before any complete
    const consoleWarnSpy = vi.spyOn(console, 'warn');

    // Fire 100 calls simultaneously without waiting
    const promises = Array.from({ length: 100 }, (_, i) =>
      codeToHighlightHtml('test', {
        lang: 'javascript',
        blockId: `race-test-${i}`,
      })
    );

    const results = await Promise.all(promises);

    // All should succeed
    expect(results).toHaveLength(100);

    // No instance warnings
    const shikiWarnings = consoleWarnSpy.mock.calls.filter((call) =>
      call.some((arg) => String(arg).includes('instances have been created'))
    );

    expect(shikiWarnings).toHaveLength(0);

    consoleWarnSpy.mockRestore();
  });
});

import { test, expect } from '@playwright/test';
import { codeToHighlightHtml } from '../../src/index';

test.describe('Range creation in browser', () => {
  test('creates highlights without errors with line numbers', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const code = 'const x = 1;\nconst y = 2;\nconst z = 3;';
    const result = await codeToHighlightHtml(code, {
      lang: 'javascript',
      blockId: 'test-line-numbers',
      lineNumbers: true,
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  ${result.css}
</head>
<body>
  ${result.html}
  ${result.script}
</body>
</html>`;

    await page.setContent(html);

    // Wait for script execution
    await page.waitForTimeout(100);

    // Check for Range creation errors
    const rangeErrors = consoleErrors.filter((msg) =>
      msg.includes('Range creation failed')
    );
    expect(rangeErrors).toHaveLength(0);

    // Verify highlights were created
    const highlightCount = await page.evaluate(() => {
      return CSS.highlights.size;
    });
    expect(highlightCount).toBeGreaterThan(0);
  });

  test('creates highlights without errors with diff markers', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const code = 'const x = 1;\nconst y = 2;\nconst z = 3;';
    const result = await codeToHighlightHtml(code, {
      lang: 'javascript',
      blockId: 'test-diff',
      diffLines: {
        added: [1, 2],
        removed: [3],
      },
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  ${result.css}
</head>
<body>
  ${result.html}
  ${result.script}
</body>
</html>`;

    await page.setContent(html);
    await page.waitForTimeout(100);

    const rangeErrors = consoleErrors.filter((msg) =>
      msg.includes('Range creation failed')
    );
    expect(rangeErrors).toHaveLength(0);

    const highlightCount = await page.evaluate(() => {
      return CSS.highlights.size;
    });
    expect(highlightCount).toBeGreaterThan(0);
  });

  test('creates highlights without errors with line numbers AND diff markers', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const code = 'const x = 1;\nconst y = 2;\nconst z = 3;';
    const result = await codeToHighlightHtml(code, {
      lang: 'javascript',
      blockId: 'test-combined',
      lineNumbers: { start: 10 },
      diffLines: {
        added: [1],
        removed: [3],
      },
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  ${result.css}
</head>
<body>
  ${result.html}
  ${result.script}
</body>
</html>`;

    await page.setContent(html);
    await page.waitForTimeout(100);

    // This combination would have caught the bug - line numbers + diff markers
    // means firstChild was definitely wrong
    const rangeErrors = consoleErrors.filter((msg) =>
      msg.includes('Range creation failed')
    );
    expect(rangeErrors).toHaveLength(0);

    const highlightCount = await page.evaluate(() => {
      return CSS.highlights.size;
    });
    expect(highlightCount).toBeGreaterThan(0);
  });

  test('verifies .line-content is used for ranges', async ({ page }) => {
    const code = 'const x = 1;';
    const result = await codeToHighlightHtml(code, {
      lang: 'javascript',
      blockId: 'test-structure',
      lineNumbers: true,
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  ${result.css}
</head>
<body>
  ${result.html}
  ${result.script}
</body>
</html>`;

    await page.setContent(html);

    // Verify HTML structure
    const hasLineContent = await page.evaluate(() => {
      const lineElement = document.querySelector('[id*="-L0"]');
      return lineElement?.querySelector('.line-content') !== null;
    });
    expect(hasLineContent).toBe(true);

    // Verify line-content contains the code text
    const lineContentText = await page.evaluate(() => {
      const lineContent = document.querySelector('.line-content');
      return lineContent?.textContent;
    });
    expect(lineContentText).toContain('const x = 1;');
  });
});

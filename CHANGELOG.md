# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2025-11-13

### Fixed

- **Critical**: Fixed race condition causing duplicate highlighter instances during parallel builds
  - Singleton pattern now uses promise caching to prevent concurrent instance creation
  - Resolves Shiki warnings "N instances have been created" during parallel builds
  - Particularly important for documentation sites with 100+ pages built in parallel
  - Issue: shiki-highlights/remark-shiki-highlight-api#23

### Added

- **Concurrency Tests**: Added comprehensive test suite for singleton behavior
  - Tests verify single instance creation with 50-100 concurrent calls
  - Prevents future regression of singleton pattern

### Technical Details

- Added `highlighterPromise` cache alongside `highlighterInstance`
- Multiple simultaneous calls now wait for the same promise instead of creating duplicates
- Zero breaking changes - purely internal implementation fix

## [1.0.3] - 2025-01-12

### Fixed

- **Improved Range Validation**: Added defensive checks to prevent Range creation failures
  - Validates text node exists and is correct type before creating Range
  - Checks that range indices don't overflow text content length
  - Enhanced error messages with line numbers and range details for debugging

### Technical Details

- Added text node type validation (nodeType === 3)
- Added range bounds checking against actual text content length
- Improved error logging with contextual information

## [1.0.1] - 2025-01-12

### Fixed

- **Critical**: Fixed Range creation errors when line numbers or diff markers are present
  - Script now correctly finds `.line-content` element instead of using `firstChild`
  - Resolves "IndexSizeError: The index is not in the allowed range" errors
  - Affects code blocks with `lineNumbers` or `diffLines` options

### Added

- **Browser Testing**: Playwright-based browser tests for JavaScript execution
  - Tests verify Range creation with line numbers and diff markers
  - Would have caught this bug before release
  - Complements existing 135 unit tests with 4 browser tests

### Technical Details

- Updated JavaScript to query for `.line-content` element before creating Range objects
- Ensures highlight ranges are applied to the correct text node containing code
- Added Playwright test infrastructure for future browser-specific testing

## [1.0.0] - 2025-01-12

### Added

- **Shiki v3 Transformer Support**: Full integration with Shiki's transformer ecosystem
- **Line Numbers**: Enable line numbers with `lineNumbers: true` or custom start with `lineNumbers: { start: 10 }`
- **Line Highlighting**: Highlight specific lines using array syntax `[1,3,5]` or string syntax `'1,3,5-7'`
- **Diff Lines**: Show code diffs with `diffLines: { added: [2,3], removed: [5] }`
- **Focus Lines**: Focus specific lines while blurring others with `focusLines: [1,2,3]`
- **Custom Transformers**: Support for user-provided Shiki transformers via `transformers` option
- **Metadata Extraction**: Automatic extraction of semantic information from HAST trees
- **Line Parser**: Parse line number ranges like "1,3,5-7" into Sets
- **Comprehensive Documentation**: Complete README with transformer examples and API reference

### Changed

- **HTML Structure**: Updated to include `line-content` wrapper for better transformer support
- **Class Application**: Classes from transformers now properly applied to final HTML output
- **CSS Generation**: Enhanced to support line-level styles from metadata

### Technical Details

- Added dependencies: `unist-util-visit@^5.0.0`, `hast-util-to-string@^3.0.0`
- Added dev dependencies: `@types/hast@^3.0.4`, `@types/unist@^3.0.3`
- New modules: `metadata.ts`, `metadata-extraction.ts`, `line-parser.ts`, `transformer-builder.ts`
- Test coverage: 98.71% (135 tests passing)
- Zero breaking changes for existing users (all new features are opt-in)

### Performance

- **Fast Path Preserved**: Code without transformers continues using optimized fast path
- **No Performance Penalty**: Transformer processing only when features are enabled
- **Graceful Fallback**: Errors in transformer processing fall back to basic highlighting

## [0.1.0] - Previous Release

Initial release with CSS Custom Highlight API support.

[1.0.0]: https://github.com/shiki-highlights/shiki-highlight-api/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/shiki-highlights/shiki-highlight-api/releases/tag/v0.1.0

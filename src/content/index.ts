/**
 * Intentional stub — content script logic was moved to src/contents/ado.ts.
 *
 * Plasmo only recognises content scripts at:
 *   src/content.ts          (single script, file at root)
 *   src/contents/<name>.ts  (multiple scripts directory)
 *
 * src/content/index.ts (a directory named "content") is NOT detected by Plasmo,
 * which is why no content_scripts entry appeared in the previous build manifest.
 *
 * The helper modules in this directory are still active — imported by src/contents/ado.ts:
 *   - src/content/detector.ts   (re-exports ADO detection helpers)
 *   - src/content/extractor.ts  (re-exports story extraction)
 *   - src/content/toolbar.ts    (toolbar button injection)
 */
export {}

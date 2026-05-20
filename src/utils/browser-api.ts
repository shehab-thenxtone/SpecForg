// Firefox exposes `browser.*`; Chrome exposes only `chrome.*`.
// This wrapper lets the rest of the codebase use a single import.
declare const browser: typeof chrome | undefined

export const browserAPI: typeof chrome =
  typeof browser !== 'undefined' ? (browser as typeof chrome) : chrome

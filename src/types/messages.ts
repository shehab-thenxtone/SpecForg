import type { UserStory } from './user-story'

export type Message =
  // ── Content script → runtime ──────────────────────────────────────────────
  /** Content script detected a supported work-item page. */
  | { type: 'WORK_ITEM_DETECTED'; payload: { workItemType: string } }
  /** Content script left a work-item page (navigation away). */
  | { type: 'WORK_ITEM_LEFT' }
  /** Opens the side panel. Popup sends tabId + autoStart; content script relies on sender.tab. */
  | { type: 'OPEN_SIDE_PANEL'; payload?: { tabId?: number; autoStart?: boolean } }
  // ── Side panel → content script (state query) ─────────────────────────────
  /** Side panel asks the content script for the current work-item type on mount. */
  | { type: 'QUERY_WORK_ITEM' }
  /** Content script reply to QUERY_WORK_ITEM. */
  | { type: 'WORK_ITEM_STATE'; payload: { workItemType: string | null } }
  // ── Extraction ────────────────────────────────────────────────────────────
  | { type: 'EXTRACT_STORY' }
  | { type: 'STORY_EXTRACTED'; payload: UserStory }
  // ── Skill-based generation flow ───────────────────────────────────────────
  /** Side panel → background: open Claude.ai with the ado-test-case-creator skill. */
  | { type: 'OPEN_CLAUDE_WITH_SKILL'; payload: UserStory }
  /** Background → side panel: Claude.ai tab was opened, skill invocation ready. */
  | { type: 'CLAUDE_TAB_OPENED' }
  // ── Errors ────────────────────────────────────────────────────────────────
  | { type: 'ERROR'; payload: { code: string; message: string } }

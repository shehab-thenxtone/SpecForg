// Single source of truth for all ADO DOM selectors.
// Update here when ADO changes its markup — no hunting across files.
export const ADO_SELECTORS = {
  // Work item detection
  WORK_ITEM_TYPE_BADGE: '[aria-label="Work item type"]',

  // Shared form fields (extraction + injection)
  TITLE_FIELD: '[aria-label="Title field"]',
  DESCRIPTION: '[aria-label="Description"]',
  ACCEPTANCE_CRITERIA: '[aria-label="Acceptance Criteria"]',
  PRIORITY: '[aria-label="Priority"]',
  TAGS_INPUT: '[aria-label="Tags"]',
  TAGS_CHIPS: '[aria-label="Tags"] .tag-item',
  AREA_PATH: '[aria-label="Area Path"]',
  ITERATION_PATH: '[aria-label="Iteration Path"]',
  WORK_ITEM_ID: '[aria-label="Work item ID"]',

  // Injection actions
  SAVE_WORK_ITEM: '[aria-label="Save work item"]',
  CONFIRM_SAVED: '[aria-label*="Work item"]',
  ADD_LINK: '[aria-label="Add link"]',
  LINK_DIALOG_TYPE: '[aria-label="Link type"]',
  LINK_DIALOG_OK: '[aria-label="OK"]',

  // Links panel (extraction)
  LINK_ROW: '.links-control-link-list .workitem-link-row',
  LINK_ID_CELL: '[aria-label="Link ID"]',
  LINK_TYPE_CELL: '[aria-label="Link Type"]',
  LINK_TITLE_CELL: '[aria-label="Link Title"]',
  LINK_RELATIONSHIP_CELL: '[aria-label="Link Relationship"]',

  // Rich content
  RICH_TEXT: '.rich-text-content',
  COMMENT: '.discussion-item .comment-body',

  // Test steps grid
  STEPS_GRID: '[aria-label="Test steps"]',
  STEP_ROW: '[role="row"]',
  GRID_CELL: '[role="gridcell"]',

  // Toolbar
  TOOLBAR_ROLE: '[role="toolbar"]',
  TOOLBAR_ARIA: '[aria-label="Toolbar"]',
  TOOLBAR_ACTIONS: '[aria-label="work item actions toolbar"]',
} as const

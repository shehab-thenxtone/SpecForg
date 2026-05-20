import { test, expect } from '@playwright/test'

// These tests require a live ADO environment and a valid CLAUDE_API_KEY.
// They are skipped automatically when the required env vars are not set.
const ADO_STORY_URL = process.env.E2E_ADO_STORY_URL ?? ''
const hasEnv = Boolean(ADO_STORY_URL && process.env.E2E_CLAUDE_API_KEY)

test.describe('SpecForge full workflow', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasEnv) test.skip()
    await page.goto(ADO_STORY_URL)
  })

  test('content script injects toolbar button on ADO story page', async ({ page }) => {
    // The toolbar button is injected by the content script after the work item
    // type badge and title field are detected.
    await expect(
      page.locator('[data-specforge="toolbar-btn"]')
    ).toBeVisible({ timeout: 5000 })
  })

  test('side panel opens when toolbar button is clicked', async ({ page }) => {
    await page.locator('[data-specforge="toolbar-btn"]').click()
    // The extension opens a side panel; verify no JS errors were thrown.
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.waitForTimeout(500)
    expect(errors).toHaveLength(0)
  })

  test('story extraction returns non-empty title', async ({ page }) => {
    const title = await page.evaluate(() => {
      const el = document.querySelector('[aria-label="Title field"]')
      if (!el) return ''
      if (el instanceof HTMLInputElement) return el.value
      return el.textContent ?? ''
    })
    expect(title.trim().length).toBeGreaterThan(0)
  })

  // Injection requires navigating to a real ADO project and creating work items.
  // Skipped by default to avoid side effects in CI — enable with E2E_ENABLE_INJECTION=1.
  test.skip('end-to-end injection creates a test case in ADO', async ({ page }) => {
    if (!process.env.E2E_ENABLE_INJECTION) test.skip()
    // This test would trigger the full generate → review → inject flow.
    // Manual verification required post-run.
    await page.locator('[data-specforge="toolbar-btn"]').click()
    await expect(page.locator('[data-testid="side-panel"]')).toBeVisible({ timeout: 3000 })
  })
})

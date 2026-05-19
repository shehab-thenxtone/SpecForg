import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { extractFullStory } from '../../src/services/ado/extractor'

function buildDom({
  titleValue = 'My User Story',
  titleTag = 'input',
  description = '<p>Desc</p>',
  ac = '<ul><li>Given something</li></ul>',
  priority = '',
  tags = [] as string[],
  areaPath = '',
  iteration = '',
  comments = [] as string[],
  links = [] as Array<{ id: string; type: string; title: string; rel: string }>,
} = {}) {
  const titleEl =
    titleTag === 'input'
      ? `<input aria-label="Title field" value="${titleValue}" />`
      : `<div aria-label="Title field">${titleValue}</div>`

  const tagChips = tags.map(t => `<span class="tag-item">${t}</span>`).join('')
  const commentItems = comments
    .map(c => `<div class="discussion-item"><div class="comment-body">${c}</div></div>`)
    .join('')
  const linkRows = links
    .map(
      l => `
      <div class="workitem-link-row">
        <span aria-label="Link ID">${l.id}</span>
        <span aria-label="Link Type">${l.type}</span>
        <span aria-label="Link Title">${l.title}</span>
        <span aria-label="Link Relationship">${l.rel}</span>
      </div>`
    )
    .join('')

  document.body.innerHTML = `
    ${titleEl}
    <span aria-label="Work item ID">42</span>
    <div aria-label="Description"><div class="rich-text-content">${description}</div></div>
    <div aria-label="Acceptance Criteria"><div class="rich-text-content">${ac}</div></div>
    ${priority ? `<div aria-label="Priority">${priority}</div>` : ''}
    <div aria-label="Tags">${tagChips}</div>
    ${areaPath ? `<div aria-label="Area Path">${areaPath}</div>` : ''}
    ${iteration ? `<div aria-label="Iteration Path">${iteration}</div>` : ''}
    ${commentItems}
    <div class="links-control-link-list">${linkRows}</div>
  `
}

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('extractFullStory', () => {
  it('extracts required fields from a fully-loaded work item', async () => {
    buildDom({ titleValue: 'Login flow', description: '<p>Users should log in</p>', ac: '<p>Given logged out</p>' })
    const story = await extractFullStory()
    expect(story.id).toBe('42')
    expect(story.title).toBe('Login flow')
    expect(story.description).toContain('Users should log in')
    expect(story.acceptanceCriteria).toContain('Given logged out')
  })

  it('returns empty tags array when no tags present', async () => {
    buildDom({ tags: [] })
    const story = await extractFullStory()
    expect(story.tags).toEqual([])
  })

  it('extracts tags when present', async () => {
    buildDom({ tags: ['authentication', 'login'] })
    const story = await extractFullStory()
    expect(story.tags).toEqual(['authentication', 'login'])
  })

  it('extracts priority when present', async () => {
    buildDom({ priority: 'High' })
    const story = await extractFullStory()
    expect(story.priority).toBe('High')
  })

  it('omits priority when not present', async () => {
    buildDom({ priority: '' })
    const story = await extractFullStory()
    expect(story.priority).toBeUndefined()
  })

  it('ignores invalid priority values', async () => {
    buildDom({ priority: 'Urgent' })
    const story = await extractFullStory()
    expect(story.priority).toBeUndefined()
  })

  it('extracts areaPath and iteration when present', async () => {
    buildDom({ areaPath: 'MyOrg\\TeamA', iteration: 'Sprint 3' })
    const story = await extractFullStory()
    expect(story.areaPath).toBe('MyOrg\\TeamA')
    expect(story.iteration).toBe('Sprint 3')
  })

  it('omits areaPath and iteration when absent', async () => {
    buildDom({})
    const story = await extractFullStory()
    expect(story.areaPath).toBeUndefined()
    expect(story.iteration).toBeUndefined()
  })

  it('extracts comments when present', async () => {
    buildDom({ comments: ['Good point', 'Agreed'] })
    const story = await extractFullStory()
    expect(story.comments).toEqual(['Good point', 'Agreed'])
  })

  it('omits comments field when no comments present', async () => {
    buildDom({ comments: [] })
    const story = await extractFullStory()
    expect(story.comments).toBeUndefined()
  })

  it('extracts linked work items', async () => {
    buildDom({
      links: [{ id: '99', type: 'Feature', title: 'Parent Feature', rel: 'Parent' }],
    })
    const story = await extractFullStory()
    expect(story.linkedWorkItems).toHaveLength(1)
    expect(story.linkedWorkItems![0]).toMatchObject({
      id: '99',
      type: 'Feature',
      title: 'Parent Feature',
      relationship: 'Parent',
    })
  })

  it('extracts existing test cases from linked items with type Test Case', async () => {
    buildDom({
      links: [
        { id: '10', type: 'Test Case', title: 'Verify login', rel: 'Tests' },
        { id: '11', type: 'Feature', title: 'Other', rel: 'Parent' },
      ],
    })
    const story = await extractFullStory()
    expect(story.existingTestCases).toEqual(['Verify login'])
  })

  it('throws ExtractionError if title remains empty after wait', async () => {
    document.body.innerHTML = `
      <input aria-label="Title field" value="" />
      <div aria-label="Description"><div class="rich-text-content"></div></div>
      <div aria-label="Acceptance Criteria"><div class="rich-text-content"></div></div>
    `
    await expect(extractFullStory()).rejects.toThrow('ExtractionError')
  }, 10000)

  it('handles missing description and AC gracefully', async () => {
    document.body.innerHTML = `<input aria-label="Title field" value="Only Title" />`
    const story = await extractFullStory()
    expect(story.title).toBe('Only Title')
    expect(story.description).toBe('')
    expect(story.acceptanceCriteria).toBe('')
  })

  it('sanitizes HTML in description', async () => {
    buildDom({ description: '<p>Clean <script>alert(1)</script> text</p>' })
    const story = await extractFullStory()
    expect(story.description).not.toContain('<script>')
    expect(story.description).toContain('Clean')
  })
})

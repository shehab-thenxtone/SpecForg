export interface LinkedWorkItem {
  id: string
  type: string
  title: string
  relationship: string
}

export interface UserStory {
  id: string
  url: string
  title: string
  description: string
  acceptanceCriteria: string
  priority?: 'Critical' | 'High' | 'Medium' | 'Low'
  tags: string[]
  areaPath?: string
  iteration?: string
  comments?: string[]
  linkedWorkItems?: LinkedWorkItem[]
  existingTestCases?: string[]
}

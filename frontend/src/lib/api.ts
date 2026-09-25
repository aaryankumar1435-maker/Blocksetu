import type { BlockSection, Comment, Defect, PlanVersion, RePlanTrigger, ScheduledBlock, Task } from '../types'

export interface PlanCurrent {
  version: PlanVersion
  safetyWeight: number
  approved: boolean
  published: boolean
}

export interface ReviewState {
  approved: boolean
  published: boolean
}

// Relative URL: Vite's dev server proxies /api to the backend (vite.config.ts).
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new Error('Cannot reach the BlockSetu API.')
  }
  const body = (await res.json().catch(() => undefined)) as { error?: string } | undefined
  if (!res.ok) {
    throw new Error(body?.error ?? (res.status >= 500 ? 'The BlockSetu API is not responding.' : `Request failed (${res.status}).`))
  }
  return body as T
}

const json = (method: string, data?: unknown): RequestInit => ({
  method,
  body: data === undefined ? undefined : JSON.stringify(data),
})

export const api = {
  sections: () => request<BlockSection[]>('/sections'),
  defects: () => request<Defect[]>('/defects'),
  tasks: () => request<Task[]>('/tasks'),
  blocks: () => request<ScheduledBlock[]>('/blocks'),
  rePlanTriggers: () => request<RePlanTrigger[]>('/replan-triggers'),
  planVersions: () => request<PlanVersion[]>('/plan/versions'),
  planCurrent: () => request<PlanCurrent>('/plan/current'),
  comments: () => request<Comment[]>('/comments'),

  addComment: (author: string, text: string) => request<Comment>('/comments', json('POST', { author, text })),
  setSafetyWeight: (safetyWeight: number) => request<{ safetyWeight: number }>('/plan/safety-weight', json('PATCH', { safetyWeight })),
  resolve: (safetyWeight: number) => request<PlanVersion>('/plan/resolve', json('POST', { safetyWeight })),
  approve: () => request<ReviewState>('/plan/approve', json('POST')),
  publish: () => request<ReviewState>('/plan/publish', json('POST')),
  togglePin: (id: string) => request<ScheduledBlock>(`/blocks/${encodeURIComponent(id)}/pin`, json('PATCH')),
  moveBlock: (id: string, startTime: string, endTime: string) =>
    request<ScheduledBlock>(`/blocks/${encodeURIComponent(id)}/move`, json('PATCH', { startTime, endTime })),
}

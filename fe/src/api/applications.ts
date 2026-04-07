import { apiRequest } from './client'
import type { ApplicationStatus } from '../kanban/types'

export type Application = {
  id: string
  company: string
  role: string
  jdLink?: string
  notes?: string
  dateApplied: string
  status: ApplicationStatus
  salaryRange?: string
}

export type ListApplicationsResponse = {
  applications: Application[]
}

export type GetApplicationResponse = {
  application: Application
}

export type CreateApplicationInput = {
  company: string
  role: string
  jdLink?: string
  notes?: string
  dateApplied: string
  status: ApplicationStatus
  salaryRange?: string
}

export type CreateApplicationResponse = {
  application: Application
}

export type UpdateApplicationInput = Partial<CreateApplicationInput>

export type UpdateApplicationResponse = {
  application: Application
}

export function listApplications(): Promise<ListApplicationsResponse> {
  return apiRequest<ListApplicationsResponse>('/applications', { method: 'GET' })
}

export function getApplication(id: string): Promise<GetApplicationResponse> {
  return apiRequest<GetApplicationResponse>(`/applications/${encodeURIComponent(id)}`, {
    method: 'GET',
  })
}

export function createApplication(
  input: CreateApplicationInput,
): Promise<CreateApplicationResponse> {
  return apiRequest<CreateApplicationResponse>('/applications', {
    method: 'POST',
    json: input,
  })
}

export function updateApplication(
  id: string,
  input: UpdateApplicationInput,
): Promise<UpdateApplicationResponse> {
  return apiRequest<UpdateApplicationResponse>(`/applications/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    json: input,
  })
}

export async function deleteApplication(id: string): Promise<void> {
  await apiRequest<unknown>(`/applications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

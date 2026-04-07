import { apiRequest } from './client'

export type ParsedJobDescription = {
  company: string | null
  role: string | null
  requiredSkills: string[]
  niceToHaveSkills: string[]
  seniority: string | null
  location: string | null
}

export type ParseJobDescriptionResponse = {
  parsed: ParsedJobDescription
}

export function parseJobDescription(jobDescription: string): Promise<ParseJobDescriptionResponse> {
  return apiRequest<ParseJobDescriptionResponse>('/ai/parse-jd', {
    method: 'POST',
    json: { jobDescription },
  })
}

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

export type ResumeSuggestionsResponse = {
  bullets: string[]
}

export function parseJobDescription(jobDescription: string): Promise<ParseJobDescriptionResponse> {
  return apiRequest<ParseJobDescriptionResponse>('/ai/parse-jd', {
    method: 'POST',
    json: { jobDescription },
  })
}

export function getResumeSuggestions(
  jobDescription: string,
  parsed?: ParsedJobDescription,
): Promise<ResumeSuggestionsResponse> {
  return apiRequest<ResumeSuggestionsResponse>('/ai/resume-suggestions', {
    method: 'POST',
    json: { jobDescription, parsed },
  })
}

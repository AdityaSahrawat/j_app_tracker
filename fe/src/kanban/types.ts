export const STATUSES = [
  'applied',
  'phone_screen',
  'interview',
  'offer',
  'rejected',
] as const

export type ApplicationStatus = (typeof STATUSES)[number]

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  phone_screen: 'Phone Screen',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

export type ApplicationCard = {
  id: string
  company: string
  role: string
  dateApplied: string
}

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (STATUSES as readonly string[]).includes(value)
}

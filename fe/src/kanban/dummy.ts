import type { ApplicationCard, ApplicationStatus } from './types'

export const DUMMY_CARDS: Record<string, ApplicationCard> = {
  app_1: {
    id: 'app_1',
    company: 'Acme Corp',
    role: 'Frontend Engineer',
    dateApplied: '2026-04-01',
  },
  app_2: {
    id: 'app_2',
    company: 'Globex',
    role: 'Full Stack Developer',
    dateApplied: '2026-04-03',
  },
  app_3: {
    id: 'app_3',
    company: 'Initech',
    role: 'Software Engineer',
    dateApplied: '2026-03-28',
  },
  app_4: {
    id: 'app_4',
    company: 'Umbrella',
    role: 'Backend Engineer',
    dateApplied: '2026-04-05',
  },
  app_5: {
    id: 'app_5',
    company: 'Stark Industries',
    role: 'Platform Engineer',
    dateApplied: '2026-04-06',
  },
}

export const DUMMY_COLUMNS: Record<ApplicationStatus, string[]> = {
  applied: ['app_1', 'app_2'],
  phone_screen: ['app_3'],
  interview: ['app_4'],
  offer: [],
  rejected: ['app_5'],
}

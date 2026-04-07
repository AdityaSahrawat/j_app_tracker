import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createApplication,
  deleteApplication,
  listApplications,
  updateApplication,
  type Application,
} from '../api/applications'
import { KanbanBoard, type KanbanApplication } from '../kanban/KanbanBoard'
import { STATUSES, STATUS_LABEL, type ApplicationStatus } from '../kanban/types'

type ApplicationFormState = {
  company: string
  role: string
  jdLink: string
  notes: string
  dateApplied: string
  status: ApplicationStatus
  salaryRange: string
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function toTrimmed(value: string): string {
  return value.trim()
}

function toOptionalTrimmed(value: string): string | undefined {
  const t = value.trim()
  return t ? t : undefined
}

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function buildFormFromApplication(app: Application): ApplicationFormState {
  return {
    company: app.company,
    role: app.role,
    jdLink: app.jdLink ?? '',
    notes: app.notes ?? '',
    dateApplied: app.dateApplied,
    status: app.status,
    salaryRange: app.salaryRange ?? '',
  }
}

export default function HomePage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState<ApplicationFormState>(() => ({
    company: '',
    role: '',
    jdLink: '',
    notes: '',
    dateApplied: todayIsoDate(),
    status: 'applied',
    salaryRange: '',
  }))
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedApplication = useMemo(
    () => applications.find((a) => a.id === selectedId) ?? null,
    [applications, selectedId],
  )

  const [editForm, setEditForm] = useState<ApplicationFormState | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await listApplications()
      setApplications(res.applications)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load applications'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!selectedId) {
      setEditForm(null)
      setEditError(null)
      return
    }

    if (!selectedApplication) {
      setSelectedId(null)
      setEditForm(null)
      setEditError(null)
      return
    }

    setEditForm(buildFormFromApplication(selectedApplication))
    setEditError(null)
  }, [selectedApplication, selectedId])

  const boardApps: KanbanApplication[] = useMemo(
    () =>
      applications.map((a) => ({
        id: a.id,
        company: a.company,
        role: a.role,
        dateApplied: a.dateApplied,
        status: a.status,
      })),
    [applications],
  )

  const onMoveCard = async (id: string, toStatus: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: toStatus } : a)),
    )

    try {
      await updateApplication(id, { status: toStatus })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status'
      setError(message)
      await load()
    }
  }

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    setCreateError(null)

    const company = toTrimmed(createForm.company)
    const role = toTrimmed(createForm.role)

    if (!company) {
      setCreateError('Company is required')
      return
    }

    if (!role) {
      setCreateError('Role is required')
      return
    }

    if (!isValidIsoDate(createForm.dateApplied)) {
      setCreateError('Date applied is invalid')
      return
    }

    setIsCreating(true)

    try {
      const res = await createApplication({
        company,
        role,
        dateApplied: createForm.dateApplied,
        status: createForm.status,
        jdLink: toOptionalTrimmed(createForm.jdLink),
        notes: toOptionalTrimmed(createForm.notes),
        salaryRange: toOptionalTrimmed(createForm.salaryRange),
      })

      setCreateForm({
        company: '',
        role: '',
        jdLink: '',
        notes: '',
        dateApplied: todayIsoDate(),
        status: 'applied',
        salaryRange: '',
      })

      setSelectedId(res.application.id)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create application'
      setCreateError(message)
    } finally {
      setIsCreating(false)
    }
  }

  const onSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedApplication || !editForm) return

    setEditError(null)

    const company = toTrimmed(editForm.company)
    const role = toTrimmed(editForm.role)

    if (!company) {
      setEditError('Company is required')
      return
    }

    if (!role) {
      setEditError('Role is required')
      return
    }

    if (!isValidIsoDate(editForm.dateApplied)) {
      setEditError('Date applied is invalid')
      return
    }

    setIsSaving(true)

    try {
      await updateApplication(selectedApplication.id, {
        company,
        role,
        dateApplied: editForm.dateApplied,
        status: editForm.status,
        jdLink: toOptionalTrimmed(editForm.jdLink),
        notes: toOptionalTrimmed(editForm.notes),
        salaryRange: toOptionalTrimmed(editForm.salaryRange),
      })

      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update application'
      setEditError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const onDelete = async () => {
    if (!selectedApplication) return
    const ok = window.confirm('Delete this application?')
    if (!ok) return

    setEditError(null)
    setIsDeleting(true)

    try {
      await deleteApplication(selectedApplication.id)
      setSelectedId(null)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete application'
      setEditError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="flex-1 px-4 py-6 text-left">
      <header className="mb-6">
        <h1 className="text-2xl font-medium text-[var(--text-h)]">
          Job Applications
        </h1>
        <p className="mt-1 text-sm text-[var(--text)]">
          Create applications, drag cards to change status, click a card to edit.
        </p>
      </header>

      <div className="grid gap-4">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--social-bg)] p-4">
          <h2 className="text-sm font-medium text-[var(--text-h)]">
            New application
          </h2>

          <form onSubmit={onCreate} className="mt-3 grid gap-3" noValidate>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs text-[var(--text)]">Company</span>
                <input
                  className="input"
                  value={createForm.company}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, company: e.target.value }))
                  }
                  disabled={isCreating}
                  required
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs text-[var(--text)]">Role</span>
                <input
                  className="input"
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, role: e.target.value }))
                  }
                  disabled={isCreating}
                  required
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="grid gap-1">
                <span className="text-xs text-[var(--text)]">Date applied</span>
                <input
                  className="input"
                  type="date"
                  value={createForm.dateApplied}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, dateApplied: e.target.value }))
                  }
                  disabled={isCreating}
                  required
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs text-[var(--text)]">Status</span>
                <select
                  className="input"
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      status: e.target.value as ApplicationStatus,
                    }))
                  }
                  disabled={isCreating}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs text-[var(--text)]">Salary range (optional)</span>
                <input
                  className="input"
                  value={createForm.salaryRange}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      salaryRange: e.target.value,
                    }))
                  }
                  disabled={isCreating}
                  placeholder="e.g. 120k-150k"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs text-[var(--text)]">JD link (optional)</span>
                <input
                  className="input"
                  value={createForm.jdLink}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, jdLink: e.target.value }))
                  }
                  disabled={isCreating}
                  placeholder="https://..."
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs text-[var(--text)]">Notes (optional)</span>
                <input
                  className="input"
                  value={createForm.notes}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  disabled={isCreating}
                  placeholder="Recruiter, referrals, reminders..."
                />
              </label>
            </div>

            {createError ? (
              <p className="error" role="alert">
                {createError}
              </p>
            ) : null}

            <div>
              <button className="button" type="submit" disabled={isCreating}>
                {isCreating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </section>

        {selectedApplication && editForm ? (
          <section className="rounded-xl border border-[var(--border)] bg-[var(--social-bg)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium text-[var(--text-h)]">
                  Application details
                </h2>
                <p className="mt-1 text-xs text-[var(--text)]">
                  Edit fields and save, or delete.
                </p>
              </div>
              <button
                className="button"
                type="button"
                onClick={() => setSelectedId(null)}
                disabled={isSaving || isDeleting}
              >
                Close
              </button>
            </div>

            <form onSubmit={onSave} className="mt-3 grid gap-3" noValidate>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs text-[var(--text)]">Company</span>
                  <input
                    className="input"
                    value={editForm.company}
                    onChange={(e) =>
                      setEditForm((p) =>
                        p ? { ...p, company: e.target.value } : p,
                      )
                    }
                    disabled={isSaving || isDeleting}
                    required
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-[var(--text)]">Role</span>
                  <input
                    className="input"
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm((p) => (p ? { ...p, role: e.target.value } : p))
                    }
                    disabled={isSaving || isDeleting}
                    required
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="grid gap-1">
                  <span className="text-xs text-[var(--text)]">Date applied</span>
                  <input
                    className="input"
                    type="date"
                    value={editForm.dateApplied}
                    onChange={(e) =>
                      setEditForm((p) =>
                        p ? { ...p, dateApplied: e.target.value } : p,
                      )
                    }
                    disabled={isSaving || isDeleting}
                    required
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-[var(--text)]">Status</span>
                  <select
                    className="input"
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((p) =>
                        p
                          ? {
                              ...p,
                              status: e.target.value as ApplicationStatus,
                            }
                          : p,
                      )
                    }
                    disabled={isSaving || isDeleting}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-[var(--text)]">Salary range (optional)</span>
                  <input
                    className="input"
                    value={editForm.salaryRange}
                    onChange={(e) =>
                      setEditForm((p) =>
                        p ? { ...p, salaryRange: e.target.value } : p,
                      )
                    }
                    disabled={isSaving || isDeleting}
                    placeholder="e.g. 120k-150k"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs text-[var(--text)]">JD link (optional)</span>
                  <input
                    className="input"
                    value={editForm.jdLink}
                    onChange={(e) =>
                      setEditForm((p) => (p ? { ...p, jdLink: e.target.value } : p))
                    }
                    disabled={isSaving || isDeleting}
                    placeholder="https://..."
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-[var(--text)]">Notes (optional)</span>
                  <input
                    className="input"
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm((p) => (p ? { ...p, notes: e.target.value } : p))
                    }
                    disabled={isSaving || isDeleting}
                    placeholder="Recruiter, referrals, reminders..."
                  />
                </label>
              </div>

              {editError ? (
                <p className="error" role="alert">
                  {editError}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button className="button" type="submit" disabled={isSaving || isDeleting}>
                  {isSaving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  className="button"
                  type="button"
                  onClick={() => void onDelete()}
                  disabled={isSaving || isDeleting}
                >
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section>
          {isLoading ? (
            <p className="text-sm text-[var(--text)]">Loading…</p>
          ) : error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : applications.length === 0 ? (
            <p className="text-sm text-[var(--text)]">
              No applications yet. Create your first one above.
            </p>
          ) : (
            <KanbanBoard
              applications={boardApps}
              onMoveCard={(id, toStatus) => void onMoveCard(id, toStatus)}
              onCardClick={(id) => setSelectedId(id)}
            />
          )}
        </section>
      </div>
    </main>
  )
}

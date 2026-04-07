import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties } from 'react'
import { STATUS_LABEL, type ApplicationCard, type ApplicationStatus } from './types'

export function DraggableApplicationCard({
  card,
  status,
  onClick,
}: {
  card: ApplicationCard
  status: ApplicationStatus
  onClick?: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={
        'cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-left ' +
        (isDragging ? 'opacity-70' : 'opacity-100')
      }
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(card.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-[var(--text)]">{card.company}</p>
          <p className="truncate text-[var(--text-h)]">{card.role}</p>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--code-bg)] px-2 py-0.5 text-xs text-[var(--text-h)]">
          {STATUS_LABEL[status]}
        </span>
      </div>
      <p className="mt-2 text-xs text-[var(--text)]">Applied: {card.dateApplied}</p>
    </article>
  )
}

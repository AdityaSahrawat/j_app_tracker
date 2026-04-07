import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DraggableApplicationCard } from './ApplicationCard'
import {
  STATUSES,
  STATUS_LABEL,
  isApplicationStatus,
  type ApplicationStatus,
  type ApplicationCard,
} from './types'

function findContainer(
  columns: Record<ApplicationStatus, string[]>,
  id: UniqueIdentifier,
): ApplicationStatus | null {
  const idStr = String(id)

  if (isApplicationStatus(idStr)) {
    return idStr
  }

  for (const status of STATUSES) {
    if (columns[status].includes(idStr)) return status
  }

  return null
}

function KanbanColumn({
  status,
  ids,
  cardsById,
  onCardClick,
}: {
  status: ApplicationStatus
  ids: string[]
  cardsById: Record<string, ApplicationCard>
  onCardClick?: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <section
      className={
        'w-72 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--social-bg)] p-3 ' +
        (isOver ? 'ring-2 ring-[var(--accent-border)]' : '')
      }
    >
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-[var(--text-h)]">
          {STATUS_LABEL[status]}
        </h2>
        <span className="text-xs text-[var(--text)]">{ids.length}</span>
      </header>

      <div ref={setNodeRef} className="min-h-10">
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {ids.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)] p-3 text-xs text-[var(--text)]">
                Drop here
              </div>
            ) : null}

            {ids.map((id) => {
              const card = cardsById[id]
              if (!card) return null
              return (
                <DraggableApplicationCard
                  key={id}
                  card={card}
                  status={status}
                  onClick={onCardClick}
                />
              )
            })}
          </div>
        </SortableContext>
      </div>
    </section>
  )
}

export type KanbanApplication = ApplicationCard & { status: ApplicationStatus }

function buildBoard(applications: KanbanApplication[]): {
  cardsById: Record<string, ApplicationCard>
  columns: Record<ApplicationStatus, string[]>
} {
  const cardsById: Record<string, ApplicationCard> = {}
  const columns: Record<ApplicationStatus, string[]> = {
    applied: [],
    phone_screen: [],
    interview: [],
    offer: [],
    rejected: [],
  }

  for (const app of applications) {
    cardsById[app.id] = {
      id: app.id,
      company: app.company,
      role: app.role,
      dateApplied: app.dateApplied,
    }
    columns[app.status].push(app.id)
  }

  return { cardsById, columns }
}

export function KanbanBoard({
  applications,
  onMoveCard,
  onCardClick,
}: {
  applications: KanbanApplication[]
  onMoveCard?: (id: string, toStatus: ApplicationStatus) => void
  onCardClick?: (id: string) => void
}) {
  const built = useMemo(() => buildBoard(applications), [applications])

  const cardsById = built.cardsById
  const [columns, setColumns] = useState<Record<ApplicationStatus, string[]>>(built.columns)

  const columnsRef = useRef(columns)
  useEffect(() => {
    columnsRef.current = columns
  }, [columns])

  useEffect(() => {
    setColumns(built.columns)
  }, [built.columns])

  const dragStartContainerRef = useRef<ApplicationStatus | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const onDragStart = (event: DragStartEvent) => {
    dragStartContainerRef.current = findContainer(columnsRef.current, event.active.id)
  }

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    setColumns((prev) => {
      const activeContainer = findContainer(prev, activeId)
      const overContainer = findContainer(prev, overId)

      if (!activeContainer || !overContainer) return prev
      if (activeContainer === overContainer) return prev

      const fromItems = prev[activeContainer]
      const toItems = prev[overContainer]

      const fromIndex = fromItems.indexOf(activeId)
      if (fromIndex === -1) return prev

      const overIndex = toItems.indexOf(overId)
      const insertAt = overIndex >= 0 ? overIndex : toItems.length

      return {
        ...prev,
        [activeContainer]: fromItems.filter((id) => id !== activeId),
        [overContainer]: [
          ...toItems.slice(0, insertAt),
          activeId,
          ...toItems.slice(insertAt),
        ],
      }
    })
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    const fromContainer = dragStartContainerRef.current
    const toContainer = findContainer(columnsRef.current, overId)
    dragStartContainerRef.current = null

    if (fromContainer && toContainer && fromContainer !== toContainer) {
      onMoveCard?.(activeId, toContainer)
      return
    }

    setColumns((prev) => {
      const activeContainer = findContainer(prev, activeId)
      const overContainer = findContainer(prev, overId)

      if (!activeContainer || !overContainer) return prev
      if (activeContainer !== overContainer) return prev

      const items = prev[activeContainer]
      const oldIndex = items.indexOf(activeId)
      const newIndex = items.indexOf(overId)

      if (oldIndex === -1 || newIndex === -1) return prev
      if (oldIndex === newIndex) return prev

      return {
        ...prev,
        [activeContainer]: arrayMove(items, oldIndex, newIndex),
      }
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            ids={columns[status]}
            cardsById={cardsById}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </DndContext>
  )
}

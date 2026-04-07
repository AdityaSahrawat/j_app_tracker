import type { HTMLAttributes } from 'react'

type Props = {
  size?: number
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>

export function Spinner({ size = 16, className, ...rest }: Props) {
  return (
    <div
      {...rest}
      className={
        className ??
        'inline-block animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]'
      }
      style={{ width: size, height: size }}
      aria-label="Loading"
      role="status"
    />
  )
}

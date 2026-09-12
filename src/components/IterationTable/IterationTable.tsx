import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'
import type { ReactNode } from 'react'

import type { Iteration, MethodId, Point } from '@/engine/types'
import { cn } from '@/lib/utils'

const iterationColumnHelper = createColumnHelper<Iteration>()
const pointColumnHelper = createColumnHelper<Point & { i: number }>()

function formatCell(value: number | undefined, precision: number) {
  if (value === undefined || Number.isNaN(value)) return '—'
  return value.toFixed(precision)
}

interface IterationTableProps {
  method: MethodId
  iterations: Iteration[]
  points: Point[]
  precision: number
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-24 items-center justify-center border border-dashed border-border text-sm text-text-dim">
      {message}
    </div>
  )
}

function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  )
}

function NewtonIterationTable({
  method,
  iterations,
  precision,
}: {
  method: MethodId
  iterations: Iteration[]
  precision: number
}) {
  const derivativeLabel = method === 'newton-raphson-constante' ? "d = f'(x₀)" : "f'(xₙ)"

  const columns = useMemo(
    () => [
      iterationColumnHelper.accessor('n', { header: 'n' }),
      iterationColumnHelper.accessor('x', {
        header: 'xₙ',
        cell: (ctx) => formatCell(ctx.getValue(), precision),
      }),
      iterationColumnHelper.accessor('fx', {
        header: 'f(xₙ)',
        cell: (ctx) => formatCell(ctx.getValue(), precision),
      }),
      iterationColumnHelper.accessor('derivative', {
        header: derivativeLabel,
        cell: (ctx) => formatCell(ctx.getValue(), precision),
      }),
      iterationColumnHelper.accessor('xNext', {
        header: 'xₙ₊₁',
        cell: (ctx) => formatCell(ctx.getValue(), precision),
      }),
      iterationColumnHelper.accessor('error', {
        header: 'Error',
        cell: (ctx) => formatCell(ctx.getValue(), precision),
      }),
    ],
    [derivativeLabel, precision],
  )

  const table = useReactTable({ data: iterations, columns, getCoreRowModel: getCoreRowModel() })

  if (iterations.length === 0) {
    return <EmptyState message="Sin iteraciones todavía" />
  }

  return (
    <TableShell>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="border-b border-border-strong bg-panel-alt">
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-text-muted"
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row, i) => (
          <tr key={row.id} className={cn('border-b border-border', i % 2 === 1 && 'bg-panel-alt/40')}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="whitespace-nowrap px-3 py-1.5 font-mono-nums text-text">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}

function InterpolationPointsTable({ points, precision }: { points: Point[]; precision: number }) {
  const data = useMemo(() => points.map((p, i) => ({ ...p, i })), [points])

  const columns = useMemo(
    () => [
      pointColumnHelper.accessor('i', { header: 'i' }),
      pointColumnHelper.accessor('x', {
        header: 'xᵢ',
        cell: (ctx) => formatCell(ctx.getValue(), precision),
      }),
      pointColumnHelper.accessor('y', {
        header: 'f(xᵢ)',
        cell: (ctx) => formatCell(ctx.getValue(), precision),
      }),
    ],
    [precision],
  )

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

  if (points.length === 0) {
    return <EmptyState message="Agrega puntos para ver la tabla" />
  }

  return (
    <TableShell>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="border-b border-border-strong bg-panel-alt">
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-text-muted"
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row, i) => (
          <tr key={row.id} className={cn('border-b border-border', i % 2 === 1 && 'bg-panel-alt/40')}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="whitespace-nowrap px-3 py-1.5 font-mono-nums text-text">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}

function IterationTable({ method, iterations, points, precision }: IterationTableProps) {
  const isInterpolation = method === 'newton-interpolacion' || method === 'lagrange'

  if (isInterpolation) {
    return <InterpolationPointsTable points={points} precision={precision} />
  }

  return <NewtonIterationTable method={method} iterations={iterations} precision={precision} />
}

export { IterationTable }

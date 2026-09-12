import { createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { ResultingPolynomial } from '@/components/ResultSummary/ResultSummary'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { lagrangeBasisLatex } from '@/engine/lagrangeInterpolation'
import { monomialLatex } from '@/engine/polynomial'
import type { Iteration, LagrangeTerm, MethodId, Point } from '@/engine/types'
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
  dividedDifferences?: number[][]
  lagrangeTerms?: LagrangeTerm[]
  monomialCoefficients?: number[]
  activeIteration?: number | null
  onIterationSelect?: (n: number) => void
}

function TableEmpty({ message }: { message: string }) {
  return <EmptyState title={message} className="py-5" />
}

function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-box border border-border">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  )
}

function NewtonIterationTable({
  method,
  iterations,
  precision,
  activeIteration = null,
  onIterationSelect,
}: {
  method: MethodId
  iterations: Iteration[]
  precision: number
  activeIteration?: number | null
  onIterationSelect?: (n: number) => void
}) {
  const derivativeLabel = method === 'newton-raphson-constante' ? "d = f'(x₀)" : "f'(xₙ)"
  const [search, setSearch] = useState('')

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

  const table = useReactTable({
    data: iterations,
    columns,
    state: { globalFilter: search },
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (iterations.length === 0) {
    return <TableEmpty message="Sin iteraciones todavía" />
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar en la tabla…"
        className="max-w-[240px]"
      />
      <TableShell>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border-strong bg-panel-alt">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="whitespace-nowrap px-3 py-2 text-left text-[13px] font-medium text-text-muted"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              onClick={() => onIterationSelect?.(row.original.n)}
              className={cn(
                'border-b border-border',
                i % 2 === 1 && 'bg-panel-alt/40',
                onIterationSelect && 'cursor-pointer hover:bg-panel-alt',
                row.original.n === activeIteration && 'bg-accent-dim',
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="whitespace-nowrap px-3 py-1.5 font-mono-nums text-text">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-4 text-center text-sm text-text-dim">
                Sin coincidencias
              </td>
            </tr>
          )}
        </tbody>
      </TableShell>
    </div>
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
    return <TableEmpty message="Agrega puntos para ver la tabla" />
  }

  return (
    <TableShell>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="border-b border-border-strong bg-panel-alt">
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="whitespace-nowrap px-3 py-2 text-left text-[13px] font-medium text-text-muted"
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

function differenceHeader(order: number) {
  if (order === 0) return 'f[xᵢ]'
  if (order === 1) return 'f[xᵢ, xᵢ₊₁]'
  return `f[xᵢ, …, xᵢ₊${order}]`
}

function DividedDifferenceTable({
  points,
  table,
  precision,
}: {
  points: Point[]
  table: number[][]
  precision: number
}) {
  const maxOrder = table[0]?.length ?? 0
  const data = useMemo(
    () =>
      points.map((point, i) => ({
        i,
        x: point.x,
        values: Array.from({ length: maxOrder }, (_, k) => table[i]?.[k]),
      })),
    [maxOrder, points, table],
  )

  const columns = useMemo(() => {
    const diffColumnHelper = createColumnHelper<{ i: number; x: number; values: (number | undefined)[] }>()
    return [
      diffColumnHelper.accessor('i', { header: 'i' }),
      diffColumnHelper.accessor('x', {
        header: 'xᵢ',
        cell: (ctx) => formatCell(ctx.getValue(), precision),
      }),
      ...Array.from({ length: maxOrder }, (_, k) =>
        diffColumnHelper.accessor((row) => row.values[k], {
          id: `diff-${k}`,
          header: differenceHeader(k),
          cell: (ctx) => formatCell(ctx.getValue(), precision),
        }),
      ),
    ]
  }, [maxOrder, precision])

  const reactTable = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

  if (points.length === 0 || maxOrder === 0) {
    return <TableEmpty message="Ejecuta el método para ver las diferencias divididas" />
  }

  return (
    <TableShell>
      <thead>
        {reactTable.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="border-b border-border-strong bg-panel-alt">
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="whitespace-nowrap px-3 py-2 text-left text-[13px] font-medium text-text-muted"
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {reactTable.getRowModel().rows.map((row, i) => (
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

const lagrangeColumnHelper = createColumnHelper<LagrangeTerm>()
const MANY_POINTS = 6

function LagrangeTermsTable({
  terms,
  points,
  precision,
}: {
  terms: LagrangeTerm[]
  points: Point[]
  precision: number
}) {
  const [view, setView] = useState<'simplificada' | 'detallada'>(
    terms.length >= MANY_POINTS ? 'simplificada' : 'detallada',
  )

  const columns = useMemo(
    () => [
      lagrangeColumnHelper.accessor('i', { header: 'i' }),
      lagrangeColumnHelper.accessor('x', {
        header: 'xᵢ',
        cell: (ctx) => formatCell(ctx.getValue(), precision),
      }),
      lagrangeColumnHelper.accessor('y', {
        header: 'yᵢ',
        cell: (ctx) => formatCell(ctx.getValue(), precision),
      }),
      lagrangeColumnHelper.accessor('basis', {
        header: 'Lᵢ(x)',
        cell: (ctx) => formatCell(ctx.getValue(), precision),
      }),
      lagrangeColumnHelper.accessor('term', {
        header: 'yᵢ·Lᵢ(x)',
        cell: (ctx) => formatCell(ctx.getValue(), precision),
      }),
    ],
    [precision],
  )

  const table = useReactTable({ data: terms, columns, getCoreRowModel: getCoreRowModel() })
  const evaluated = terms.every((term) => term.term !== undefined)
  const total = evaluated ? terms.reduce((sum, term) => sum + (term.term ?? 0), 0) : undefined

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={view === 'simplificada' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('simplificada')}
        >
          Simplificada
        </Button>
        <Button
          type="button"
          variant={view === 'detallada' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('detallada')}
        >
          Detallada
        </Button>
      </div>

      <TableShell>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border-strong bg-panel-alt">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="whitespace-nowrap px-3 py-2 text-left text-[13px] font-medium text-text-muted"
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
        {evaluated && (
          <tfoot>
            <tr className="border-t border-border-strong bg-panel-alt">
              <td colSpan={4} className="px-3 py-1.5 text-[13px] text-text-muted">
                P(x)
              </td>
              <td className="whitespace-nowrap px-3 py-1.5 font-mono-nums text-accent-strong">
                {formatCell(total, precision)}
              </td>
            </tr>
          </tfoot>
        )}
      </TableShell>

      {view === 'detallada' && (
        <div className="flex flex-col gap-2">
          {terms.map((term) => {
            const latex = lagrangeBasisLatex(term.i, points, precision)
            return (
              <div key={term.i} className="rounded-box border border-border px-4 py-3">
                <math-field key={latex} read-only className="block">
                  {latex}
                </math-field>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function IterationTable({
  method,
  iterations,
  points,
  precision,
  dividedDifferences,
  lagrangeTerms,
  monomialCoefficients,
  activeIteration,
  onIterationSelect,
}: IterationTableProps) {
  const resulting =
    monomialCoefficients && monomialCoefficients.length > 0 ? (
      <ResultingPolynomial latex={monomialLatex(monomialCoefficients, precision)} />
    ) : null

  if (method === 'newton-interpolacion') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-text">Datos originales</h3>
          <InterpolationPointsTable points={points} precision={precision} />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-text">Diferencias divididas</h3>
          {dividedDifferences ? (
            <DividedDifferenceTable points={points} table={dividedDifferences} precision={precision} />
          ) : (
            <TableEmpty message="Ejecuta el método para ver las diferencias divididas" />
          )}
        </div>
        {resulting}
      </div>
    )
  }

  if (method === 'lagrange') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-text">Datos originales</h3>
          <InterpolationPointsTable points={points} precision={precision} />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-text">Polinomios base Lᵢ(x)</h3>
          {lagrangeTerms ? (
            <LagrangeTermsTable terms={lagrangeTerms} points={points} precision={precision} />
          ) : (
            <TableEmpty message="Ejecuta el método para ver Lᵢ(x) y yᵢ·Lᵢ(x)" />
          )}
        </div>
        {resulting}
      </div>
    )
  }

  return (
    <NewtonIterationTable
      method={method}
      iterations={iterations}
      precision={precision}
      activeIteration={activeIteration}
      onIterationSelect={onIterationSelect}
    />
  )
}

export { IterationTable }

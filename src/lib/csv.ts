import type { MethodId, NumericalResult } from '@/engine/types'

type Cell = string | number

function escapeCell(value: Cell): string {
  const str = String(value)
  if (/[",\r\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

function toCsv(rows: Cell[][]): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')
}

function numberCell(value: number | null | undefined, precision: number): Cell {
  if (value === null || value === undefined || Number.isNaN(value)) return ''
  return value.toFixed(precision)
}

function timestampSlug(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function buildRootFindingCsv(result: NumericalResult, method: MethodId, precision: number): string {
  const derivativeHeader = method === 'newton-raphson-constante' ? "d = f'(x0)" : "f'(xn)"
  const rows: Cell[][] = [['n', 'xn', 'f(xn)', derivativeHeader, 'xn+1', 'Error']]
  for (const it of result.iterationData) {
    rows.push([
      it.n,
      numberCell(it.x, precision),
      numberCell(it.fx, precision),
      numberCell(it.derivative, precision),
      numberCell(it.xNext, precision),
      numberCell(it.error, precision),
    ])
  }
  return toCsv(rows)
}

function buildNewtonInterpolationCsv(result: NumericalResult, precision: number): string {
  const rows: Cell[][] = [['i', 'xi', 'f(xi)']]
  result.interpolationPoints?.forEach((p, i) => rows.push([i, numberCell(p.x, precision), numberCell(p.y, precision)]))

  const table = result.dividedDifferences
  if (table) {
    const maxOrder = table[0]?.length ?? 0
    rows.push([])
    rows.push(['i', 'xi', ...Array.from({ length: maxOrder }, (_, k) => `orden ${k}`)])
    result.interpolationPoints?.forEach((p, i) => {
      rows.push([i, numberCell(p.x, precision), ...Array.from({ length: maxOrder }, (_, k) => numberCell(table[i]?.[k], precision))])
    })
  }

  if (result.xTarget !== undefined) {
    rows.push([])
    rows.push(['x interpolado', numberCell(result.xTarget, precision)])
    rows.push(['P(x)', numberCell(result.finalValue, precision)])
  }

  return toCsv(rows)
}

function buildLagrangeCsv(result: NumericalResult, precision: number): string {
  const rows: Cell[][] = [['i', 'xi', 'yi', 'Li(x)', 'yi*Li(x)']]
  result.lagrangeTerms?.forEach((t) =>
    rows.push([t.i, numberCell(t.x, precision), numberCell(t.y, precision), numberCell(t.basis, precision), numberCell(t.term, precision)]),
  )

  if (result.xTarget !== undefined) {
    rows.push([])
    rows.push(['x interpolado', numberCell(result.xTarget, precision)])
    rows.push(['P(x)', numberCell(result.finalValue, precision)])
  }

  return toCsv(rows)
}

export function exportIterationsCsv(method: MethodId, result: NumericalResult, precision: number) {
  let csv: string
  if (method === 'newton-raphson' || method === 'newton-raphson-constante') {
    csv = buildRootFindingCsv(result, method, precision)
  } else if (method === 'newton-interpolacion') {
    csv = buildNewtonInterpolationCsv(result, precision)
  } else if (method === 'lagrange') {
    csv = buildLagrangeCsv(result, precision)
  } else {
    return
  }
  downloadCsv(`numeria_${method}_${timestampSlug()}.csv`, csv)
}

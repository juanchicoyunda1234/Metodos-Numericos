import type { ReactNode } from 'react'

import type { MethodId, NumericalResult } from '@/engine/types'

const STATUS_LABEL: Record<NumericalResult['status'], string> = {
  CONVERGIO: 'Convergió',
  NO_CONVERGIO: 'No convergió',
  ERROR_NUMERICO: 'Error numérico',
  DIVERGIO: 'Divergió',
}

interface PrintReportProps {
  methodTitle: string
  expression?: string
  paramsSummary: { label: string; value: string }[]
  result: NumericalResult | null
  method: MethodId
  precision: number
  chartDataUrl: string | null
}

function formatNumber(value: number | null | undefined, precision: number) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toFixed(precision)
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4 break-inside-avoid">
      <h2 className="mb-1.5 text-xs font-semibold text-gray-600">{title}</h2>
      {children}
    </section>
  )
}

function KeyValueTable({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <table className="w-full border-collapse text-xs">
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-gray-200">
            <td className="py-1 pr-4 text-gray-500">{row.label}</td>
            <td className="py-1 font-mono text-black">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="border-b border-gray-400 bg-gray-100">
          {headers.map((h) => (
            <th key={h} className="whitespace-nowrap px-2 py-1 text-left font-medium text-gray-600">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-gray-200">
            {row.map((cell, j) => (
              <td key={j} className="whitespace-nowrap px-2 py-1 font-mono text-black">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function rootFindingTable(result: NumericalResult, method: MethodId, precision: number) {
  const derivativeHeader = method === 'newton-raphson-constante' ? "d = f'(x0)" : "f'(xn)"
  return (
    <DataTable
      headers={['n', 'xn', 'f(xn)', derivativeHeader, 'xn+1', 'Error']}
      rows={result.iterationData.map((it) => [
        it.n,
        formatNumber(it.x, precision),
        formatNumber(it.fx, precision),
        formatNumber(it.derivative, precision),
        formatNumber(it.xNext, precision),
        formatNumber(it.error, precision),
      ])}
    />
  )
}

function newtonInterpolationTables(result: NumericalResult, precision: number) {
  const points = result.interpolationPoints ?? []
  const table = result.dividedDifferences
  const maxOrder = table?.[0]?.length ?? 0
  return (
    <div className="flex flex-col gap-3">
      <DataTable
        headers={['i', 'xi', 'f(xi)']}
        rows={points.map((p, i) => [i, formatNumber(p.x, precision), formatNumber(p.y, precision)])}
      />
      {table && (
        <DataTable
          headers={['i', 'xi', ...Array.from({ length: maxOrder }, (_, k) => `orden ${k}`)]}
          rows={points.map((p, i) => [
            i,
            formatNumber(p.x, precision),
            ...Array.from({ length: maxOrder }, (_, k) => formatNumber(table[i]?.[k], precision)),
          ])}
        />
      )}
    </div>
  )
}

function lagrangeTables(result: NumericalResult, precision: number) {
  const terms = result.lagrangeTerms ?? []
  return (
    <DataTable
      headers={['i', 'xi', 'yi', 'Li(x)', 'yi·Li(x)']}
      rows={terms.map((t) => [
        t.i,
        formatNumber(t.x, precision),
        formatNumber(t.y, precision),
        formatNumber(t.basis, precision),
        formatNumber(t.term, precision),
      ])}
    />
  )
}

function PrintReport({ methodTitle, expression, paramsSummary, result, method, precision, chartDataUrl }: PrintReportProps) {
  if (!result) return null

  const isInterpolation = method === 'newton-interpolacion' || method === 'lagrange'
  const generatedAt = new Date().toLocaleString()

  const metricRows: { label: string; value: string }[] = isInterpolation
    ? [
        ...(result.xTarget !== undefined
          ? [
              { label: 'x interpolado', value: formatNumber(result.xTarget, precision) },
              { label: 'P(x) evaluado', value: formatNumber(result.finalValue, precision) },
            ]
          : []),
        { label: 'Puntos', value: String(result.interpolationPoints?.length ?? 0) },
      ]
    : [
        ...(result.constantDerivative !== undefined
          ? [{ label: "d = f'(x0)", value: formatNumber(result.constantDerivative, precision) }]
          : []),
        { label: 'Valor final', value: formatNumber(result.finalValue, precision) },
        { label: 'Iteraciones', value: String(result.iterations) },
        { label: 'Error', value: formatNumber(result.error, precision) },
        { label: 'Residuo |f(xn)|', value: formatNumber(result.residual, precision) },
      ]

  return (
    <div className="hidden print:block print:bg-white print:p-8 print:text-black">
      <header className="border-b border-gray-400 pb-2">
        <div className="text-sm font-semibold tracking-[0.18em]">NUMERIA</div>
        <div className="text-xs text-gray-500">Informe de cálculo - generado {generatedAt}</div>
      </header>

      <Section title="Método">
        <div className="text-sm font-medium">{methodTitle}</div>
        {expression && <div className="mt-1 font-mono text-sm">f(x) = {expression}</div>}
      </Section>

      <Section title="Parámetros">
        <KeyValueTable rows={paramsSummary} />
      </Section>

      <Section title="Estado">
        <div className="text-sm font-medium">{STATUS_LABEL[result.status]}</div>
        {result.message && <div className="mt-1 text-xs text-gray-600">{result.message}</div>}
        <div className="mt-1 text-xs text-gray-500">Tiempo de ejecución: {result.executionTime.toFixed(2)} ms</div>
      </Section>

      <Section title="Resultado">
        <KeyValueTable rows={metricRows} />
      </Section>

      <Section title="Tabla">
        {isInterpolation
          ? method === 'lagrange'
            ? lagrangeTables(result, precision)
            : newtonInterpolationTables(result, precision)
          : rootFindingTable(result, method, precision)}
      </Section>

      {chartDataUrl && (
        <Section title="Gráfica">
          <img src={chartDataUrl} alt="Gráfica del cálculo" className="max-w-full border border-gray-300" />
        </Section>
      )}
    </div>
  )
}

export { PrintReport }

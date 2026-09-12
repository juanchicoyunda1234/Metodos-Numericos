import type { ReactNode } from 'react'

import { monomialLatex } from '@/engine/polynomial'
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
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return value.toFixed(precision)
}

function latexToPrint(latex: string) {
  return latex.replace(/x\^\{(\d+)\}/g, 'x^$1')
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="print-section mt-5">
      <h2 className="print-kicker">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  )
}

function MetricGrid({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="print-metrics">
      {rows.map((row) => (
        <div key={row.label} className="print-metric">
          <div className="print-metric-label">{row.label}</div>
          <div className="print-metric-value">{row.value}</div>
        </div>
      ))}
    </div>
  )
}

function KeyValueTable({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <table className="print-table">
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th>{row.label}</th>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <table className="print-table print-table-data">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
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
    <div className="flex flex-col gap-4">
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
  const generatedAt = new Date().toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
  const polynomial =
    result.monomialCoefficients && result.monomialCoefficients.length > 0
      ? monomialLatex(result.monomialCoefficients, precision)
      : result.polynomial
  const degree =
    result.monomialCoefficients && result.monomialCoefficients.length > 0
      ? result.monomialCoefficients.length - 1
      : result.interpolationPoints
        ? result.interpolationPoints.length - 1
        : null

  const metricRows: { label: string; value: string }[] = isInterpolation
    ? [
        ...(result.xTarget !== undefined
          ? [
              { label: 'x interpolado', value: formatNumber(result.xTarget, precision) },
              { label: 'P(x) evaluado', value: formatNumber(result.finalValue, precision) },
            ]
          : []),
        { label: 'Puntos', value: String(result.interpolationPoints?.length ?? 0) },
        { label: 'Grado', value: degree === null ? '-' : String(degree) },
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
    <div className="print-report hidden print:block">
      <header className="print-header">
        <div className="print-header-row">
          <div>
            <div className="print-brand">NUMERIA</div>
            <div className="print-brand-sub">Laboratorio de métodos numéricos</div>
          </div>
          <div className="print-meta">
            <div>{generatedAt}</div>
            <div>Precisión: {precision} decimales</div>
            <div>{result.executionTime.toFixed(2)} ms</div>
          </div>
        </div>
        <h1 className="print-title">{methodTitle}</h1>
        {expression && <p className="print-formula">f(x) = {expression}</p>}
        {isInterpolation && polynomial && <p className="print-formula">{latexToPrint(polynomial)}</p>}
      </header>

      <Section title="Estado">
        <p className="print-status">{STATUS_LABEL[result.status]}</p>
        {result.message && <p className="print-status-note">{result.message}</p>}
      </Section>

      <Section title="Parámetros">
        <KeyValueTable rows={paramsSummary} />
      </Section>

      <Section title="Resultado">
        <MetricGrid rows={metricRows} />
      </Section>

      <Section title={isInterpolation ? 'Tablas' : 'Iteraciones'}>
        {isInterpolation
          ? method === 'lagrange'
            ? lagrangeTables(result, precision)
            : newtonInterpolationTables(result, precision)
          : rootFindingTable(result, method, precision)}
      </Section>

      {chartDataUrl && (
        <Section title="Gráfica">
          <figure className="print-figure">
            <img src={chartDataUrl} alt={`Gráfica de ${methodTitle}`} />
            <figcaption>
              {isInterpolation
                ? 'Polinomio interpolante y puntos de datos.'
                : 'Curva f(x), iteraciones y trayectoria hacia la raíz.'}
            </figcaption>
          </figure>
        </Section>
      )}

      <footer className="print-footer">
        Numeria · informe de cálculo · {methodTitle}
      </footer>
    </div>
  )
}

export { PrintReport }

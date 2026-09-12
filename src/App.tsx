import { useMemo, useRef, useState } from 'react'

import type { InterpolationParams, RootFindingParams } from '@/components/ParamsForm/ParamsForm'
import { ComparisonView } from '@/components/ComparisonView/ComparisonView'
import { ConvergenceChart } from '@/components/ConvergenceChart/ConvergenceChart'
import type { ConvergenceChartHandle } from '@/components/ConvergenceChart/ConvergenceChart'
import { buildChartOption } from '@/components/ConvergenceChart/chartOptions'
import { IterationTable } from '@/components/IterationTable/IterationTable'
import { MathInput } from '@/components/MathInput/MathInput'
import { MethodSelector } from '@/components/MethodSelector/MethodSelector'
import { ParamsForm } from '@/components/ParamsForm/ParamsForm'
import { PrintReport } from '@/components/PrintReport/PrintReport'
import { ProcedureView } from '@/components/ProcedureView/ProcedureView'
import { ResultSummary } from '@/components/ResultSummary/ResultSummary'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { lagrangeInterpolation } from '@/engine/lagrangeInterpolation'
import { newtonInterpolation } from '@/engine/newtonInterpolation'
import { newtonRaphson } from '@/engine/newtonRaphson'
import { newtonRaphsonConstante } from '@/engine/newtonRaphsonConstante'
import { InvalidExpressionError } from '@/engine/parser'
import type { MethodId, NumericalResult, Point } from '@/engine/types'
import { exportIterationsCsv } from '@/lib/csv'

const METHOD_TITLE: Record<MethodId, string> = {
  'newton-raphson': 'Newton-Raphson',
  'newton-raphson-constante': 'Newton-Raphson con derivada constante',
  'newton-interpolacion': 'Interpolación de Newton',
  lagrange: 'Interpolación de Lagrange',
  comparacion: 'Comparar métodos',
}

const METHOD_DESCRIPTION: Record<MethodId, string> = {
  'newton-raphson': 'Aproxima la raíz de f(x) evaluando la derivada en cada iteración.',
  'newton-raphson-constante': "Aproxima la raíz de f(x) reutilizando d = f'(x₀) en todas las iteraciones.",
  'newton-interpolacion': 'Construye el polinomio interpolante mediante diferencias divididas.',
  lagrange: 'Construye el polinomio interpolante mediante los polinomios base Lᵢ(x).',
  comparacion: 'Ejecuta Newton clásico y Newton constante con los mismos parámetros.',
}

const PRECISION_OPTIONS = [4, 6, 8, 10, 12, 14]

function App() {
  const [selectedMethod, setSelectedMethod] = useState<MethodId>('newton-raphson')
  const [mode, setMode] = useState<'resultado' | 'procedimiento'>('resultado')
  const [precision, setPrecision] = useState(10)
  const [expression, setExpression] = useState('')
  const [rootParams, setRootParams] = useState<RootFindingParams>({
    x0: '',
    tolerance: '0.0001',
    maxIterations: '100',
  })
  const [interpolationParams, setInterpolationParams] = useState<InterpolationParams>({
    points: [
      { x: '', y: '' },
      { x: '', y: '' },
    ],
    xTarget: '',
  })

  const [result, setResult] = useState<NumericalResult | null>(null)
  const [classicResult, setClassicResult] = useState<NumericalResult | null>(null)
  const [constantResult, setConstantResult] = useState<NumericalResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [printChartUrl, setPrintChartUrl] = useState<string | null>(null)
  const chartRef = useRef<ConvergenceChartHandle>(null)

  const isInterpolation = selectedMethod === 'newton-interpolacion' || selectedMethod === 'lagrange'
  const isComparison = selectedMethod === 'comparacion'

  const handleSelectMethod = (id: MethodId) => {
    setSelectedMethod(id)
    setMode('resultado')
    setResult(null)
    setClassicResult(null)
    setConstantResult(null)
    setErrorMessage(null)
  }

  const handleExecute = () => {
    setErrorMessage(null)

    const isClassic = selectedMethod === 'newton-raphson'
    const isConstant = selectedMethod === 'newton-raphson-constante'

    if (isClassic || isConstant || isComparison) {
      const x0 = Number(rootParams.x0)
      const tolerance = Number(rootParams.tolerance)
      const maxIterations = Number(rootParams.maxIterations)

      if (!expression.trim()) {
        setErrorMessage('Ingresa una expresión f(x)')
        return
      }
      if (!Number.isFinite(x0)) {
        setErrorMessage('x₀ debe ser un número válido')
        return
      }
      if (!Number.isFinite(tolerance) || tolerance <= 0) {
        setErrorMessage('La tolerancia debe ser un número mayor que 0')
        return
      }
      if (!Number.isInteger(maxIterations) || maxIterations <= 0) {
        setErrorMessage('El máximo de iteraciones debe ser un entero positivo')
        return
      }

      try {
        const params = { expression, x0, tolerance, maxIterations }
        if (isComparison) {
          setClassicResult(newtonRaphson(params))
          setConstantResult(newtonRaphsonConstante(params))
          setResult(null)
        } else {
          setResult(isClassic ? newtonRaphson(params) : newtonRaphsonConstante(params))
          setClassicResult(null)
          setConstantResult(null)
        }
      } catch (err) {
        setResult(null)
        setClassicResult(null)
        setConstantResult(null)
        setErrorMessage(err instanceof InvalidExpressionError ? err.message : 'Ocurrió un error inesperado al calcular')
      }
      return
    }

    if (selectedMethod === 'newton-interpolacion' || selectedMethod === 'lagrange') {
      const points: Point[] = []
      for (const point of interpolationParams.points) {
        if (!point.x.trim() || !point.y.trim()) {
          setErrorMessage('Datos incompletos')
          return
        }
        const x = Number(point.x)
        const y = Number(point.y)
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          setErrorMessage('Los puntos contienen valores no numéricos')
          return
        }
        points.push({ x, y })
      }

      let xTarget: number | undefined
      if (interpolationParams.xTarget.trim()) {
        xTarget = Number(interpolationParams.xTarget)
        if (!Number.isFinite(xTarget)) {
          setErrorMessage('x a interpolar debe ser un número válido')
          return
        }
      }

      setClassicResult(null)
      setConstantResult(null)
      setResult(
        selectedMethod === 'newton-interpolacion'
          ? newtonInterpolation({ points, xTarget })
          : lagrangeInterpolation({ points, xTarget }),
      )
    }
  }

  const isRootFinding = selectedMethod === 'newton-raphson' || selectedMethod === 'newton-raphson-constante'
  const activeResult = isRootFinding || isInterpolation ? result : null
  const activeIterations = activeResult?.iterationData ?? []
  const tablePoints = activeResult?.interpolationPoints ?? interpolationParams.points.map((p) => ({
    x: p.x.trim() === '' ? Number.NaN : Number(p.x),
    y: p.y.trim() === '' ? Number.NaN : Number(p.y),
  }))
  const chartOption = useMemo(
    () => buildChartOption(selectedMethod, activeResult, precision),
    [selectedMethod, activeResult, precision],
  )
  const chartHeight = isRootFinding ? 440 : 340

  const paramsSummary = isRootFinding
    ? [
        { label: 'x₀', value: rootParams.x0 },
        { label: 'Tolerancia ε', value: rootParams.tolerance },
        { label: 'Máx. iteraciones', value: rootParams.maxIterations },
      ]
    : [
        { label: 'Puntos', value: String(interpolationParams.points.length) },
        { label: 'x a interpolar', value: interpolationParams.xTarget || '—' },
      ]

  const handleExportCsv = () => {
    if (!activeResult) return
    exportIterationsCsv(selectedMethod, activeResult, precision)
  }

  const handleExportPdf = () => {
    if (!activeResult) return
    setPrintChartUrl(chartRef.current?.getDataUrl() ?? null)
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()))
  }

  return (
    <>
    <div className="flex h-screen flex-col bg-bg text-text print:hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
        <div className="flex items-baseline gap-3">
          <span className="text-base font-semibold tracking-widest text-text">NUMERIA</span>
          <span className="hidden text-xs text-text-dim sm:inline">Laboratorio de métodos numéricos</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-text-dim">Precisión</span>
          <Select value={String(precision)} onValueChange={(v) => setPrecision(Number(v))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRECISION_OPTIONS.map((p) => (
                <SelectItem key={p} value={String(p)}>
                  {p} decimales
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-64 shrink-0 border-r border-border">
          <MethodSelector selected={selectedMethod} onSelect={handleSelectMethod} />
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-8 py-6">
            <div>
              <h1 className="text-xl font-semibold text-text">{METHOD_TITLE[selectedMethod]}</h1>
              <p className="mt-1 text-sm text-text-muted">{METHOD_DESCRIPTION[selectedMethod]}</p>
            </div>

            {!isInterpolation && (
              <section className="border border-border bg-panel p-4">
                <div className="mb-2 text-[11px] uppercase tracking-wide text-text-dim">f(x)</div>
                <MathInput value={expression} onChange={setExpression} placeholder="x^3-x-2" />
              </section>
            )}

            <section className="border border-border bg-panel p-4">
              <ParamsForm
                method={selectedMethod}
                rootParams={rootParams}
                onRootParamsChange={setRootParams}
                interpolationParams={interpolationParams}
                onInterpolationParamsChange={setInterpolationParams}
              />
            </section>

            <div className="flex items-center gap-3">
              <Button type="button" onClick={handleExecute}>
                Ejecutar
              </Button>
              {!isComparison && activeResult && (
                <>
                  <Button type="button" variant="outline" onClick={handleExportCsv}>
                    Exportar CSV
                  </Button>
                  <Button type="button" variant="outline" onClick={handleExportPdf}>
                    Exportar PDF
                  </Button>
                </>
              )}
              {errorMessage && <span className="text-sm text-danger">{errorMessage}</span>}
            </div>

            {isComparison ? (
              <ComparisonView classic={classicResult} constant={constantResult} precision={precision} />
            ) : (
              <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                <TabsList>
                  <TabsTrigger value="resultado">Resultado</TabsTrigger>
                  <TabsTrigger value="procedimiento">Procedimiento</TabsTrigger>
                </TabsList>

                <TabsContent value="resultado" className="flex flex-col gap-4 pt-4">
                  <ResultSummary result={activeResult} precision={precision} method={selectedMethod} />
                  <IterationTable
                    method={selectedMethod}
                    iterations={activeIterations}
                    points={tablePoints}
                    precision={precision}
                    dividedDifferences={activeResult?.dividedDifferences}
                    lagrangeTerms={activeResult?.lagrangeTerms}
                    monomialCoefficients={activeResult?.monomialCoefficients}
                  />
                  <div className="flex flex-col gap-2">
                    <div className="text-[11px] uppercase tracking-wide text-text-dim">Gráfica</div>
                    <ConvergenceChart ref={chartRef} option={chartOption} height={chartHeight} />
                  </div>
                </TabsContent>

                <TabsContent value="procedimiento" className="pt-4">
                  <ProcedureView method={selectedMethod} precision={precision} result={activeResult} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </div>
    {!isComparison && (
      <PrintReport
        methodTitle={METHOD_TITLE[selectedMethod]}
        expression={isRootFinding ? expression : undefined}
        paramsSummary={paramsSummary}
        result={activeResult}
        method={selectedMethod}
        precision={precision}
        chartDataUrl={printChartUrl}
      />
    )}
    </>
  )
}

export default App

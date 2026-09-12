import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import type { InterpolationParams, RootFindingParams } from '@/components/ParamsForm/ParamsForm'
import { ChartControls } from '@/components/ConvergenceChart/ChartControls'
import { ComparisonView } from '@/components/ComparisonView/ComparisonView'
import { ConvergenceChart } from '@/components/ConvergenceChart/ConvergenceChart'
import type { ConvergenceChartHandle } from '@/components/ConvergenceChart/ConvergenceChart'
import { buildChartOption, DEFAULT_CHART_LAYERS } from '@/components/ConvergenceChart/chartOptions'
import type { ChartLayers } from '@/components/ConvergenceChart/chartOptions'
import { IterationTable } from '@/components/IterationTable/IterationTable'
import { MathInput } from '@/components/MathInput/MathInput'
import { METHOD_GROUPS, MethodSelector } from '@/components/MethodSelector/MethodSelector'
import { ParamsForm } from '@/components/ParamsForm/ParamsForm'
import { PrintReport } from '@/components/PrintReport/PrintReport'
import { ProcedureView } from '@/components/ProcedureView/ProcedureView'
import { ResultSummary } from '@/components/ResultSummary/ResultSummary'
import { StatusBanner } from '@/components/StatusBanner/StatusBanner'
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle'
import { BrandMark } from '@/components/BrandMark/BrandMark'
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
import { applyTheme, readStoredTheme } from '@/lib/theme'
import type { ColorScheme } from '@/lib/theme'

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

function isRootMethod(id: MethodId) {
  return id === 'newton-raphson' || id === 'newton-raphson-constante'
}

function isInterpolationMethod(id: MethodId) {
  return id === 'newton-interpolacion' || id === 'lagrange'
}

function Panel({
  title,
  children,
  className = '',
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-box border border-border bg-panel p-4 ${className}`}>
      {title ? <h2 className="mb-3 text-sm font-medium text-text">{title}</h2> : null}
      {children}
    </section>
  )
}

function App() {
  const [selectedMethod, setSelectedMethod] = useState<MethodId>('newton-raphson')
  const [mode, setMode] = useState<'resultado' | 'procedimiento'>('resultado')
  const [precision, setPrecision] = useState(10)
  const [theme, setTheme] = useState<ColorScheme>(() => readStoredTheme())
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
  const errorRef = useRef<HTMLDivElement>(null)
  const [printChartUrl, setPrintChartUrl] = useState<string | null>(null)
  const [activeIteration, setActiveIteration] = useState<number | null>(null)
  const [chartLayers, setChartLayers] = useState<ChartLayers>(DEFAULT_CHART_LAYERS)
  const chartRef = useRef<ConvergenceChartHandle>(null)

  const isInterpolation = isInterpolationMethod(selectedMethod)
  const isComparison = selectedMethod === 'comparacion'
  const isRootFinding = isRootMethod(selectedMethod)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (errorMessage) errorRef.current?.focus()
  }, [errorMessage])

  const handleSelectMethod = (id: MethodId) => {
    if (isRootMethod(selectedMethod) && isRootMethod(id) && id !== selectedMethod) {
      setExpression('')
      setRootParams((prev) => ({ ...prev, x0: '' }))
    }
    setSelectedMethod(id)
    setMode('resultado')
    setResult(null)
    setClassicResult(null)
    setConstantResult(null)
    setErrorMessage(null)
    setActiveIteration(null)
  }

  const handleExecute = useCallback(() => {
    setErrorMessage(null)
    setActiveIteration(null)

    const isClassic = selectedMethod === 'newton-raphson'
    const isConstant = selectedMethod === 'newton-raphson-constante'

    if (isClassic || isConstant || selectedMethod === 'comparacion') {
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
        if (selectedMethod === 'comparacion') {
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
  }, [selectedMethod, rootParams, expression, interpolationParams])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        handleExecute()
        return
      }
      if (event.key === 'Escape') {
        const dialog = document.querySelector<HTMLElement>('[role="dialog"][data-state="open"]')
        dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleExecute])

  const activeResult = isRootFinding || isInterpolation ? result : null
  const activeIterations = activeResult?.iterationData ?? []
  const tablePoints = activeResult?.interpolationPoints ?? interpolationParams.points.map((p) => ({
    x: p.x.trim() === '' ? Number.NaN : Number(p.x),
    y: p.y.trim() === '' ? Number.NaN : Number(p.y),
  }))
  const chartOption = useMemo(
    () =>
      buildChartOption(
        selectedMethod,
        activeResult,
        precision,
        isRootFinding ? activeIteration : null,
        isRootFinding ? chartLayers : DEFAULT_CHART_LAYERS,
        theme,
      ),
    [selectedMethod, activeResult, precision, isRootFinding, activeIteration, chartLayers, theme],
  )
  const chartHeight = isRootFinding ? 440 : 360

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

  const actionRow = (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" onClick={handleExecute}>
        Ejecutar
      </Button>
      <span className="hidden text-xs text-text-dim sm:inline">
        <kbd>Ctrl</kbd>
        <span className="mx-1">+</span>
        <kbd>Enter</kbd>
      </span>
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
      {errorMessage && (
        <div
          ref={errorRef}
          id="workspace-error"
          role="alert"
          tabIndex={-1}
          className="rounded-box border border-danger/35 bg-danger-dim px-3 py-1.5 text-sm text-danger outline-none focus-visible:ring-2 focus-visible:ring-danger"
        >
          <p className="font-medium">Hay un problema</p>
          <p className="mt-0.5 opacity-90">{errorMessage}</p>
        </div>
      )}
    </div>
  )

  const paramsForm = (
    <ParamsForm
      method={selectedMethod}
      rootParams={rootParams}
      onRootParamsChange={setRootParams}
      interpolationParams={interpolationParams}
      onInterpolationParamsChange={setInterpolationParams}
      errorMessage={errorMessage}
    />
  )

  const chartPanel = (
    <div className="flex flex-col gap-3 @min-[960px]:sticky @min-[960px]:top-4">
      <h2 className="text-sm font-medium text-text">Gráfica</h2>
      {isRootFinding && (
        <ChartControls
          layers={chartLayers}
          onLayersChange={setChartLayers}
          iterationCount={activeIterations.length}
          activeIteration={activeIteration}
          onActiveIterationChange={setActiveIteration}
        />
      )}
      <ConvergenceChart
        ref={chartRef}
        option={chartOption}
        height={chartHeight}
        onIterationClick={isRootFinding ? setActiveIteration : undefined}
        colorScheme={theme}
      />
    </div>
  )

  const resultTabs = (
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
          activeIteration={isRootFinding ? activeIteration : null}
          onIterationSelect={isRootFinding ? setActiveIteration : undefined}
        />
      </TabsContent>

      <TabsContent value="procedimiento" className="pt-4">
        <ProcedureView
          method={selectedMethod}
          precision={precision}
          result={activeResult}
          activeIteration={isRootFinding ? activeIteration : null}
          onIterationSelect={isRootFinding ? setActiveIteration : undefined}
        />
      </TabsContent>
    </Tabs>
  )

  return (
    <>
      <a
        href="#workspace"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[70] focus:m-3 focus:rounded-box focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-on-accent"
      >
        Saltar al contenido
      </a>
      <div className="flex h-dvh flex-col bg-bg text-text print:hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-panel px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div className="flex flex-col justify-center leading-none">
              <span className="text-[13px] font-semibold tracking-[0.18em] text-text">NUMERIA</span>
              <span className="mt-1 hidden text-[11px] text-text-muted sm:block">
                Laboratorio de métodos numéricos
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[13px] text-text-muted sm:inline">Precisión</span>
            <Select value={String(precision)} onValueChange={(v) => setPrecision(Number(v))}>
              <SelectTrigger className="w-16 font-mono-nums" aria-label="Precisión decimal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRECISION_OPTIONS.map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ThemeToggle theme={theme} onToggle={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))} />
          </div>
        </header>

        <div className="border-b border-border bg-panel px-4 py-2 md:hidden">
          <Select value={selectedMethod} onValueChange={(v) => handleSelectMethod(v as MethodId)}>
            <SelectTrigger className="w-full" aria-label="Método">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHOD_GROUPS.flatMap((group) =>
                group.methods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {group.label}: {method.label}
                  </SelectItem>
                )),
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-64 shrink-0 border-r border-border bg-panel md:block">
            <MethodSelector selected={selectedMethod} onSelect={handleSelectMethod} />
          </aside>

          <main id="workspace" className="@container min-w-0 flex-1 overflow-y-auto scroll-mt-4">
            <div className="mx-auto flex max-w-[1400px] flex-col gap-7 px-4 py-7 sm:px-8">
              <div>
                <h1 className="text-xl font-medium tracking-tight text-text text-balance">
                  {METHOD_TITLE[selectedMethod]}
                </h1>
                <p className="mt-1.5 max-w-[65ch] text-sm leading-relaxed text-text-muted">
                  {METHOD_DESCRIPTION[selectedMethod]}
                </p>
              </div>

              {isComparison && (
                <>
                  <Panel title="f(x)">
                    <MathInput value={expression} onChange={setExpression} placeholder="x^3-x-2" onSubmit={handleExecute} />
                  </Panel>
                  <Panel title="Parámetros">{paramsForm}</Panel>
                  {actionRow}
                  <ComparisonView
                    classic={classicResult}
                    constant={constantResult}
                    precision={precision}
                    colorScheme={theme}
                  />
                </>
              )}

              {isRootFinding && (
                <>
                  <div className="grid grid-cols-1 gap-8 @min-[960px]:grid-cols-2 @min-[960px]:items-start">
                    <div className="flex flex-col gap-4">
                      <Panel title="f(x)">
                        <MathInput value={expression} onChange={setExpression} placeholder="x^3-x-2" onSubmit={handleExecute} />
                      </Panel>
                      <Panel title="Parámetros">{paramsForm}</Panel>
                      {actionRow}
                    </div>
                    {chartPanel}
                  </div>
                  {activeResult && <StatusBanner result={activeResult} method={selectedMethod} precision={precision} />}
                  {resultTabs}
                </>
              )}

              {isInterpolation && (
                <>
                  <div className="grid grid-cols-1 gap-8 @min-[960px]:grid-cols-2 @min-[960px]:items-start">
                    <div className="flex flex-col gap-4">
                      <Panel>{paramsForm}</Panel>
                      {actionRow}
                    </div>
                    {chartPanel}
                  </div>
                  {activeResult && <StatusBanner result={activeResult} method={selectedMethod} precision={precision} />}
                  {resultTabs}
                </>
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

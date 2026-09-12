import { useState } from 'react'

import type { InterpolationParams, RootFindingParams } from '@/components/ParamsForm/ParamsForm'
import { ComparisonView } from '@/components/ComparisonView/ComparisonView'
import { ConvergenceChart } from '@/components/ConvergenceChart/ConvergenceChart'
import { IterationTable } from '@/components/IterationTable/IterationTable'
import { MathInput } from '@/components/MathInput/MathInput'
import { MethodSelector } from '@/components/MethodSelector/MethodSelector'
import { ParamsForm } from '@/components/ParamsForm/ParamsForm'
import { ProcedureView } from '@/components/ProcedureView/ProcedureView'
import { ResultSummary } from '@/components/ResultSummary/ResultSummary'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { MethodId } from '@/engine/types'

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
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
    xTarget: '',
  })

  const isInterpolation = selectedMethod === 'newton-interpolacion' || selectedMethod === 'lagrange'
  const isComparison = selectedMethod === 'comparacion'

  const handleSelectMethod = (id: MethodId) => {
    setSelectedMethod(id)
    setMode('resultado')
  }

  return (
    <div className="flex h-screen flex-col bg-bg text-text">
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

            <div>
              <Button type="button">Ejecutar</Button>
            </div>

            {isComparison ? (
              <ComparisonView classic={null} constant={null} precision={precision} />
            ) : (
              <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                <TabsList>
                  <TabsTrigger value="resultado">Resultado</TabsTrigger>
                  <TabsTrigger value="procedimiento">Procedimiento</TabsTrigger>
                </TabsList>

                <TabsContent value="resultado" className="flex flex-col gap-4 pt-4">
                  <ResultSummary result={null} precision={precision} />
                  <IterationTable
                    method={selectedMethod}
                    iterations={[]}
                    points={interpolationParams.points}
                    precision={precision}
                  />
                  <ConvergenceChart option={null} />
                </TabsContent>

                <TabsContent value="procedimiento" className="pt-4">
                  <ProcedureView method={selectedMethod} iterations={[]} precision={precision} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App

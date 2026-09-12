import { Trash2 } from 'lucide-react'

import type { MethodId } from '@/engine/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip } from '@/components/ui/tooltip'

interface RootFindingParams {
  x0: string
  tolerance: string
  maxIterations: string
}

interface InterpolationPointInput {
  x: string
  y: string
}

interface InterpolationParams {
  points: InterpolationPointInput[]
  xTarget: string
}

interface ParamsFormProps {
  method: MethodId
  rootParams: RootFindingParams
  onRootParamsChange: (params: RootFindingParams) => void
  interpolationParams: InterpolationParams
  onInterpolationParamsChange: (params: InterpolationParams) => void
  errorMessage?: string | null
}

function ParamsForm({
  method,
  rootParams,
  onRootParamsChange,
  interpolationParams,
  onInterpolationParamsChange,
  errorMessage,
}: ParamsFormProps) {
  const isInterpolation = method === 'newton-interpolacion' || method === 'lagrange'

  if (isInterpolation) {
    return (
      <InterpolationParamsForm
        params={interpolationParams}
        onChange={onInterpolationParamsChange}
        errorMessage={errorMessage}
      />
    )
  }

  return (
    <RootFindingParamsForm params={rootParams} onChange={onRootParamsChange} errorMessage={errorMessage} />
  )
}

function RootFindingParamsForm({
  params,
  onChange,
  errorMessage,
}: {
  params: RootFindingParams
  onChange: (params: RootFindingParams) => void
  errorMessage?: string | null
}) {
  const described = errorMessage ? 'workspace-error' : undefined
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="flex flex-col gap-1.5">
        <Tooltip content="Valor inicial desde el que arranca la iteración.">
          <Label htmlFor="x0" className="w-fit cursor-help">
            x₀
          </Label>
        </Tooltip>
        <Input
          id="x0"
          inputMode="decimal"
          value={params.x0}
          onChange={(e) => onChange({ ...params, x0: e.target.value })}
          placeholder="0"
          aria-invalid={errorMessage?.includes('x₀') || undefined}
          aria-describedby={errorMessage?.includes('x₀') ? described : undefined}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Tooltip content="Criterio de parada: el método se detiene cuando |xₙ₊₁ − xₙ| < ε.">
          <Label htmlFor="tolerance" className="w-fit cursor-help">
            Tolerancia ε
          </Label>
        </Tooltip>
        <Input
          id="tolerance"
          inputMode="decimal"
          value={params.tolerance}
          onChange={(e) => onChange({ ...params, tolerance: e.target.value })}
          placeholder="0.0001"
          aria-invalid={errorMessage?.includes('tolerancia') || undefined}
          aria-describedby={errorMessage?.includes('tolerancia') ? described : undefined}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Tooltip content="Número máximo de pasos antes de declarar que no convergió.">
          <Label htmlFor="maxIterations" className="w-fit cursor-help">
            Máx. iteraciones
          </Label>
        </Tooltip>
        <Input
          id="maxIterations"
          inputMode="numeric"
          value={params.maxIterations}
          onChange={(e) => onChange({ ...params, maxIterations: e.target.value })}
          placeholder="100"
          aria-invalid={errorMessage?.includes('iteraciones') || undefined}
          aria-describedby={errorMessage?.includes('iteraciones') ? described : undefined}
        />
      </div>
    </div>
  )
}

function InterpolationParamsForm({
  params,
  onChange,
  errorMessage,
}: {
  params: InterpolationParams
  onChange: (params: InterpolationParams) => void
  errorMessage?: string | null
}) {
  const updatePoint = (index: number, key: keyof InterpolationPointInput, raw: string) => {
    const next = params.points.map((p, i) => (i === index ? { ...p, [key]: raw } : p))
    onChange({ ...params, points: next })
  }

  const addPoint = () => {
    onChange({ ...params, points: [...params.points, { x: '', y: '' }] })
  }

  const removePoint = (index: number) => {
    if (params.points.length <= 2) return
    onChange({ ...params, points: params.points.filter((_, i) => i !== index) })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Tooltip content="Pares (xᵢ, yᵢ) por los que debe pasar el polinomio interpolante.">
            <Label className="w-fit cursor-help">Puntos (xᵢ, yᵢ)</Label>
          </Tooltip>
          <Button type="button" variant="outline" size="sm" className="min-h-11 sm:min-h-7" onClick={addPoint}>
            + Agregar punto
          </Button>
        </div>
        <div className="flex flex-col gap-1.5">
          {params.points.map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-5 shrink-0 font-mono-nums text-xs text-text-dim">{index}</span>
              <Input
                inputMode="decimal"
                value={point.x}
                onChange={(e) => updatePoint(index, 'x', e.target.value)}
                placeholder="xᵢ"
                aria-invalid={Boolean(errorMessage && (errorMessage.includes('incompletos') || errorMessage.includes('no numéricos'))) || undefined}
                aria-describedby={errorMessage && (errorMessage.includes('incompletos') || errorMessage.includes('no numéricos')) ? 'workspace-error' : undefined}
              />
              <Input
                inputMode="decimal"
                value={point.y}
                onChange={(e) => updatePoint(index, 'y', e.target.value)}
                placeholder="yᵢ"
                aria-invalid={Boolean(errorMessage && (errorMessage.includes('incompletos') || errorMessage.includes('no numéricos'))) || undefined}
                aria-describedby={errorMessage && (errorMessage.includes('incompletos') || errorMessage.includes('no numéricos')) ? 'workspace-error' : undefined}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-11 w-11 sm:h-7 sm:w-7"
                onClick={() => removePoint(index)}
                aria-label="Eliminar punto"
                disabled={params.points.length <= 2}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 max-w-[220px]">
        <Tooltip content="Valor de x donde se evalúa el polinomio. Déjalo vacío si solo quieres construirlo.">
          <Label htmlFor="xTarget" className="w-fit cursor-help">
            x a interpolar (opcional)
          </Label>
        </Tooltip>
        <Input
          id="xTarget"
          inputMode="decimal"
          value={params.xTarget}
          onChange={(e) => onChange({ ...params, xTarget: e.target.value })}
          placeholder="evaluar P(x)"
          aria-invalid={errorMessage?.includes('x a interpolar') || undefined}
          aria-describedby={errorMessage?.includes('x a interpolar') ? 'workspace-error' : undefined}
        />
      </div>
    </div>
  )
}

export { ParamsForm }
export type { InterpolationParams, InterpolationPointInput, RootFindingParams }

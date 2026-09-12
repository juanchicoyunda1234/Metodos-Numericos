import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { ChartLayers } from '@/components/ConvergenceChart/chartOptions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SPEED_STEPS = [1400, 900, 550, 300]
const SPEED_LABELS = ['Lenta', 'Normal', 'Rápida', 'Muy rápida']

interface ChartControlsProps {
  layers: ChartLayers
  onLayersChange: (layers: ChartLayers) => void
  iterationCount: number
  activeIteration: number | null
  onActiveIterationChange: (n: number | null) => void
}

function LayerToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'min-h-11 cursor-pointer rounded-[4px] px-3 text-xs font-medium transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] sm:h-7 sm:min-h-7 sm:px-2.5',
        active ? 'bg-accent-dim text-text' : 'text-text-muted hover:text-text',
      )}
    >
      {label}
    </button>
  )
}

function ChartControls({
  layers,
  onLayersChange,
  iterationCount,
  activeIteration,
  onActiveIterationChange,
}: ChartControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speedIndex, setSpeedIndex] = useState(1)
  const activeRef = useRef(activeIteration)
  activeRef.current = activeIteration

  useEffect(() => {
    setIsPlaying(false)
  }, [iterationCount])

  useEffect(() => {
    if (!isPlaying) return
    if (iterationCount === 0) {
      setIsPlaying(false)
      return
    }
    const id = setInterval(() => {
      const next = activeRef.current === null ? 0 : activeRef.current + 1
      if (next >= iterationCount) {
        setIsPlaying(false)
        return
      }
      onActiveIterationChange(next)
    }, SPEED_STEPS[speedIndex])
    return () => clearInterval(id)
  }, [isPlaying, speedIndex, iterationCount, onActiveIterationChange])

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
      return
    }
    if (iterationCount === 0) return
    if (activeIteration === null || activeIteration >= iterationCount - 1) {
      onActiveIterationChange(0)
    }
    setIsPlaying(true)
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-text-muted">Capas</span>
        <div className="inline-flex items-center gap-0.5 rounded-box border border-border bg-panel-alt p-0.5">
          <LayerToggle
            label="Iteraciones"
            active={layers.iterations}
            onClick={() => onLayersChange({ ...layers, iterations: !layers.iterations })}
          />
          <LayerToggle
            label="Tangentes"
            active={layers.tangents}
            onClick={() => onLayersChange({ ...layers, tangents: !layers.tangents })}
          />
          <LayerToggle
            label="Trayectoria"
            active={layers.trajectory}
            onClick={() => onLayersChange({ ...layers, trajectory: !layers.trajectory })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[13px] text-text-muted">Reproducción</span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="h-11 w-11 sm:h-7 sm:w-7"
          onClick={handleTogglePlay}
          disabled={iterationCount === 0}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? (
            <Pause aria-hidden="true" />
          ) : (
            <Play aria-hidden="true" className="ml-px" />
          )}
        </Button>
        <input
          type="range"
          min={0}
          max={SPEED_STEPS.length - 1}
          step={1}
          value={speedIndex}
          onChange={(e) => setSpeedIndex(Number(e.target.value))}
          className={cn('h-1 w-24 accent-accent')}
          aria-label="Velocidad de reproducción"
        />
        <span className="w-16 text-xs text-text-muted">{SPEED_LABELS[speedIndex]}</span>
      </div>
    </div>
  )
}

export { ChartControls }

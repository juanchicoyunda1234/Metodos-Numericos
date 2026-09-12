import * as echarts from 'echarts/core'
import type { ECharts, EChartsOption } from 'echarts'
import { LineChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

echarts.use([
  LineChart,
  ScatterChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  MarkLineComponent,
  CanvasRenderer,
])

import { chartExportBackground } from '@/components/ConvergenceChart/chartOptions'
import type { ColorScheme } from '@/lib/theme'

interface ChartEmptyHint {
  title: string
  hint: string
  meta?: string
  kind?: 'roots' | 'interpolation'
}

interface ConvergenceChartProps {
  option: EChartsOption | null
  height?: number
  onIterationClick?: (n: number) => void
  colorScheme?: ColorScheme
  frame?: 'default' | 'flush'
  emptyHint?: ChartEmptyHint
}

interface ConvergenceChartHandle {
  getDataUrl: () => string | null
}

const BASE_OPTION: EChartsOption = {
  backgroundColor: 'transparent',
  textStyle: { fontFamily: 'IBM Plex Mono, ui-monospace, monospace' },
  grid: { left: 48, right: 24, top: 24, bottom: 32 },
  animationDuration: 520,
  animationDurationUpdate: 420,
  animationEasing: 'cubicOut',
  animationEasingUpdate: 'cubicOut',
}

const ConvergenceChart = forwardRef<ConvergenceChartHandle, ConvergenceChartProps>(function ConvergenceChart(
  {
    option,
    height = 320,
    onIterationClick,
    colorScheme = 'dark',
    frame = 'default',
    emptyHint = {
      title: 'Lista para visualizar',
      hint: 'Ejecuta el método para dibujar la curva.',
      meta: 'i1 -> i2 -> i3',
      kind: 'roots',
    },
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ECharts | null>(null)
  const onIterationClickRef = useRef(onIterationClick)
  const colorSchemeRef = useRef(colorScheme)

  useEffect(() => {
    onIterationClickRef.current = onIterationClick
  }, [onIterationClick])

  useEffect(() => {
    colorSchemeRef.current = colorScheme
  }, [colorScheme])

  useImperativeHandle(ref, () => ({
    getDataUrl: () =>
      chartRef.current?.getDataURL({ pixelRatio: 2, backgroundColor: chartExportBackground(colorSchemeRef.current) }) ??
      null,
  }))

  useEffect(() => {
    if (!containerRef.current) return
    const chart = echarts.init(containerRef.current, null, { renderer: 'canvas' })
    chartRef.current = chart

    chart.on('click', (params) => {
      const data = params.data
      if (data && typeof data === 'object' && 'n' in data) {
        onIterationClickRef.current?.(Number((data as { n: number }).n))
      }
    })

    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!chartRef.current) return
    if (!option) {
      chartRef.current.clear()
      return
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    chartRef.current.setOption(
      {
        ...BASE_OPTION,
        ...option,
        animation: reduceMotion ? false : option.animation,
      },
      { notMerge: false, lazyUpdate: true },
    )
  }, [option])

  return (
    <div
      className={
        frame === 'flush'
          ? 'relative overflow-hidden bg-transparent'
          : 'relative overflow-hidden rounded-box border border-border bg-panel'
      }
    >
      <div ref={containerRef} style={{ height }} className="w-full" />
      {!option && (
        <>
          <div className="pointer-events-none absolute inset-0 chart-empty-surface" aria-hidden="true">
            <svg viewBox="0 0 640 360" preserveAspectRatio="none" className="h-full w-full">
              <path
                d="M0 286H640M0 214H640M0 142H640M0 70H640M80 0V360M200 0V360M320 0V360M440 0V360M560 0V360"
                className="chart-empty-grid"
              />
              <path
                d="M34 248C96 226 120 104 180 122C242 140 244 262 312 242C386 220 390 72 462 86C528 99 550 190 606 154"
                className="chart-empty-curve"
              />
              <path d="M178 122V286M312 242V286M462 86V286" className="chart-empty-guide" />
              <g className="chart-empty-point">
                <circle cx="178" cy="122" r="5" />
                <circle cx="312" cy="242" r="5" />
                <circle cx="462" cy="86" r="5" />
              </g>
              <g className="chart-empty-label">
                <text x="190" y="114">
                  {emptyHint.kind === 'interpolation' ? 'x0' : 'i1'}
                </text>
                <text x="324" y="234">
                  {emptyHint.kind === 'interpolation' ? 'x1' : 'i2'}
                </text>
                <text x="474" y="78">
                  {emptyHint.kind === 'interpolation' ? 'x2' : 'i3'}
                </text>
              </g>
            </svg>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between gap-4 border-t border-border bg-panel/90 px-4 py-3 backdrop-blur-sm">
            <div>
              <p className="text-sm font-medium text-text">{emptyHint.title}</p>
              <p className="mt-0.5 max-w-[46ch] text-xs leading-relaxed text-text-muted">{emptyHint.hint}</p>
            </div>
            {emptyHint.meta ? (
              <span className="hidden shrink-0 self-start rounded-box border border-border-strong px-2 py-1 font-mono-nums text-[11px] text-text-dim sm:block">
                {emptyHint.meta}
              </span>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
})

export { ConvergenceChart }
export type { ConvergenceChartHandle }

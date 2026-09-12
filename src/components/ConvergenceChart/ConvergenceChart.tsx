import * as echarts from 'echarts'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

import { chartExportBackground } from '@/components/ConvergenceChart/chartOptions'
import type { ColorScheme } from '@/lib/theme'

interface ConvergenceChartProps {
  option: echarts.EChartsOption | null
  height?: number
  onIterationClick?: (n: number) => void
  colorScheme?: ColorScheme
}

interface ConvergenceChartHandle {
  getDataUrl: () => string | null
}

const BASE_OPTION: echarts.EChartsOption = {
  backgroundColor: 'transparent',
  textStyle: { color: '#8994a6', fontFamily: 'var(--font-mono)' },
  grid: { left: 48, right: 24, top: 24, bottom: 32 },
  animationDuration: 250,
}

const ConvergenceChart = forwardRef<ConvergenceChartHandle, ConvergenceChartProps>(function ConvergenceChart(
  { option, height = 320, onIterationClick, colorScheme = 'dark' },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
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
    chartRef.current.setOption({ ...BASE_OPTION, ...option }, true)
  }, [option])

  return (
    <div className="relative rounded-box border border-border">
      <div ref={containerRef} style={{ height }} className="w-full" />
      {!option && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-text-dim">
          Ejecuta el método para ver la gráfica
        </div>
      )}
    </div>
  )
})

export { ConvergenceChart }
export type { ConvergenceChartHandle }

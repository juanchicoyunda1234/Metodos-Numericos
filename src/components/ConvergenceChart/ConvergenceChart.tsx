import * as echarts from 'echarts'
import { useEffect, useRef } from 'react'

interface ConvergenceChartProps {
  option: echarts.EChartsOption | null
  height?: number
}

const BASE_OPTION: echarts.EChartsOption = {
  backgroundColor: 'transparent',
  textStyle: { color: '#8994a6', fontFamily: 'var(--font-mono)' },
  grid: { left: 48, right: 24, top: 24, bottom: 32 },
  animationDuration: 250,
}

function ConvergenceChart({ option, height = 320 }: ConvergenceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const chart = echarts.init(containerRef.current, null, { renderer: 'canvas' })
    chartRef.current = chart

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
    <div className="relative border border-border">
      <div ref={containerRef} style={{ height }} className="w-full" />
      {!option && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-text-dim">
          Ejecuta el método para ver la gráfica
        </div>
      )}
    </div>
  )
}

export { ConvergenceChart }

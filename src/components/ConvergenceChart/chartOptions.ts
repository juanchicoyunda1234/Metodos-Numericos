import type { EChartsOption, LineSeriesOption, ScatterSeriesOption } from 'echarts'

import { parseExpression, sampleExpression } from '@/engine/parser'
import { evaluateMonomial, sampleMonomial } from '@/engine/polynomial'
import type { Iteration, MethodId, NumericalResult } from '@/engine/types'

const COLOR = {
  axis: '#8994a6',
  split: '#202836',
  line: '#2d3849',
  fx: '#45b8e0',
  points: '#f0a53c',
  root: '#4fd68c',
  path: '#f0645f',
  poly: '#6fd0f2',
  interp: '#4fd68c',
  classic: '#45b8e0',
  constant: '#f0a53c',
  fxMuted: '#8994a6',
  active: '#e3e9f1',
  tangent: '#b98ff0',
}

export interface ChartLayers {
  iterations: boolean
  trajectory: boolean
  tangents: boolean
}

export const DEFAULT_CHART_LAYERS: ChartLayers = {
  iterations: true,
  trajectory: true,
  tangents: false,
}

function axisCommon() {
  return {
    axisLine: { lineStyle: { color: COLOR.line } },
    axisTick: { lineStyle: { color: COLOR.line } },
    axisLabel: { color: COLOR.axis },
    splitLine: { lineStyle: { color: COLOR.split } },
    nameTextStyle: { color: COLOR.axis },
  }
}

function extent(values: number[], padRatio = 0.2, minPad = 0.5): [number, number] {
  const finite = values.filter((v) => Number.isFinite(v))
  if (finite.length === 0) return [-1, 1]
  let min = Math.min(...finite)
  let max = Math.max(...finite)
  if (min === max) {
    min -= minPad
    max += minPad
  } else {
    const pad = Math.max((max - min) * padRatio, minPad)
    min -= pad
    max += pad
  }
  return [min, max]
}

function withBreaks(points: [number, number][], dx: number): ([number, number] | null)[] {
  const out: ([number, number] | null)[] = []
  for (let i = 0; i < points.length; i++) {
    if (i > 0 && points[i][0] - points[i - 1][0] > dx * 1.8) out.push(null)
    out.push(points[i])
  }
  return out
}

function trajectoryPath(iterations: Iteration[], limit = 12): ([number, number] | null)[] {
  const path: ([number, number] | null)[] = []
  const n = Math.min(iterations.length, limit)
  for (let i = 0; i < n; i++) {
    const it = iterations[i]
    if (!Number.isFinite(it.x) || !Number.isFinite(it.fx) || !Number.isFinite(it.xNext)) continue
    path.push([it.x, 0], [it.x, it.fx], [it.xNext, 0], null)
  }
  return path
}

function tangentLines(iterations: Iteration[], xMin: number, xMax: number, limit = 8): ([number, number] | null)[] {
  const span = Math.max((xMax - xMin) * 0.12, 1e-6)
  const lines: ([number, number] | null)[] = []
  const n = Math.min(iterations.length, limit)
  for (let i = 0; i < n; i++) {
    const it = iterations[i]
    if (!Number.isFinite(it.x) || !Number.isFinite(it.fx) || it.derivative === undefined || !Number.isFinite(it.derivative)) continue
    const x1 = it.x - span
    const x2 = it.x + span
    lines.push([x1, it.fx + it.derivative * (x1 - it.x)], [x2, it.fx + it.derivative * (x2 - it.x)], null)
  }
  return lines
}

function xnSeries(result: NumericalResult): { value: [number, number]; n: number }[] {
  const data = result.iterationData.map((it) => ({ value: [it.n, it.x] as [number, number], n: it.n }))
  const last = result.iterationData.at(-1)
  if (last && Number.isFinite(last.xNext)) data.push({ value: [last.n + 1, last.xNext], n: last.n })
  return data
}

function tooltipValue(value: unknown, precision: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return value.toFixed(precision)
}

export function buildChartOption(
  method: MethodId,
  result: NumericalResult | null,
  precision: number,
  activeIteration: number | null = null,
  layers: ChartLayers = DEFAULT_CHART_LAYERS,
): EChartsOption | null {
  if (!result) return null

  if (method === 'newton-raphson' || method === 'newton-raphson-constante') {
    return buildRootFindingOption(result, precision, activeIteration, layers)
  }

  if (method === 'newton-interpolacion' || method === 'lagrange') {
    return buildInterpolationOption(result, precision)
  }

  return null
}

function buildRootFindingOption(
  result: NumericalResult,
  precision: number,
  activeIteration: number | null = null,
  layers: ChartLayers = DEFAULT_CHART_LAYERS,
): EChartsOption | null {
  const expression = result.equation
  if (!expression) return null

  const xs = result.iterationData.flatMap((it) => [it.x, it.xNext])
  if (result.finalValue !== null) xs.push(result.finalValue)
  const [xMin, xMax] = extent(xs, 0.35, 1)

  const fy = result.iterationData.map((it) => it.fx).filter((v) => Number.isFinite(v))
  const maxAbs = Math.max(4, ...fy.map((v) => Math.abs(v))) * 6

  let samples: [number, number][] = []
  try {
    samples = sampleExpression(expression, xMin, xMax, 260, maxAbs)
  } catch {
    samples = []
  }

  const dx = (xMax - xMin) / 260
  const fxLine = withBreaks(samples, dx)

  const iterationPoints = result.iterationData
    .filter((it) => Number.isFinite(it.x) && Number.isFinite(it.fx))
    .map((it) => ({ value: [it.x, it.fx], n: it.n }))

  const path = trajectoryPath(result.iterationData)

  const root = result.finalValue
  let rootPoint: [number, number] | null = null
  if (root !== null && Number.isFinite(root)) {
    try {
      const y = parseExpression(expression).evaluate(root)
      rootPoint = [root, Number.isFinite(y) ? y : 0]
    } catch {
      rootPoint = [root, 0]
    }
  }

  const xnData = xnSeries(result)

  const series: (LineSeriesOption | ScatterSeriesOption)[] = [
    {
      name: 'f(x)',
      type: 'line',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: fxLine,
      showSymbol: false,
      sampling: 'lttb',
      lineStyle: { width: 2, color: COLOR.fx },
      itemStyle: { color: COLOR.fx },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: COLOR.axis, type: 'dashed', width: 1, opacity: 0.45 },
        data: [{ yAxis: 0 }],
        label: { show: false },
      },
    },
  ]

  if (layers.trajectory) {
    series.push({
      name: 'Trayectoria',
      type: 'line',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: path,
      showSymbol: false,
      lineStyle: { width: 1.5, color: COLOR.path, type: 'solid' },
      itemStyle: { color: COLOR.path },
    })
  }

  if (layers.tangents) {
    series.push({
      name: 'Tangentes',
      type: 'line',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: tangentLines(result.iterationData, xMin, xMax),
      showSymbol: false,
      lineStyle: { width: 1, color: COLOR.tangent, type: 'dashed' },
      itemStyle: { color: COLOR.tangent },
    })
  }

  if (layers.iterations) {
    series.push({
      name: 'Iteraciones',
      type: 'scatter',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: iterationPoints,
      symbolSize: 8,
      cursor: 'pointer',
      itemStyle: { color: COLOR.points, borderColor: '#0a0d12', borderWidth: 1 },
    })
  }

  series.push({
    name: 'xₙ',
    type: 'line',
    xAxisIndex: 1,
    yAxisIndex: 1,
    data: xnData,
    showSymbol: true,
    symbolSize: 7,
    cursor: 'pointer',
    lineStyle: { width: 2, color: COLOR.fx },
    itemStyle: { color: COLOR.fx },
    markLine:
      root !== null
        ? {
            silent: true,
            symbol: 'none',
            lineStyle: { color: COLOR.root, type: 'dashed', width: 1 },
            data: [{ yAxis: root }],
            label: { show: false },
          }
        : undefined,
  })

  if (rootPoint) {
    series.push({
      name: 'Raíz',
      type: 'scatter',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: [rootPoint],
      symbolSize: 11,
      symbol: 'diamond',
      itemStyle: { color: COLOR.root, borderColor: '#0a0d12', borderWidth: 1 },
    })
  }

  if (activeIteration !== null) {
    const active = result.iterationData.find((it) => it.n === activeIteration)
    if (active && Number.isFinite(active.x) && Number.isFinite(active.fx)) {
      const activeFxPoint = [{ value: [active.x, active.fx] as [number, number], n: active.n }]
      const activeXnPoint = [{ value: [active.n, active.x] as [number, number], n: active.n }]
      series.push({
        name: 'Iteración activa',
        type: 'scatter',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: activeFxPoint,
        symbolSize: 18,
        symbol: 'circle',
        silent: true,
        itemStyle: { color: 'transparent', borderColor: COLOR.active, borderWidth: 2 },
        zlevel: 1,
      })
      series.push({
        name: 'Iteración activa (xₙ)',
        type: 'scatter',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: activeXnPoint,
        symbolSize: 15,
        silent: true,
        itemStyle: { color: 'transparent', borderColor: COLOR.active, borderWidth: 2 },
        zlevel: 1,
      })
    }
  }

  return {
    legend: {
      top: 4,
      textStyle: { color: COLOR.axis, fontSize: 11 },
      itemWidth: 12,
      itemHeight: 8,
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#141922',
      borderColor: COLOR.line,
      textStyle: { color: '#e3e9f1', fontSize: 12 },
      formatter: (raw) => {
        const p = Array.isArray(raw) ? raw[0] : raw
        const value = p.value
        const extra = p.data && typeof p.data === 'object' && 'n' in p.data ? Number(p.data.n) : undefined
        if (Array.isArray(value) && typeof value[0] === 'number' && typeof value[1] === 'number') {
          const head = extra !== undefined ? `n = ${extra}<br/>` : ''
          return `${p.seriesName}<br/>${head}x = ${tooltipValue(value[0], precision)}<br/>y = ${tooltipValue(value[1], precision)}`
        }
        return String(p.seriesName ?? '')
      },
    },
    grid: [
      { left: 56, right: 28, top: 40, height: '48%' },
      { left: 56, right: 28, top: '68%', height: '22%' },
    ],
    xAxis: [
      { type: 'value', gridIndex: 0, name: 'x', ...axisCommon(), min: xMin, max: xMax },
      {
        type: 'value',
        gridIndex: 1,
        name: 'n',
        minInterval: 1,
        ...axisCommon(),
      },
    ],
    yAxis: [
      { type: 'value', gridIndex: 0, name: 'f(x)', scale: true, ...axisCommon() },
      { type: 'value', gridIndex: 1, name: 'xₙ', scale: true, ...axisCommon() },
    ],
    series,
  }
}

function buildInterpolationOption(result: NumericalResult, precision: number): EChartsOption | null {
  const points = result.interpolationPoints
  const coeffs = result.monomialCoefficients
  if (!points || points.length === 0 || !coeffs) return null

  const xs = points.map((p) => p.x)
  if (result.xTarget !== undefined) xs.push(result.xTarget)
  const [xMin, xMax] = extent(xs, 0.18, 0.5)

  const ys = points.map((p) => p.y)
  const ySpan = Math.max(1, ...ys.map((v) => Math.abs(v)))
  const samples = sampleMonomial(coeffs, xMin, xMax, 280, ySpan * 12)
  const dx = (xMax - xMin) / 280

  const series: (LineSeriesOption | ScatterSeriesOption)[] = [
    {
      name: 'P(x)',
      type: 'line',
      data: withBreaks(samples, dx),
      showSymbol: false,
      sampling: 'lttb',
      lineStyle: { width: 2, color: COLOR.poly },
      itemStyle: { color: COLOR.poly },
    },
    {
      name: 'Puntos',
      type: 'scatter',
      data: points.map((p) => [p.x, p.y]),
      symbolSize: 9,
      itemStyle: { color: COLOR.points, borderColor: '#0a0d12', borderWidth: 1 },
    },
  ]

  if (result.xTarget !== undefined && result.finalValue !== null) {
    series.push({
      name: 'P(x) interpolado',
      type: 'scatter',
      data: [[result.xTarget, result.finalValue]],
      symbolSize: 12,
      symbol: 'diamond',
      itemStyle: { color: COLOR.interp, borderColor: '#0a0d12', borderWidth: 1 },
    })
  } else if (result.xTarget !== undefined) {
    const y = evaluateMonomial(coeffs, result.xTarget)
    if (Number.isFinite(y)) {
      series.push({
        name: 'P(x) interpolado',
        type: 'scatter',
        data: [[result.xTarget, y]],
        symbolSize: 12,
        symbol: 'diamond',
        itemStyle: { color: COLOR.interp, borderColor: '#0a0d12', borderWidth: 1 },
      })
    }
  }

  return {
    legend: {
      top: 4,
      textStyle: { color: COLOR.axis, fontSize: 11 },
      itemWidth: 12,
      itemHeight: 8,
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#141922',
      borderColor: COLOR.line,
      textStyle: { color: '#e3e9f1', fontSize: 12 },
      formatter: (raw) => {
        const p = Array.isArray(raw) ? raw[0] : raw
        const value = p.value
        if (Array.isArray(value) && typeof value[0] === 'number' && typeof value[1] === 'number') {
          return `${p.seriesName}<br/>x = ${tooltipValue(value[0], precision)}<br/>y = ${tooltipValue(value[1], precision)}`
        }
        return String(p.seriesName ?? '')
      },
    },
    grid: { left: 56, right: 28, top: 40, bottom: 40 },
    xAxis: { type: 'value', name: 'x', ...axisCommon() },
    yAxis: { type: 'value', name: 'y', scale: true, ...axisCommon() },
    series,
  }
}

export function buildComparisonOption(
  classic: NumericalResult | null,
  constant: NumericalResult | null,
  precision: number,
): EChartsOption | null {
  if (!classic && !constant) return null

  const expression = classic?.equation ?? constant?.equation
  if (!expression) return null

  const xs = [
    ...(classic?.iterationData.flatMap((it) => [it.x, it.xNext]) ?? []),
    ...(constant?.iterationData.flatMap((it) => [it.x, it.xNext]) ?? []),
  ]
  if (classic?.finalValue !== null && classic?.finalValue !== undefined) xs.push(classic.finalValue)
  if (constant?.finalValue !== null && constant?.finalValue !== undefined) xs.push(constant.finalValue)
  const [xMin, xMax] = extent(xs, 0.35, 1)

  const fy = [
    ...(classic?.iterationData.map((it) => it.fx) ?? []),
    ...(constant?.iterationData.map((it) => it.fx) ?? []),
  ].filter((v) => Number.isFinite(v))
  const maxAbs = Math.max(4, ...fy.map((v) => Math.abs(v))) * 6

  let samples: [number, number][] = []
  try {
    samples = sampleExpression(expression, xMin, xMax, 260, maxAbs)
  } catch {
    samples = []
  }
  const dx = (xMax - xMin) / 260
  const fxLine = withBreaks(samples, dx)

  const series: (LineSeriesOption | ScatterSeriesOption)[] = [
    {
      name: 'f(x)',
      type: 'line',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: fxLine,
      showSymbol: false,
      sampling: 'lttb',
      lineStyle: { width: 2, color: COLOR.fxMuted },
      itemStyle: { color: COLOR.fxMuted },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: COLOR.axis, type: 'dashed', width: 1, opacity: 0.45 },
        data: [{ yAxis: 0 }],
        label: { show: false },
      },
    },
  ]

  if (classic) {
    series.push(
      {
        name: 'Trayectoria clásico',
        type: 'line',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: trajectoryPath(classic.iterationData),
        showSymbol: false,
        lineStyle: { width: 1.5, color: COLOR.classic },
        itemStyle: { color: COLOR.classic },
      },
      {
        name: 'Iteraciones clásico',
        type: 'scatter',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: classic.iterationData
          .filter((it) => Number.isFinite(it.x) && Number.isFinite(it.fx))
          .map((it) => ({ value: [it.x, it.fx], n: it.n })),
        symbolSize: 8,
        itemStyle: { color: COLOR.classic, borderColor: '#0a0d12', borderWidth: 1 },
      },
      {
        name: 'xₙ clásico',
        type: 'line',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: xnSeries(classic),
        showSymbol: true,
        symbolSize: 7,
        lineStyle: { width: 2, color: COLOR.classic },
        itemStyle: { color: COLOR.classic },
      },
    )
  }

  if (constant) {
    series.push(
      {
        name: 'Trayectoria constante',
        type: 'line',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: trajectoryPath(constant.iterationData),
        showSymbol: false,
        lineStyle: { width: 1.5, color: COLOR.constant, type: 'dashed' },
        itemStyle: { color: COLOR.constant },
      },
      {
        name: 'Iteraciones constante',
        type: 'scatter',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: constant.iterationData
          .filter((it) => Number.isFinite(it.x) && Number.isFinite(it.fx))
          .map((it) => ({ value: [it.x, it.fx], n: it.n })),
        symbolSize: 8,
        symbol: 'triangle',
        itemStyle: { color: COLOR.constant, borderColor: '#0a0d12', borderWidth: 1 },
      },
      {
        name: 'xₙ constante',
        type: 'line',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: xnSeries(constant),
        showSymbol: true,
        symbol: 'triangle',
        symbolSize: 7,
        lineStyle: { width: 2, color: COLOR.constant, type: 'dashed' },
        itemStyle: { color: COLOR.constant },
      },
    )
  }

  return {
    legend: {
      top: 4,
      textStyle: { color: COLOR.axis, fontSize: 11 },
      itemWidth: 12,
      itemHeight: 8,
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#141922',
      borderColor: COLOR.line,
      textStyle: { color: '#e3e9f1', fontSize: 12 },
      formatter: (raw) => {
        const p = Array.isArray(raw) ? raw[0] : raw
        const value = p.value
        const extra = p.data && typeof p.data === 'object' && 'n' in p.data ? Number(p.data.n) : undefined
        if (Array.isArray(value) && typeof value[0] === 'number' && typeof value[1] === 'number') {
          const head = extra !== undefined ? `n = ${extra}<br/>` : ''
          return `${p.seriesName}<br/>${head}x = ${tooltipValue(value[0], precision)}<br/>y = ${tooltipValue(value[1], precision)}`
        }
        return String(p.seriesName ?? '')
      },
    },
    grid: [
      { left: 56, right: 28, top: 48, height: '46%' },
      { left: 56, right: 28, top: '68%', height: '22%' },
    ],
    xAxis: [
      { type: 'value', gridIndex: 0, name: 'x', ...axisCommon(), min: xMin, max: xMax },
      { type: 'value', gridIndex: 1, name: 'n', minInterval: 1, ...axisCommon() },
    ],
    yAxis: [
      { type: 'value', gridIndex: 0, name: 'f(x)', scale: true, ...axisCommon() },
      { type: 'value', gridIndex: 1, name: 'xₙ', scale: true, ...axisCommon() },
    ],
    series,
  }
}

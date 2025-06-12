
// src/useAnalysis.js
import { useState, useEffect, useMemo } from 'react'
import { parseCsvFile } from './dataLoader'
import * as analysis from './analysis'

export function useAnalysis({ returnType, windowSize, smoothing, bbMultiplier, rsiPeriod }) {
  const [data, setData] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (windowSize < 1 || bbMultiplier <= 0 || rsiPeriod < 1) return

    setLoading(true)
    fetch('/sample-data.csv')
      .then(res => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.text()
      })
      .then(text => new File([text], 'data.csv', { type: 'text/csv' }))
      .then(parseCsvFile)
      .then(parsed => setData(parsed))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [windowSize, bbMultiplier, rsiPeriod])

  // derive all indicators in useMemo so they only recalc when deps change
  const indicators = useMemo(() => {
    if (!data.length) return {}
    const pricesA = data.map(d => ({ date: d.date, close: d.A_close }))
    const pricesB = data.map(d => ({ date: d.date, close: d.B_close }))
    const rawA = returnType === 'simple'
      ? analysis.calculateDailyReturns(pricesA)
      : analysis.calculateLogReturns(pricesA)
    const rawB = returnType === 'simple'
      ? analysis.calculateDailyReturns(pricesB)
      : analysis.calculateLogReturns(pricesB)

    const maA = smoothing === 'SMA'
      ? analysis.movingAverage(data.map(d => d.A_close), windowSize)
      : analysis.exponentialMovingAverage(data.map(d => d.A_close), windowSize)
    const maB = smoothing === 'SMA'
      ? analysis.movingAverage(data.map(d => d.B_close), windowSize)
      : analysis.exponentialMovingAverage(data.map(d => d.B_close), windowSize)

    const volA = [null, ...analysis.rollingVolatility(rawA.map(r => r.return), windowSize)]
    const volB = [null, ...analysis.rollingVolatility(rawB.map(r => r.return), windowSize)]
    const comparison = analysis.compareDailyPerformance(
      [{ date: pricesA[0].date, return: null }, ...rawA],
      [{ date: pricesB[0].date, return: null }, ...rawB]
    )
    const bandsA = analysis.bollingerBands(data.map(d => d.A_close), windowSize, bbMultiplier)
    const bandsB = analysis.bollingerBands(data.map(d => d.B_close), windowSize, bbMultiplier)
    const maxRsi = Math.max(data.length - 2, 1)
    const effectiveRsi = Math.min(rsiPeriod, maxRsi)
    const rsiA = analysis.relativeStrengthIndex(data.map(d => d.A_close), effectiveRsi)
    const rsiB = analysis.relativeStrengthIndex(data.map(d => d.B_close), effectiveRsi)

    return { rawA, rawB, maA, maB, volA, volB, comparison, bandsA, bandsB, rsiA, rsiB }
  }, [data, returnType, smoothing, windowSize, bbMultiplier, rsiPeriod])

  return { data, loading, error, ...indicators }
}
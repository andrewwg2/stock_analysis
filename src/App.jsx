// src/App.jsx
// Version 1 + Tailwind styling
import React, { useEffect, useState } from 'react'
import { parseCsvFile } from './dataLoader.js'
import {
  calculateDailyReturns,
  calculateLogReturns,
  movingAverage,
  exponentialMovingAverage,
  rollingVolatility,
  compareDailyPerformance,
  bollingerBands,
  relativeStrengthIndex,
} from './analysis.js'

export default function App() {
  const [data, setData] = useState([])
  const [retA, setRetA] = useState([])
  const [retB, setRetB] = useState([])
  const [maA, setMaA] = useState([])
  const [maB, setMaB] = useState([])
  const [volA, setVolA] = useState([])
  const [volB, setVolB] = useState([])
  const [comparison, setComparison] = useState([])
  const [bandsA, setBandsA] = useState([])
  const [bandsB, setBandsB] = useState([])
  const [rsiA, setRsiA] = useState([])
  const [rsiB, setRsiB] = useState([])
  const [error, setError] = useState(null)

  // Controls
  const [windowSizeRaw, setWindowSizeRaw] = useState('5')
  const [returnType, setReturnType] = useState('simple')
  const [smoothing, setSmoothing] = useState('SMA')
  const [bbMultiplierRaw, setBbMultiplierRaw] = useState('2')
  const [rsiPeriodRaw, setRsiPeriodRaw] = useState('14')

  const windowSize = parseInt(windowSizeRaw, 10)
  const bbMultiplier = parseFloat(bbMultiplierRaw)
  const inputRsiPeriod = parseInt(rsiPeriodRaw, 10)
  const smoothingLabel = smoothing === 'SMA' ? 'SMA' : 'EMA'

  useEffect(() => {
    if (isNaN(windowSize) || windowSize < 1) return
    if (isNaN(bbMultiplier) || bbMultiplier <= 0) return
    if (isNaN(inputRsiPeriod) || inputRsiPeriod < 1) return

    async function fetchAndAnalyze() {
      try {
        const resp = await fetch('/sample-data.csv')
        if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`)
        const text = await resp.text()
        const file = new File([text], 'sample-data.csv', { type: 'text/csv' })
        const parsed = await parseCsvFile(file)
        setData(parsed)

        const maxRsiForData = Math.max(parsed.length - 2, 1)
        const effectiveRsi = Math.min(inputRsiPeriod, maxRsiForData)

        const valsA = parsed.map(d => d.A_close)
        const valsB = parsed.map(d => d.B_close)
        const pricesA = parsed.map(d => ({ date: d.date, close: d.A_close }))
        const pricesB = parsed.map(d => ({ date: d.date, close: d.B_close }))

        const rawA = returnType === 'simple'
          ? calculateDailyReturns(pricesA)
          : calculateLogReturns(pricesA)
        const rawB = returnType === 'simple'
          ? calculateDailyReturns(pricesB)
          : calculateLogReturns(pricesB)
        setRetA([{ date: pricesA[0].date, return: null }, ...rawA])
        setRetB([{ date: pricesB[0].date, return: null }, ...rawB])

        setMaA(
          smoothing === 'SMA'
            ? movingAverage(valsA, windowSize)
            : exponentialMovingAverage(valsA, windowSize)
        )
        setMaB(
          smoothing === 'SMA'
            ? movingAverage(valsB, windowSize)
            : exponentialMovingAverage(valsB, windowSize)
        )

        setVolA([null, ...rollingVolatility(rawA.map(r => r.return), windowSize)])
        setVolB([null, ...rollingVolatility(rawB.map(r => r.return), windowSize)])

        setComparison(compareDailyPerformance(
          [{ date: pricesA[0].date, return: null }, ...rawA],
          [{ date: pricesB[0].date, return: null }, ...rawB]
        ))

        setBandsA(bollingerBands(valsA, windowSize, bbMultiplier))
        setBandsB(bollingerBands(valsB, windowSize, bbMultiplier))

        setRsiA(relativeStrengthIndex(valsA, effectiveRsi))
        setRsiB(relativeStrengthIndex(valsB, effectiveRsi))
      } catch (err) {
        setError(err.message)
      }
    }

    fetchAndAnalyze()
  }, [windowSizeRaw, returnType, smoothing, bbMultiplierRaw, rsiPeriodRaw])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-800 text-red-400">
        Error: {error}
      </div>
    )
  }
  if (!data.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-800 text-gray-300">
        Loading…
      </div>
    )
  }

  const maxRsiForDisplay = Math.max(data.length - 2, 1)
  const displayRsiPeriod = Math.min(inputRsiPeriod, maxRsiForDisplay)

  return (
    <div className ="!flex justify-center align-center !min-w-100%">
    <div className="min-h-screen bg-gray-800 text-gray-100 p-6">
      {/* Controls */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <label className="flex flex-col text-sm">
          <span>Return type</span>
          <select
            value={returnType}
            onChange={e => setReturnType(e.target.value)}
            className="mt-1 p-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="simple">Simple</option>
            <option value="log">Log</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <span>Window size</span>
          <input
            type="number"
            min="1"
            placeholder="days"
            value={windowSizeRaw}
            onChange={e => setWindowSizeRaw(e.target.value)}
            className="mt-1 p-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        <label className="flex flex-col text-sm">
          <span>Smoothing</span>
          <select
            value={smoothing}
            onChange={e => setSmoothing(e.target.value)}
            className="mt-1 p-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="SMA">SMA</option>
            <option value="EMA">EMA</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <span>BB Multiplier</span>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={bbMultiplierRaw}
            onChange={e => setBbMultiplierRaw(e.target.value)}
            className="mt-1 p-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        <label className="flex flex-col text-sm">
          <span>RSI Period</span>
          <input
            type="number"
            min="1"
            value={rsiPeriodRaw}
            onChange={e => setRsiPeriodRaw(e.target.value)}
            className="mt-1 p-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
      </div>

      {/* Data table */}
      <div className="overflow-auto rounded-lg border border-gray-700">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              {[
                'Date', 
                'Return A (%)', 
                'Return B (%)',
                `${windowSize}-Day ${smoothingLabel} A`,
                `${windowSize}-Day ${smoothingLabel} B`,
                `${windowSize}-Day Vol A (%)`,
                `${windowSize}-Day Vol B (%)`,
                'BB Upper A', 'BB Middle A', 'BB Lower A',
                'BB Upper B', 'BB Middle B', 'BB Lower B',
                `RSI A (${displayRsiPeriod})`, 
                `RSI B (${displayRsiPeriod})`,
                'Winner'
              ].map((h, idx) => (
                <th
                  key={idx}
                  className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-300"
                  data-testid={h.includes('Day') && h.includes('A') ? 'ma-header-a' : undefined}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.map((row, i) => {
              const pctA = retA[i]?.return != null ? (retA[i].return * 100).toFixed(2) : '–'
              const pctB = retB[i]?.return != null ? (retB[i].return * 100).toFixed(2) : '–'
              const maValA = maA[i] != null ? maA[i].toFixed(2) : '–'
              const maValB = maB[i] != null ? maB[i].toFixed(2) : '–'
              const vA = volA[i] != null ? (volA[i] * 100).toFixed(2) : '–'
              const vB = volB[i] != null ? (volB[i] * 100).toFixed(2) : '–'
              const bA = bandsA[i] || {}
              const bbA = bA.upper != null ? bA.upper.toFixed(2) : '–'
              const bmA = bA.middle != null ? bA.middle.toFixed(2) : '–'
              const blA = bA.lower != null ? bA.lower.toFixed(2) : '–'
              const bB = bandsB[i] || {}
              const bbB = bB.upper != null ? bB.upper.toFixed(2) : '–'
              const bmB = bB.middle != null ? bB.middle.toFixed(2) : '–'
              const blB = bB.lower != null ? bB.lower.toFixed(2) : '–'
              const rAVal = rsiA[i] != null ? rsiA[i].toFixed(2) : '–'
              const rBVal = rsiB[i] != null ? rsiB[i].toFixed(2) : '–'
              const win = comparison[i]?.winner || '–'

              return (
                <tr
                  key={`${row.date}-${i}`}
                  className={i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}
                >
                  {[
                    row.date, pctA, pctB, maValA, maValB,
                    vA, vB, bbA, bmA, blA, bbB, bmB, blB, rAVal, rBVal, win
                  ].map((cell, idx) => (
                    <td key={idx} className="px-3 py-2 whitespace-nowrap text-sm text-gray-200">
                      {cell}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  
  )
}

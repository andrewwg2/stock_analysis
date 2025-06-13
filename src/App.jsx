// src/App.jsx
import React, { useState } from 'react'
import { useAnalysis } from './useAnalysis'

export default function App() {
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

  // Fetch & compute via custom hookheader
  const {
    data,
    loading,
    error,
    rawA: retA,
    rawB: retB,
    maA,
    maB,
    volA,
    volB,
    comparison,
    bandsA,
    bandsB,
    rsiA,
    rsiB,
  } = useAnalysis({
    returnType,
    windowSize,
    smoothing,
    bbMultiplier,
    rsiPeriod: inputRsiPeriod,
  })

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-800 text-red-400">
        Error: {error}
      </div>
    )
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-800 text-gray-300">
        Loading…
      </div>
    )
  }

  const maxRsiForDisplay = Math.max(data.length - 2, 1)
  const displayRsiPeriod = Math.min(inputRsiPeriod, maxRsiForDisplay)

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-7xl space-y-6 text-gray-100">
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
                  'BB Upper A',
                  'BB Middle A',
                  'BB Lower A',
                  'BB Upper B',
                  'BB Middle B',
                  'BB Lower B',
                  `RSI A (${displayRsiPeriod})`,
                  `RSI B (${displayRsiPeriod})`,
                  'Winner',
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
                const pctA =
                  retA[i]?.return != null ? (retA[i].return * 100).toFixed(2) : '–'
                const pctB =
                  retB[i]?.return != null ? (retB[i].return * 100).toFixed(2) : '–'
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
                      row.date,
                      pctA,
                      pctB,
                      maValA,
                      maValB,
                      vA,
                      vB,
                      bbA,
                      bmA,
                      blA,
                      bbB,
                      bmB,
                      blB,
                      rAVal,
                      rBVal,
                      win,
                    ].map((cell, idx2) => (
                      <td
                        key={idx2}
                        className="px-3 py-2 whitespace-nowrap text-sm text-gray-200"
                      >
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
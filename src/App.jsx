// src/App.jsx
// Version 1
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

        // determine effective RSI period
        const maxRsiForData = Math.max(parsed.length - 2, 1)
        const effectiveRsi = Math.min(inputRsiPeriod, maxRsiForData)

        // price arrays
        const valsA = parsed.map(d => d.A_close)
        const valsB = parsed.map(d => d.B_close)
        const pricesA = parsed.map(d => ({ date: d.date, close: d.A_close }))
        const pricesB = parsed.map(d => ({ date: d.date, close: d.B_close }))

        // returns
        const rawA = returnType === 'simple'
          ? calculateDailyReturns(pricesA)
          : calculateLogReturns(pricesA)
        const rawB = returnType === 'simple'
          ? calculateDailyReturns(pricesB)
          : calculateLogReturns(pricesB)
        const fullA = [{ date: pricesA[0].date, return: null }, ...rawA]
        const fullB = [{ date: pricesB[0].date, return: null }, ...rawB]
        setRetA(fullA)
        setRetB(fullB)

        // moving averages
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

        // rolling volatility
        const volRawA = rollingVolatility(rawA.map(r => r.return), windowSize)
        const volRawB = rollingVolatility(rawB.map(r => r.return), windowSize)
        setVolA([null, ...volRawA])
        setVolB([null, ...volRawB])

        // comparison
        setComparison(compareDailyPerformance(fullA, fullB))

        // Bollinger Bands
        setBandsA(bollingerBands(valsA, windowSize, bbMultiplier))
        setBandsB(bollingerBands(valsB, windowSize, bbMultiplier))

        // RSI using effective period
        setRsiA(relativeStrengthIndex(valsA, effectiveRsi))
        setRsiB(relativeStrengthIndex(valsB, effectiveRsi))
      } catch (err) {
        setError(err.message)
      }
    }

    fetchAndAnalyze()
  }, [windowSizeRaw, returnType, smoothing, bbMultiplierRaw, rsiPeriodRaw])

  if (error) return <div>Error: {error}</div>
  if (!data.length) return <div>Loading…</div>

  // determine header label
  const maxRsiForDisplay = Math.max(data.length - 2, 1)
  const displayRsiPeriod = Math.min(inputRsiPeriod, maxRsiForDisplay)

  return (
    <div>
      {/* Controls */}
      <div style={{ marginBottom: 16 }}>
        <label>
          Return type:
          <select
            value={returnType}
            onChange={e => setReturnType(e.target.value)}
            style={{ marginLeft: 4 }}
          >
            <option value="simple">Simple</option>
            <option value="log">Log</option>
          </select>
        </label>

        <label style={{ marginLeft: 16 }}>
          Window size:
          <input
            type="number"
            min="1"
            placeholder="days"
            value={windowSizeRaw}
            onChange={e => setWindowSizeRaw(e.target.value)}
            style={{ width: 60, marginLeft: 4 }}
          />
        </label>

        <label style={{ marginLeft: 16 }}>
          Smoothing:
          <select
            value={smoothing}
            onChange={e => setSmoothing(e.target.value)}
            style={{ marginLeft: 4 }}
          >
            <option value="SMA">SMA</option>
            <option value="EMA">EMA</option>
          </select>
        </label>

        <label style={{ marginLeft: 16 }}>
          BB Multiplier:
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={bbMultiplierRaw}
            onChange={e => setBbMultiplierRaw(e.target.value)}
            style={{ width: 60, marginLeft: 4 }}
          />
        </label>

        <label style={{ marginLeft: 16 }}>
          RSI Period:
          <input
            type="number"
            min="1"
            value={rsiPeriodRaw}
            onChange={e => setRsiPeriodRaw(e.target.value)}
            style={{ width: 60, marginLeft: 4 }}
          />
        </label>
      </div>

      {/* Data table */}
      <table border="1" cellPadding="4" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Return A (%)</th>
            <th>Return B (%)</th>
            <th data-testid="ma-header-a">{windowSize}-Day {smoothingLabel} A</th>
            <th data-testid="ma-header-b">{windowSize}-Day {smoothingLabel} B</th>
            <th>{windowSize}-Day Vol A (%)</th>
            <th>{windowSize}-Day Vol B (%)</th>
            <th>BB Upper A</th>
            <th>BB Middle A</th>
            <th>BB Lower A</th>
            <th>BB Upper B</th>
            <th>BB Middle B</th>
            <th>BB Lower B</th>
            <th>RSI A ({displayRsiPeriod})</th>
            <th>RSI B ({displayRsiPeriod})</th>
            <th>Winner</th>
          </tr>
        </thead>
        <tbody>
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
              <tr key={`${row.date}-${i}`}>
                <td>{row.date}</td>
                <td>{pctA}</td>
                <td>{pctB}</td>
                <td>{maValA}</td>
                <td>{maValB}</td>
                <td>{vA}</td>
                <td>{vB}</td>
                <td>{bbA}</td>
                <td>{bmA}</td>
                <td>{blA}</td>
                <td>{bbB}</td>
                <td>{bmB}</td>
                <td>{blB}</td>
                <td>{rAVal}</td>
                <td>{rBVal}</td>
                <td>{win}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

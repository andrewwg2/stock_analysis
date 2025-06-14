// Test to verify refactored functions produce same results as originals
import * as originalAnalysis from '../inputs/stock_analysis/src/analysis.js'
import * as refactoredAnalysis from './analysis.js'

// Test data
const testValues = [100, 105, 110, 108, 112, 115, 113, 118, 120, 125]
const testPrices = testValues.map((close, i) => ({
  date: `2024-01-${String(i + 1).padStart(2, '0')}`,
  close
}))

// Test helper function
function arraysEqual(a, b) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] === null && b[i] === null) continue
    if (a[i] === null || b[i] === null) return false
    if (typeof a[i] === 'object' && typeof b[i] === 'object') {
      if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return false
    } else if (Math.abs(a[i] - b[i]) > 0.0000001) {
      return false
    }
  }
  return true
}

// Run tests
console.log('Testing refactored analysis functions...\n')

// Test 1: Moving Average
console.log('1. Testing movingAverage...')
const windowSize = 3
const originalMA = originalAnalysis.movingAverage(testValues, windowSize)
const refactoredMA = refactoredAnalysis.movingAverage(testValues, windowSize)
console.log('Original MA:', originalMA)
console.log('Refactored MA:', refactoredMA)
console.log('Match:', arraysEqual(originalMA, refactoredMA) ? '✓' : '✗')
console.log()

// Test 2: Rolling Volatility
console.log('2. Testing rollingVolatility...')
const returns = testPrices.slice(1).map((p, i) => 
  (p.close - testPrices[i].close) / testPrices[i].close
)
const originalVol = originalAnalysis.rollingVolatility(returns, windowSize)
const refactoredVol = refactoredAnalysis.rollingVolatility(returns, windowSize)
console.log('Original Vol:', originalVol)
console.log('Refactored Vol:', refactoredVol)
console.log('Match:', arraysEqual(originalVol, refactoredVol) ? '✓' : '✗')
console.log()

// Test 3: Bollinger Bands
console.log('3. Testing bollingerBands...')
const multiplier = 2
const originalBands = originalAnalysis.bollingerBands(testValues, windowSize, multiplier)
const refactoredBands = refactoredAnalysis.bollingerBands(testValues, windowSize, multiplier)
console.log('Original Bands (first 3):', originalBands.slice(0, 3))
console.log('Refactored Bands (first 3):', refactoredBands.slice(0, 3))
const bandsMatch = originalBands.every((band, i) => {
  const rBand = refactoredBands[i]
  if (band.upper === null) return rBand.upper === null
  return Math.abs(band.upper - rBand.upper) < 0.0000001 &&
         Math.abs(band.middle - rBand.middle) < 0.0000001 &&
         Math.abs(band.lower - rBand.lower) < 0.0000001
})
console.log('Match:', bandsMatch ? '✓' : '✗')
console.log()

// Test 4: RSI (if enough data)
if (testValues.length >= 4) {
  console.log('4. Testing relativeStrengthIndex...')
  const period = 3
  try {
    const originalRSI = originalAnalysis.relativeStrengthIndex(testValues, period)
    const refactoredRSI = refactoredAnalysis.relativeStrengthIndex(testValues, period)
    console.log('Original RSI:', originalRSI)
    console.log('Refactored RSI:', refactoredRSI)
    console.log('Match:', arraysEqual(originalRSI, refactoredRSI) ? '✓' : '✗')
  } catch (e) {
    console.log('Error:', e.message)
  }
  console.log()
}

// Test 5: Functions that don't use windowing (should remain unchanged)
console.log('5. Testing non-windowed functions...')
const originalDailyReturns = originalAnalysis.calculateDailyReturns(testPrices)
const refactoredDailyReturns = refactoredAnalysis.calculateDailyReturns(testPrices)
const dailyReturnsMatch = originalDailyReturns.every((ret, i) => {
  const rRet = refactoredDailyReturns[i]
  return ret.date === rRet.date && Math.abs(ret.return - rRet.return) < 0.0000001
})
console.log('calculateDailyReturns Match:', dailyReturnsMatch ? '✓' : '✗')

const originalLogReturns = originalAnalysis.calculateLogReturns(testPrices)
const refactoredLogReturns = refactoredAnalysis.calculateLogReturns(testPrices)
const logReturnsMatch = originalLogReturns.every((ret, i) => {
  const rRet = refactoredLogReturns[i]
  return ret.date === rRet.date && Math.abs(ret.return - rRet.return) < 0.0000001
})
console.log('calculateLogReturns Match:', logReturnsMatch ? '✓' : '✗')

console.log('\nAll tests complete!')

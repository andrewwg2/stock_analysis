// src/analysis.js
// Version 2 - Refactored with windowedValues helper

/**
 * Helper function to apply a calculation function over a sliding window
 * values: [T, …] - array of values to process
 * windowSize: integer - size of the sliding window
 * fn: (slice: T[]) => U - function to apply to each window
 * returns: [U | null, …] - results with null for positions before window is complete
 */
function windowedValues(values, windowSize, fn) {
  if (windowSize < 1) throw new Error('windowSize must be ≥1')
  
  return values.map((_, i, arr) => {
    if (i < windowSize - 1) return null
    const slice = arr.slice(i - windowSize + 1, i + 1)
    return fn(slice)
  })
}

/**
 * prices: [{ date, close }, …]
 * returns: [{ date, return }, …]
 */
export function calculateDailyReturns(prices) {
  if (prices.length < 2) throw new Error('Need ≥2 data points')
  return prices.slice(1).map((p, i) => ({
    date: p.date,
    return: (p.close - prices[i].close) / prices[i].close
  }))
}

/**
 * values: [number, …], windowSize: integer
 * returns: [null, …, average, …]
 */
export function movingAverage(values, windowSize) {
  return windowedValues(values, windowSize, slice => {
    const sum = slice.reduce((a, b) => a + b, 0)
    return sum / slice.length
  })
}

/**
 * returnsArr: [number, …]  (daily returns as decimals)
 * windowSize: integer
 * returns: [null, …, volatility, …]  (std-dev over window)
 */
export function rollingVolatility(returnsArr, windowSize) {
  return windowedValues(returnsArr, windowSize, slice => {
    const mean = slice.reduce((sum, r) => sum + r, 0) / slice.length
    const variance = slice.reduce((sum, r) => sum + (r - mean) ** 2, 0) / slice.length
    return Math.sqrt(variance)
  })
}

/**
 * prices: [{ date, close }, …]
 * returns: [{ date, return }, …]
 */
export function calculateLogReturns(prices) {
  if (prices.length < 2) throw new Error('Need ≥2 data points')
  return prices.slice(1).map((p, i) => ({
    date: p.date,
    return: Math.log(p.close / prices[i].close)
  }))
}

/**
 * values: [number, …], windowSize: integer
 * returns: [number, …]  (EMA for each point)
 */
export function exponentialMovingAverage(values, windowSize) {
  if (windowSize < 1) throw new Error('windowSize must be ≥1')
  
  const smoothingFactor = 2 / (windowSize + 1)
  const result = []
  
  // Initialize with SMA for the first window
  let sma = null
  if (values.length >= windowSize) {
    sma = values.slice(0, windowSize).reduce((sum, val) => sum + val, 0) / windowSize
  }
  
  for (let i = 0; i < values.length; i++) {
    if (i < windowSize - 1) {
      result.push(null)
      continue
    }
    
    if (i === windowSize - 1) {
      result.push(sma)
      continue
    }
    
    // EMA = Current price * smoothing factor + Previous EMA * (1 - smoothing factor)
    result.push(values[i] * smoothingFactor + result[i - 1] * (1 - smoothingFactor))
  }
  
  return result
}

/**
 * returnsA: [{ date, return }, …], returnsB: [{ date, return }, …]
 * returns: [{ date, winner }, …]
 */
export function compareDailyPerformance(returnsA, returnsB) {
  if (returnsA.length !== returnsB.length) throw new Error('Series must be same length')
  
  return returnsA.map((item, i) => {
    const returnA = item.return
    const returnB = returnsB[i].return
    
    let winner = null
    if (returnA !== null && returnB !== null) {
      if (returnA > returnB) winner = 'A'
      else if (returnB > returnA) winner = 'B'
      else winner = 'tie'
    }
    
    return {
      date: item.date,
      winner
    }
  })
}

/**
 * values: [number, …]
 * returns: standard deviation of the values
 */
export function priceStdDev(values) {
  if (values.length < 2) throw new Error('Need ≥2 data points')
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}

/**
 * values: [number, …], windowSize: integer, multiplier: number
 * returns: [{ upper, middle, lower }, …]
 */
export function bollingerBands(values, windowSize, multiplier) {
  return windowedValues(values, windowSize, slice => {
    const middle = slice.reduce((sum, val) => sum + val, 0) / slice.length
    
    // Calculate standard deviation for the window
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / slice.length
    const stdDev = Math.sqrt(variance)
    
    return {
      upper: middle + (multiplier * stdDev),
      middle,
      lower: middle - (multiplier * stdDev)
    }
  }).map(band => band || { upper: null, middle: null, lower: null })
}

/**
 * values: [number, …], period: integer
 * returns: [number, …]  (RSI values using a sliding window approach)
 */
export function relativeStrengthIndex(values, period) {
  if (period < 1) throw new Error('period must be ≥1')
  if (values.length < period + 1) throw new Error('Need more data points for RSI calculation')
  
  // Calculate price changes
  const changes = []
  for (let i = 1; i < values.length; i++) {
    changes.push(values[i] - values[i - 1])
  }
  
  // Use windowedValues for initial RSI calculations
  const initialRsi = windowedValues(changes.slice(0, period), period, slice => {
    let avgGain = 0
    let avgLoss = 0
    
    for (const change of slice) {
      if (change > 0) avgGain += change
      else if (change < 0) avgLoss += Math.abs(change)
    }
    
    avgGain /= period
    avgLoss /= period
    
    const rs = avgGain / (avgLoss === 0 ? 1 : avgLoss)
    return 100 - (100 / (1 + rs))
  })
  
  // Build result array with proper positioning
  const result = Array(values.length).fill(null)
  
  // Set the first RSI value
  if (initialRsi[period - 1] !== null) {
    result[period] = initialRsi[period - 1]
    
    // Calculate initial averages for Wilder's smoothing
    let avgGain = 0
    let avgLoss = 0
    
    for (let i = 0; i < period; i++) {
      const change = changes[i]
      if (change > 0) avgGain += change
      else if (change < 0) avgLoss += Math.abs(change)
    }
    
    avgGain /= period
    avgLoss /= period
    
    // Use Wilder's smoothing for subsequent values
    for (let i = period + 1; i < values.length; i++) {
      const change = changes[i - 1]
      const gain = change > 0 ? change : 0
      const loss = change < 0 ? Math.abs(change) : 0
      
      // Wilder's smoothing formula
      avgGain = ((avgGain * (period - 1)) + gain) / period
      avgLoss = ((avgLoss * (period - 1)) + loss) / period
      
      const rs = avgGain / (avgLoss === 0 ? 1 : avgLoss)
      result[i] = 100 - (100 / (1 + rs))
    }
  }
  
  return result
}

// Export the helper for potential external use or testing
export { windowedValues }

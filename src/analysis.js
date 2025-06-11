// src/analysis.js
//Version 1
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
  if (windowSize < 1) throw new Error('windowSize must be ≥1')
  return values.map((_, i, arr) => {
    if (i < windowSize - 1) return null
    const slice = arr.slice(i - windowSize + 1, i + 1)
    const sum = slice.reduce((a, b) => a + b, 0)
    return sum / windowSize
  })
}

/**
 * returnsArr: [number, …]  (daily returns as decimals)
 * windowSize: integer
 * returns: [null, …, volatility, …]  (std-dev over window)
 */
export function rollingVolatility(returnsArr, windowSize) {
  if (windowSize < 1) throw new Error('windowSize must be ≥1')
  return returnsArr.map((_, i, arr) => {
    if (i < windowSize - 1) return null
    const slice = arr.slice(i - windowSize + 1, i + 1)
    const mean = slice.reduce((sum, r) => sum + r, 0) / windowSize
    const variance =
      slice.reduce((sum, r) => sum + (r - mean) ** 2, 0) / windowSize
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
  if (windowSize < 1) throw new Error('windowSize must be ≥1')
  
  const result = []
  
  for (let i = 0; i < values.length; i++) {
    if (i < windowSize - 1) {
      result.push({ upper: null, middle: null, lower: null })
      continue
    }
    
    const slice = values.slice(i - windowSize + 1, i + 1)
    const middle = slice.reduce((sum, val) => sum + val, 0) / windowSize
    
    // Calculate standard deviation for the window
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / windowSize
    const stdDev = Math.sqrt(variance)
    
    result.push({
      upper: middle + (multiplier * stdDev),
      middle,
      lower: middle - (multiplier * stdDev)
    })
  }
  
  return result
}

/**
 * values: [number, …], period: integer
 * returns: [number, …]  (RSI values)
 */
export function relativeStrengthIndex(values, period) {
  if (period < 1) throw new Error('period must be ≥1')
  if (values.length < period + 1) throw new Error('Need more data points for RSI calculation')
  
  const result = Array(values.length).fill(null)
  
  // Calculate price changes
  const changes = []
  for (let i = 1; i < values.length; i++) {
    changes.push(values[i] - values[i - 1])
  }
  
  // Initial averages using first 'period' changes
  let avgGain = 0
  let avgLoss = 0
  
  for (let i = 0; i < period; i++) {
    const change = changes[i]
    if (change > 0) avgGain += change
    else if (change < 0) avgLoss += Math.abs(change)
  }
  
  avgGain /= period
  avgLoss /= period
  
  // Calculate first RSI
  let rs = avgGain / (avgLoss === 0 ? 1 : avgLoss)
  result[period] = 100 - (100 / (1 + rs))
  
  // Use Wilder's smoothing for subsequent values
  for (let i = period + 1; i < values.length; i++) {
    const change = changes[i - 1]
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? Math.abs(change) : 0
    
    // Wilder's smoothing formula
    avgGain = ((avgGain * (period - 1)) + gain) / period
    avgLoss = ((avgLoss * (period - 1)) + loss) / period
    
    rs = avgGain / (avgLoss === 0 ? 1 : avgLoss)
    result[i] = 100 - (100 / (1 + rs))
  }
  
  return result
}
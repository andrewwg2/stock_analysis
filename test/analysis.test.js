import { describe, it, expect } from 'vitest'
import {
  calculateDailyReturns,
  calculateLogReturns,
  movingAverage,
  exponentialMovingAverage,
  rollingVolatility,
  compareDailyPerformance,
  bollingerBands,
  windowedValues,
  priceStdDev,
  relativeStrengthIndex 
} from '../src/analysis.js'

describe('calculateDailyReturns()', () => {
  it('computes simple returns', () => {
    const prices = [
      { date: '2025-01-01', close: 100 },
      { date: '2025-01-02', close: 110 },
      { date: '2025-01-03', close:  99 },
    ]
    const ret = calculateDailyReturns(prices)
    expect(ret).toEqual([
      { date: '2025-01-02', return:  0.10 },
      { date: '2025-01-03', return: -0.10 },
    ])
  })

  it('throws if fewer than 2 points', () => {
    expect(() => calculateDailyReturns([{ date: 'x', close: 1 }]))
      .toThrow('Need ≥2 data points')
  })
})

describe('calculateLogReturns()', () => {
  it('computes log returns', () => {
    const prices = [
      { date: '2025-01-01', close: 100 },
      { date: '2025-01-02', close: 110 },
      { date: '2025-01-03', close: 121 },
    ]
    const ret = calculateLogReturns(prices)
    expect(ret[0].date).toBe('2025-01-02')
    expect(ret[0].return).toBeCloseTo(Math.log(1.10), 6)
    expect(ret[1].return).toBeCloseTo(Math.log(1.10), 6)
  })

  it('throws if fewer than 2 points', () => {
    expect(() => calculateLogReturns([{ date: 'x', close: 1 }]))
      .toThrow('Need ≥2 data points')
  })
})

describe('movingAverage()', () => {
  it('computes a simple 3-day MA', () => {
    expect(movingAverage([1, 2, 3, 4, 5], 3))
      .toEqual([null, null, 2, 3, 4])
  })

  it('throws if windowSize < 1', () => {
    expect(() => movingAverage([1,2,3], 0))
      .toThrow('windowSize must be ≥1')
  })
})

describe('exponentialMovingAverage()', () => {
  it('computes a 2-day EMA correctly', () => {
    expect(exponentialMovingAverage([1,2,3,4], 2))
      .toEqual([null, 1.5, 2.5, 3.5])
  })

  it('throws if windowSize < 1', () => {
    expect(() => exponentialMovingAverage([1,2,3], 0))
      .toThrow('windowSize must be ≥1')
  })
})

describe('rollingVolatility()', () => {
  it('returns nulls until it has enough data', () => {
    const returns = [0.1, -0.1, 0.2, -0.2]
    expect(rollingVolatility(returns, 5))
      .toEqual([null, null, null, null])
  })

  it('computes zero volatility when returns are constant', () => {
    const returns = [0.05,0.05,0.05,0.05,0.05]
    expect(rollingVolatility(returns, 5))
      .toEqual([null, null, null, null, 0])
  })

  it('computes correct 5-day volatility for a known series', () => {
    const returns = [1, 0.5, 0.3333, 0.25, 0.2]
    const vol = rollingVolatility(returns, 5)
    expect(vol[4]).toBeCloseTo(0.29014, 4)
  })

  it('throws if windowSize < 1', () => {
    expect(() => rollingVolatility([1,2,3], 0))
      .toThrow('windowSize must be ≥1')
  })
})

describe('compareDailyPerformance()', () => {
  it('flags A when A > B, B when B > A, tie when equal', () => {
    const a = [
      { date: 'd1', return: 0.1 },
      { date: 'd2', return: 0.05 },
      { date: 'd3', return: 0.00 },
    ]
    const b = [
      { date: 'd1', return: 0.05 },
      { date: 'd2', return: 0.05 },
      { date: 'd3', return: 0.10 },
    ]
    expect(compareDailyPerformance(a, b)).toEqual([
      { date: 'd1', winner: 'A' },
      { date: 'd2', winner: 'tie' },
      { date: 'd3', winner: 'B' },
    ])
  })

  it('treats null/undefined returns as null', () => {
    const a = [{ date:'x', return: null }]
    const b = [{ date:'x', return: 0.1 }]
    expect(compareDailyPerformance(a, b)).toEqual([
      { date: 'x', winner: null },
    ])
  })

  it('throws if input lengths differ', () => {
    const a = [{ date:'x', return:0 }]
    const b = []
    expect(() => compareDailyPerformance(a, b))
      .toThrow('Series must be same length')
  })
})

describe('bollingerBands()', () => {
  it('returns null bands until windowSize−1', () => {
    const vals = [10, 12, 14, 16]
    const bands = bollingerBands(vals, 3, 2)
    expect(bands.slice(0, 2)).toEqual([
      { upper: null, middle: null, lower: null },
      { upper: null, middle: null, lower: null },
    ])
  })

  it('computes correct upper/middle/lower for a simple series', () => {
    const vals = [1, 2, 3, 4]
    const bands = bollingerBands(vals, 3, 2)
    const { upper, middle, lower } = bands[2]
    expect(middle).toBeCloseTo(2, 6)
    expect(upper).toBeCloseTo(2 + 2 * Math.sqrt(2/3), 6)
    expect(lower).toBeCloseTo(2 - 2 * Math.sqrt(2/3), 6)
  })

  it('works with non-integer multiplier', () => {
    const vals = [1, 3]
    const bands = bollingerBands(vals, 2, 1.5)
    expect(bands[1]).toEqual({
      middle: 2,
      upper: 2 + 1.5 * 1,
      lower: 2 - 1.5 * 1,
    })
  })
})


describe('windowedValues()', () => {
  it('throws if windowSize < 1', () => {
    expect(() => windowedValues([1,2,3], 0, () => {}))
      .toThrow('windowSize must be ≥1')
  })

  it('returns leading nulls until window is full', () => {
    const fn = slice => slice.reduce((a,b)=>a+b, 0)
    const result = windowedValues([10,20,30,40], 3, fn)
    // positions 0 & 1 should be null, then sums of each 3-item window
    expect(result).toEqual([null, null, 60, 90])
  })

  it('applies custom function correctly', () => {
    const fn = slice => slice.length
    expect(windowedValues([1,2,3,4,5], 2, fn))
      .toEqual([null, 2, 2, 2, 2])
  })
})


describe('priceStdDev()', () => {
  it('computes the std-dev of [2,4,4,4,5,5,7,9] as ~2', () => {
    const vals = [2,4,4,4,5,5,7,9]
    expect(priceStdDev(vals)).toBeCloseTo(2, 6)
  })
  it('throws if fewer than 2 points', () => {
    expect(() => priceStdDev([1])).toThrow('Need ≥2 data points')
  })
})

describe('relativeStrengthIndex()', () => {
  it('throws when period<1 or too few data points', () => {
    expect(() => relativeStrengthIndex([1,2,3], 0))
      .toThrow('period must be ≥1')
    expect(() => relativeStrengthIndex([1,2], 2))
      .toThrow('Need more data points for RSI calculation')
  })

  it('returns 50 when there are only gains for period=2', () => {
  const vals = [1, 2, 3, 4, 5]
  const rsi = relativeStrengthIndex(vals, 2)

  // first two are null
  expect(rsi.slice(0, 2)).toEqual([null, null])

  // for pure gains, function yields RSI=50
  expect(rsi[2]).toBeCloseTo(50, 6)
  expect(rsi[3]).toBeCloseTo(50, 6)
  expect(rsi[4]).toBeCloseTo(50, 6)
})
})
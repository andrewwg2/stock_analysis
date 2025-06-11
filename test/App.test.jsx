
/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from '../src/App.jsx'
import { relativeStrengthIndex } from '../src/analysis.js'

// Stub fetch for any CSV the app requests
vi.stubGlobal('fetch', vi.fn(() => {
  const csv = `date,A_close,B_close
2025-01-01,10,10
2025-01-02,20,10
2025-01-03,30,20
2025-01-04,40,30
2025-01-05,50,40
2025-01-06,60,50
`
  return Promise.resolve({ ok: true, text: async () => csv })
}))

describe('App.jsx interactive controls', () => {
  it('toggles simple vs log returns on the fly', async () => {
    render(<App />)

    // wait for the date cell to appear
    await waitFor(() => screen.getByText('2025-01-02'))

    // find the A-return cell in that row
    const row = screen.getByText('2025-01-02').closest('tr')
    const aReturnCell = row.querySelector('td:nth-child(2)')
    expect(aReturnCell).toHaveTextContent('100.00')

    // select log returns
    await userEvent.selectOptions(
      screen.getByLabelText(/Return type/i),
      'log'
    )

    // now that same cell should show ~69.31
    await waitFor(() => {
      expect(aReturnCell).toHaveTextContent('69.31')
    })
  })

  it('updates MA headers when window size and smoothing change', async () => {
    render(<App />)

    // initial MA header
    const headerA = await screen.findByTestId('ma-header-a')
    expect(headerA).toHaveTextContent('5-Day SMA A')

    // change window size to 3
    const input = screen.getByPlaceholderText(/days/i)
    await userEvent.clear(input)
    await userEvent.type(input, '3')

    // change smoothing to EMA
    await userEvent.selectOptions(
      screen.getByLabelText(/Smoothing/i),
      'EMA'
    )

    // headers should update
    await waitFor(() => {
      expect(screen.getByTestId('ma-header-a')).toHaveTextContent('3-Day EMA A')
      expect(screen.getByTestId('ma-header-b')).toHaveTextContent('3-Day EMA B')
    })
  })
})

describe('relativeStrengthIndex()', () => {
  it('returns all nulls if series shorter than period+1', () => {
    const vals = [10, 12, 14]
    // default period=14 needs at least 15 points → all nulls
    const rsi = relativeStrengthIndex(vals)
    expect(rsi).toEqual([null, null, null])
  })

  it('computes a full RSI series for period=3', () => {
    const vals = [1, 2, 3, 4, 5]
    // deltas=[1,1,1,1], period=3
    const rsi = relativeStrengthIndex(vals, 3)
    // length matches values
    expect(rsi).toHaveLength(5)
    // first 3 entries are null (need 3 deltas to seed)
    expect(rsi.slice(0, 3)).toEqual([null, null, null])
    // for constant positive moves, avgLoss=0 ⇒ RSI=100 thereafter
    expect(rsi[3]).toBeCloseTo(100, 6)
    expect(rsi[4]).toBeCloseTo(100, 6)
  })

  it('handles period=1 by yielding [null, 0, 100]', () => {
    const vals = [10, 8, 12]
    // deltas=[-2,4], period=1
    const rsi = relativeStrengthIndex(vals, 1)
    // first bar → null, second → all-loss ⇒ 0, third → all-gain ⇒ 100
    expect(rsi).toEqual([null, 0, 100])
  })

  it('computes RSI≈50 when gains equal losses (period=2)', () => {
    const vals = [100, 105, 100]
    // deltas=[5,-5], period=2 ⇒ avgGain=2.5, avgLoss=2.5 ⇒ RSI=50
    const rsi = relativeStrengthIndex(vals, 2)
    expect(rsi).toEqual([null, null, 50])
  })
})
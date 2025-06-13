/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from '../src/App.jsx'

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

    // wait for the very first date cell
    await waitFor(() => screen.getByText('2025-01-01'))

    const row = screen.getByText('2025-01-01').closest('tr')
    const aReturnCell = row.querySelector('td:nth-child(2)')
    expect(aReturnCell).toHaveTextContent('100.00')

    await userEvent.selectOptions(
      screen.getByLabelText(/Return type/i),
      'log'
    )

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
    const daysInput = screen.getByPlaceholderText(/days/i)
    fireEvent.change(daysInput, { target: { value: '3' } })

    // wait until it re-renders the new SMA header
    await waitFor(() => {
      expect(screen.getByTestId('ma-header-a')).toHaveTextContent('3-Day SMA A')
    })

    // now switch smoothing to EMA
    await userEvent.selectOptions(
      screen.getByLabelText(/Smoothing/i),
      'EMA'
    )

    // finally, wait for EMA headers to appear
    await waitFor(() => {
      expect(screen.getByTestId('ma-header-a')).toHaveTextContent('3-Day EMA A')
      expect(screen.getByTestId('ma-header-b')).toHaveTextContent('3-Day EMA B')
    })
  })
})

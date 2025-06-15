/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from '../src/App.jsx'

// A small CSV fixture
const csv = `date,A_close,B_close
2025-01-01,10,10
2025-01-02,20,10
2025-01-03,30,20
2025-01-04,40,30
2025-01-05,50,40
2025-01-06,60,50
`

describe('App – loading & data display', () => {
  beforeEach(() => {
    // mock fetch to return our CSV
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, text: async () => csv })
    ))
  })

  it('shows Loading… then renders the table', async () => {
    render(<App />)
    // initial loading state
    expect(screen.getByText('Loading…')).toBeInTheDocument()

    // wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading…')).not.toBeInTheDocument()
    })

    // check a few cells in the rendered table
    expect(screen.getByText('2025-01-01')).toBeInTheDocument()
    // For the row labeled 2025-01-02, the code shows (30-20)/20 = 0.5 → 50.00
    const firstRow = screen.getByText('2025-01-02').closest('tr')
    expect(firstRow.querySelector('td:nth-child(2)')).toHaveTextContent('50.00')
  })

  it('toggles simple vs log returns', async () => {
    render(<App />)
    // wait for table
    await waitFor(() => screen.getByText('2025-01-01'))

    const row = screen.getByText('2025-01-02').closest('tr')
    const aReturnCell = row.querySelector('td:nth-child(2)')
    // simple return → 50.00
    expect(aReturnCell).toHaveTextContent('50.00')

    // switch to Log
    await userEvent.selectOptions(
      screen.getByLabelText(/Return type/i),
      'log'
    )

    await waitFor(() => {
      // Now it shows Math.log(30/20)*100 ≈ 40.55
      expect(aReturnCell).toHaveTextContent('40.55')
    })
  })

  it('updates MA headers when windowSize and smoothing change', async () => {
    render(<App />)
    // wait for table
    await waitFor(() => screen.getByText('2025-01-01'))

    // initial MA header (first of possibly multiple)
    const [initialA] = await screen.findAllByTestId('ma-header-a')
    expect(initialA).toHaveTextContent('5-Day SMA A')

    // change window size to 3
    const daysInput = screen.getByPlaceholderText(/days/i)
    fireEvent.change(daysInput, { target: { value: '3' } })

    // wait for SMA update
    await waitFor(() => {
      const [smaA] = screen.getAllByTestId('ma-header-a')
      expect(smaA).toHaveTextContent('3-Day SMA A')
    })

    // change smoothing to EMA
    await userEvent.selectOptions(
      screen.getByLabelText(/Smoothing/i),
      'EMA'
    )

    // wait for EMA update
    await waitFor(() => {
      const [emaA] = screen.getAllByTestId('ma-header-a')
      expect(emaA).toHaveTextContent('3-Day EMA A')
    })
  })
})

describe('App – error state', () => {
  beforeEach(() => {
    // mock fetch to fail
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: false, status: 500 })
    ))
  })

  it('displays an error if fetch fails', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('Error: 500')).toBeInTheDocument()
    })
  })
})

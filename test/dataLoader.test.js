import { describe, it, expect } from 'vitest'
import { parseCsvFile } from '../src/dataLoader.js'

function makeFile(content) {
  return new File([content], 'test.csv', { type: 'text/csv' })
}

describe('parseCsvFile()', () => {
  it('parses header & numeric conversion', async () => {
    const csv = `date,close,volume
2025-01-01,100,1234
2025-01-02,110,5678`
    const data = await parseCsvFile(makeFile(csv))
    expect(data).toEqual([
      { date: '2025-01-01', close: 100, volume: 1234 },
      { date: '2025-01-02', close: 110, volume: 5678 },
    ])
  })

  it('trims whitespace & keeps strings', async () => {
    const csv = `foo,bar
  hello , world `
    const data = await parseCsvFile(makeFile(csv))
    expect(data).toEqual([{ foo: 'hello', bar: 'world' }])
  })

  it('rejects on read error', async () => {
    // simulate by passing something that isn’t a File
    await expect(parseCsvFile({})).rejects.toThrow('Failed to read file')
  })
})

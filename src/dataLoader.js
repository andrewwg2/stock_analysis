// src/dataLoader.js
export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const lines = text.trim().split('\n')
      const [headerLine, ...rows] = lines
      const keys = headerLine.split(',').map((h) => h.trim())
      const data = rows.map((row) => {
        const values = row.split(',')
        const obj = {}
        values.forEach((val, i) => {
          const v = val.trim()
          obj[keys[i]] = v === '' || isNaN(v) ? v : +v
        })
        return obj
      })
      resolve(data)
    }
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    // wrap readAsText so bad inputs also reject our error
    try {
      reader.readAsText(file)
    } catch (_err) {
      reject(new Error('Failed to read file'))
    }
  })
}

# Stock Analysis React App

A single-page React application for comparing two time-series of closing prices using a variety of technical indicators. It reads a CSV file of two assets’ daily closes and computes:

- **Daily Returns** (simple or log)  
- **Moving Average** (SMA or EMA)  
- **Rolling Volatility** (standard deviation of returns)  
- **Daily Performance Comparison** (A vs. B vs. tie)  
- **Bollinger Bands** (upper, middle, lower)  
- **Relative Strength Index (RSI)**  

Everything updates live as you tweak your parameters.

---

## Features

- **Return Type**: switch between **Simple** and **Log** returns  
- **Window Size**: length of look-back for MA, volatility, Bollinger Bands  
- **Smoothing**: choose **SMA** or **EMA**  
- **BB Multiplier**: σ-multiplier for Bollinger Bands  
- **RSI Period**: look-back length for RSI  

All indicators are rendered in a single HTML table for easy side-by-side analysis.

---

## Getting Started

### Prerequisites

- **Node.js** (≥ v16)  
- **npm** or **yarn**  
- **Docker** (optional, for containerized launch)

### Clone & Install

```bash
git clone https://github.com/andrewwg2/stock_analysis.git
cd stock_analysis
npm install
````

### Project Structure

```
stock_analysis/
├── public/
│   └── sample-data.csv     ← CSV file with columns: date, A_close, B_close
├── src/
│   ├── App.jsx             ← Main UI & data-flow
│   ├── dataLoader.js       ← CSV parser
│   └── analysis.js         ← All indicator functions
├── package.json
└── Dockerfile
```

---

## Running Locally

1. **Start the dev server**

   ```bash
   npm start
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

3. The app will fetch `public/sample-data.csv`, parse it, and display the table once loaded.

---

## Docker

The app is Docker-deployable:

1. **Build the image**

   ```bash
   docker build -t stock-analysis .
   ```

2. **Run the container**

   ```bash
   docker run --rm -it \
     -p 5173:5173 \
     -v "$PWD":/app \
     -w /app \
     stock-analysis \
     sh -c "npm install && npm start"
   ```

3. In your host browser, visit [http://localhost:5173](http://localhost:5173).

> **Tip:** The `-v "$PWD":/app` bind-mounts your code so you can tweak files locally and see hot reloads.

---

## Controls & UI

* **Return type** dropdown → choose **Simple** vs. **Log**
* **Window size** input → number of days (≥ 1)
* **Smoothing** dropdown → **SMA** or **EMA**
* **BB Multiplier** input → positive decimal
* **RSI Period** input → positive integer (clamped to data length)

All changes auto-recompute and update the table.

---

## Testing

This project currently has no automated tests configured. If you add tests (e.g. with Vitest or Jest), place them in `src/__tests__/` and run:

```bash
npm test
```

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/foo`)
3. Commit your changes (`git commit -m "feat: add foo"`)
4. Push to your branch (`git push origin feature/foo`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

```
```


# Docker Dev Env for JS

# Running tests

This command builds a docker image with the code of this repository and runs the repository's tests

```sh
./build_docker.sh my_app
docker run -t my_app ./run_tests.sh
```
# Running dev

This command builds a docker image with the code of this repository and runs the repository's in dev mode.

```sh
. build_docker.sh stock_analysis_refact && docker run --rm  -p -it 5173:5173 stock_analysis_refact ./run_dev.sh
```


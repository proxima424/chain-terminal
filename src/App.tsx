import Header from './components/Header'
import ChainRow from './components/ChainRow'
import { CHAINS } from './utils/chains'
import './App.css'

export default function App() {
  return (
    <>
      {/* CRT effects */}
      <div className="scanlines" />
      <div className="vignette" />

      {/* Terminal header */}
      <Header />

      {/* Chain rows */}
      <div className="chains-container">
        {CHAINS.map(chain => (
          <ChainRow key={chain.id} chain={chain} />
        ))}
      </div>

      {/* Footer */}
      <footer className="footer">
        <span>CHAIN_TERMINAL v1.0.0 — SIMULATION MODE</span>
        <span>BTC · ETH · BASE · SOL · MON</span>
        <span>REAL-TIME BLOCK VISUALIZATION</span>
      </footer>
    </>
  )
}

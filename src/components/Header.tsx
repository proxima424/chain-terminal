import { useState, useEffect } from 'react'
import { CHAINS } from '../utils/chains'

function fmt(d: Date) {
  return d.toLocaleTimeString('en-US', { hour12: false })
}

export default function Header() {
  const [time, setTime] = useState(fmt(new Date()))
  const [blocksProduced, setBlocksProduced] = useState(0)
  const [bootDone, setBootDone] = useState(false)
  const [bootLines, setBootLines] = useState<string[]>([])

  const bootSequence = [
    '> initializing chain_terminal v1.0.0...',
    '> loading chain configs [BTC ETH BASE SOL MON]',
    '> connecting to block streams...',
    '> all systems nominal. GO.',
  ]

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < bootSequence.length) {
        setBootLines(prev => [...prev, bootSequence[i]])
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => setBootDone(true), 400)
      }
    }, 280)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!bootDone) return
    const t = setInterval(() => setTime(fmt(new Date())), 1000)
    return () => clearInterval(t)
  }, [bootDone])

  // Rough block counter (sum of all chain intervals)
  useEffect(() => {
    if (!bootDone) return
    const avgInterval = 700
    const t = setInterval(() => {
      setBlocksProduced(p => p + Math.floor(Math.random() * 3) + 1)
    }, avgInterval)
    return () => clearInterval(t)
  }, [bootDone])

  if (!bootDone) {
    return (
      <header
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid #111',
          background: '#020202',
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          flexShrink: 0,
          minHeight: 100,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {bootLines.map((line, i) => (
          <div key={i} style={{ fontSize: 10, color: '#00ff41', letterSpacing: '0.5px', marginBottom: 3 }}>
            {line}
            {i === bootLines.length - 1 && (
              <span style={{ animation: 'cursorBlink 0.8s step-end infinite', marginLeft: 2 }}>█</span>
            )}
          </div>
        ))}
      </header>
    )
  }

  return (
    <header
      style={{
        padding: '10px 20px 8px',
        borderBottom: '1px solid #111',
        background: '#020202',
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        flexShrink: 0,
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '6px',
              color: '#00ff41',
              textShadow: '0 0 20px #00ff41, 0 0 40px #00ff4140',
            }}
          >
            CHAIN_TERMINAL
          </span>
          <span
            style={{
              display: 'inline-block',
              width: 9,
              height: 16,
              background: '#00ff41',
              animation: 'cursorBlink 1s step-end infinite',
              marginTop: 2,
              boxShadow: '0 0 8px #00ff41',
            }}
          />
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 10, color: '#3a3a3a' }}>
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#00ff41' }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#00ff41',
                boxShadow: '0 0 6px #00ff41',
                animation: 'blink 1.3s ease-in-out infinite',
              }}
            />
            LIVE
          </div>
          <span>{time}</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 28, fontSize: 9, alignItems: 'center' }}>
        <Stat label="CHAINS" value={`${CHAINS.length}`} />
        <Stat label="BLOCKS" value={blocksProduced.toLocaleString()} />
        <Stat label="STATUS" value="NOMINAL" color="#00ff41" />
        <div style={{ flex: 1 }} />

        {/* Chain color pills */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {CHAINS.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: c.color,
                  boxShadow: `0 0 5px ${c.color}`,
                }}
              />
              <span style={{ fontSize: 8, color: c.color + '90', letterSpacing: '1px' }}>
                {c.symbol}
              </span>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <span style={{ color: '#2e2e2e', letterSpacing: '1px' }}>{label}</span>
      <span style={{ color: color ?? '#00ff41', letterSpacing: '0.5px' }}>{value}</span>
    </div>
  )
}

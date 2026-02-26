import { useState, useEffect, useRef } from 'react'
import { Chain } from '../utils/chains'
import Block from './Block'
import { useBlockStream } from '../hooks/useBlockStream'

interface ConnectorProps {
  color: string
  isNew: boolean
}

function Connector({ color, isNew }: ConnectorProps) {
  const [visible, setVisible] = useState(!isNew)

  useEffect(() => {
    if (!isNew) return
    const t = setTimeout(() => setVisible(true), 280)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: 28,
        flexShrink: 0,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.25s',
      }}
    >
      {/* line */}
      <div style={{
        flex: 1,
        height: 1,
        background: `linear-gradient(90deg, ${color}40, ${color}80)`,
      }} />
      {/* arrowhead */}
      <svg width="8" height="10" viewBox="0 0 8 10" style={{ flexShrink: 0 }}>
        <polygon points="0,1 8,5 0,9" fill={color} opacity="0.7" />
      </svg>
    </div>
  )
}

export default function ChainRow({ chain }: { chain: Chain }) {
  // ── All data + lifecycle now owned by the hook ──
  const { blocks, pulseCount } = useBlockStream(chain)
  const trackRef = useRef<HTMLDivElement>(null)

  // TPS display (derived from chain config — display only)
  const tps = Math.round(chain.avgTxPerBlock / (chain.blockInterval / 1000))

  // Auto-scroll to show the newest block
  useEffect(() => {
    requestAnimationFrame(() => {
      if (trackRef.current) {
        trackRef.current.scrollTo({
          left: trackRef.current.scrollWidth,
          behavior: 'smooth',
        })
      }
    })
  }, [blocks.length])

  const latestHeight = blocks[blocks.length - 1]?.height ?? chain.startHeight

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        minHeight: 0,
        borderBottom: '1px solid #0d0d0d',
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      }}
    >
      {/* ── Chain label sidebar ── */}
      <div
        style={{
          width: 168,
          flexShrink: 0,
          padding: '0 14px 0 20px',
          borderRight: '1px solid #0f0f0f',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          alignSelf: 'stretch',
          justifyContent: 'center',
        }}
      >
        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Animated pulse dot — re-keyed on each new block */}
          <div
            key={pulseCount}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: chain.color,
              boxShadow: `0 0 6px ${chain.color}, 0 0 14px ${chain.color}60`,
              flexShrink: 0,
              animation: pulseCount > 0 ? 'dotPulse 0.5s ease-out' : 'none',
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '2px',
              color: chain.color,
            }}
          >
            {chain.name}
          </span>
        </div>

        {/* Block height */}
        <div
          style={{
            fontSize: 9,
            color: chain.color + '70',
            letterSpacing: '0.3px',
            paddingLeft: 15,
          }}
        >
          #{latestHeight.toLocaleString()}
        </div>

        {/* TPS */}
        <div
          style={{
            fontSize: 8.5,
            color: chain.color + '50',
            paddingLeft: 15,
            letterSpacing: '0.3px',
          }}
        >
          ~{tps.toLocaleString()} TPS
        </div>

        {/* Block time */}
        <div
          style={{
            fontSize: 8,
            color: '#2a2a2a',
            paddingLeft: 15,
          }}
        >
          {chain.blockInterval >= 1000
            ? `${chain.blockInterval / 1000}s/block`
            : `${chain.blockInterval}ms/block`}
        </div>
      </div>

      {/* ── Blocks scrolling track ── */}
      <div
        ref={trackRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '0 18px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          gap: 0,
        }}
      >
        {blocks.map((block, i) => (
          <div
            key={block.id}
            style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            {i > 0 && <Connector color={chain.color} isNew={block.isNew} />}
            <Block block={block} chainColor={chain.color} />
          </div>
        ))}

        {/* Trailing cursor — shows chain is live */}
        <div
          style={{
            marginLeft: 14,
            width: 3,
            height: 16,
            background: chain.color,
            opacity: 0.7,
            flexShrink: 0,
            animation: 'cursorBlink 0.9s step-end infinite',
          }}
        />
      </div>
    </div>
  )
}

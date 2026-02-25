import { useState, useEffect, memo } from 'react'

export interface BlockData {
  id: string
  height: number
  hash: string
  txCount: number
  timestamp: number
  isNew: boolean
}

interface BlockProps {
  block: BlockData
  chainColor: string
}

const W = 122
const H = 82
// Perimeter of inner rect (offset by 1px for stroke)
const PERIM = (W - 2) * 2 + (H - 2) * 2

type Phase = 'enter' | 'forming' | 'glow' | 'stable'

const Block = memo(function Block({ block, chainColor }: BlockProps) {
  const [dashOffset, setDashOffset] = useState(block.isNew ? PERIM : 0)
  const [phase, setPhase] = useState<Phase>(block.isNew ? 'enter' : 'stable')
  const [contentVisible, setContentVisible] = useState(!block.isNew)

  useEffect(() => {
    if (!block.isNew) return

    // Two RAF calls to ensure initial state is painted before transition starts
    let raf1: number
    let raf2: number
    const t1 = setTimeout(() => setContentVisible(true), 350)
    const t2 = setTimeout(() => setPhase('glow'), 360)
    const t3 = setTimeout(() => setPhase('stable'), 950)

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setDashOffset(0)
        setPhase('forming')
      })
    })

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, []) // intentionally empty — runs once on mount

  const filterStyle: Record<Phase, string> = {
    enter:   `drop-shadow(0 0 2px ${chainColor}40)`,
    forming: `drop-shadow(0 0 6px ${chainColor}) drop-shadow(0 0 14px ${chainColor}80)`,
    glow:    `drop-shadow(0 0 12px ${chainColor}) drop-shadow(0 0 28px ${chainColor}90) drop-shadow(0 0 50px ${chainColor}40)`,
    stable:  `drop-shadow(0 0 4px ${chainColor}50)`,
  }

  const timeStr = new Date(block.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div
      style={{
        position: 'relative',
        width: W,
        height: H,
        flexShrink: 0,
      }}
    >
      {/* SVG layer — border + background */}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          filter: filterStyle[phase],
          transition: 'filter 0.45s ease',
          overflow: 'visible',
        }}
      >
        {/* Subtle background fill */}
        <rect
          x="1" y="1"
          width={W - 2} height={H - 2}
          fill={`${chainColor}07`}
        />

        {/* Main border — draws itself via strokeDashoffset */}
        <rect
          x="1" y="1"
          width={W - 2} height={H - 2}
          fill="none"
          stroke={chainColor}
          strokeWidth="1"
          strokeDasharray={PERIM}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.32s ease-out' }}
        />

        {/* Corner triangle accents — always visible, act as anchor points */}
        <polygon points={`1,1 11,1 1,11`}                           fill={chainColor} opacity="0.95" />
        <polygon points={`${W-1},1 ${W-11},1 ${W-1},11`}            fill={chainColor} opacity="0.95" />
        <polygon points={`1,${H-1} 11,${H-1} 1,${H-11}`}            fill={chainColor} opacity="0.95" />
        <polygon points={`${W-1},${H-1} ${W-11},${H-1} ${W-1},${H-11}`} fill={chainColor} opacity="0.95" />

        {/* Inner divider line — appears on glow */}
        <line
          x1="1" y1={H - 22}
          x2={W - 1} y2={H - 22}
          stroke={chainColor}
          strokeWidth="0.5"
          opacity={phase === 'glow' || phase === 'stable' ? 0.18 : 0}
          style={{ transition: 'opacity 0.3s' }}
        />

        {/* Scan flash on new block */}
        {phase === 'glow' && (
          <rect
            x="1" y="1"
            width={W - 2} height={H - 2}
            fill={chainColor}
            opacity="0.04"
          />
        )}
      </svg>

      {/* Content layer */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          padding: '8px 10px',
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          opacity: contentVisible ? 1 : 0,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }}
      >
        {/* Height */}
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: chainColor,
          letterSpacing: '0.5px',
          lineHeight: 1.2,
        }}>
          #{block.height.toLocaleString()}
        </div>

        {/* Hash */}
        <div style={{
          fontSize: 8,
          color: '#3a3a3a',
          letterSpacing: '0.3px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {block.hash}…
        </div>

        {/* Footer row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}>
          <span style={{ fontSize: 8.5, color: '#484848' }}>
            {block.txCount.toLocaleString()} txs
          </span>
          <span style={{ fontSize: 7.5, color: '#2e2e2e' }}>
            {timeStr}
          </span>
        </div>
      </div>
    </div>
  )
})

export default Block

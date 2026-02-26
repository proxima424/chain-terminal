import { useState, useEffect, useRef, useCallback } from 'react'
import { Chain, generateHash, generateTxCount } from '../utils/chains'
import type { BlockData } from '../components/Block'
import { createBitcoinStream } from '../services/streams/bitcoin'
import { createEvmStream } from '../services/streams/evm'
import { createSolanaStream } from '../services/streams/solana'
import type { BlockCallback } from '../services/streams/types'

const MAX_BLOCKS = 9
const INIT_BLOCKS = 4

function buildInitialBlocks(chain: Chain): BlockData[] {
  return Array.from({ length: INIT_BLOCKS }, (_, i) => ({
    id: `${chain.id}-init-${i}`,
    height: chain.startHeight - (INIT_BLOCKS - 1 - i),
    hash: generateHash(),
    txCount: generateTxCount(chain),
    timestamp: Date.now() - (INIT_BLOCKS - 1 - i) * chain.blockInterval,
    isNew: false,
  }))
}

/** Fallback simulation — identical to the old ChainRow setInterval behavior */
function startSimulation(
  chain: Chain,
  push: (d: { height: number; hash: string; txCount: number; timestamp: number }) => void,
  heightRef: React.MutableRefObject<number>
): () => void {
  const interval = setInterval(() => {
    heightRef.current += 1
    push({
      height: heightRef.current,
      hash: generateHash(),
      txCount: generateTxCount(chain),
      timestamp: Date.now(),
    })
  }, chain.blockInterval)
  return () => clearInterval(interval)
}

/** Check that a WS URL is valid enough to attempt a real connection */
function isValidWsUrl(url: string | undefined): url is string {
  return typeof url === 'string' && (url.startsWith('wss://') || url.startsWith('ws://'))
}

export function useBlockStream(chain: Chain) {
  const [blocks, setBlocks] = useState<BlockData[]>(() => buildInitialBlocks(chain))
  const [pulseCount, setPulseCount] = useState(0)
  const heightRef = useRef(chain.startHeight)

  /** Stable callback that assembles BlockData and pushes it into state */
  const pushBlock = useCallback(
    (partial: { height: number; hash: string; txCount: number; timestamp: number }) => {
      heightRef.current = partial.height
      const newBlock: BlockData = {
        id: `${chain.id}-${partial.height}-${partial.timestamp}`,
        height: partial.height,
        hash: partial.hash,
        txCount: partial.txCount,
        timestamp: partial.timestamp,
        isNew: true,
      }
      setBlocks((prev) => [...prev.slice(-(MAX_BLOCKS - 1)), newBlock])
      setPulseCount((c) => c + 1)
    },
    [chain.id]
  )

  useEffect(() => {
    // Reset state when chain config changes
    setBlocks(buildInitialBlocks(chain))
    heightRef.current = chain.startHeight
    setPulseCount(0)

    const { wsUrl, streamType } = chain
    const blockCallback: BlockCallback = (data) => pushBlock(data)

    // Route to the correct live stream — fall back to simulation if URL is absent/invalid
    if (streamType === 'bitcoin' && isValidWsUrl(wsUrl)) {
      return createBitcoinStream(blockCallback)
    }

    if (streamType === 'evm' && isValidWsUrl(wsUrl)) {
      return createEvmStream(wsUrl, blockCallback)
    }

    if (streamType === 'solana' && isValidWsUrl(wsUrl)) {
      return createSolanaStream(wsUrl, blockCallback)
    }

    // Fallback: simulation (no env var set, or unknown streamType)
    return startSimulation(chain, pushBlock, heightRef)
  }, [chain, pushBlock])

  return { blocks, pulseCount }
}

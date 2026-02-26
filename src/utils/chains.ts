const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_API_KEY as string | undefined
const MONAD_WS    = import.meta.env.VITE_MONAD_WS_URL   as string | undefined

export interface Chain {
  id: string
  name: string
  symbol: string
  color: string
  blockInterval: number   // ms — fallback simulation speed / display TPS
  startHeight: number
  avgTxPerBlock: number   // used by simulation fallback + TPS display
  emoji: string
  wsUrl?: string          // live WebSocket endpoint (undefined → simulation)
  streamType?: 'bitcoin' | 'evm' | 'solana'
}

export const CHAINS: Chain[] = [
  {
    id: 'bitcoin',
    name: 'BITCOIN',
    symbol: 'BTC',
    color: '#F7931A',
    blockInterval: 4000,
    startHeight: 883421,
    avgTxPerBlock: 2800,
    emoji: '₿',
    wsUrl: 'wss://mempool.space/api/v1/ws', // free — no key needed
    streamType: 'bitcoin',
  },
  {
    id: 'ethereum',
    name: 'ETHEREUM',
    symbol: 'ETH',
    color: '#8B9BB4',
    blockInterval: 1800,
    startHeight: 21584239,
    avgTxPerBlock: 200,
    emoji: 'Ξ',
    wsUrl: ALCHEMY_KEY ? `wss://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}` : undefined,
    streamType: 'evm',
  },
  {
    id: 'base',
    name: 'BASE',
    symbol: 'BASE',
    color: '#0052FF',
    blockInterval: 900,
    startHeight: 25341829,
    avgTxPerBlock: 85,
    emoji: 'B',
    wsUrl: ALCHEMY_KEY ? `wss://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}` : undefined,
    streamType: 'evm',
  },
  {
    id: 'solana',
    name: 'SOLANA',
    symbol: 'SOL',
    color: '#14F195',
    blockInterval: 400,
    startHeight: 312847293,
    avgTxPerBlock: 1600,
    emoji: '◎',
    wsUrl: ALCHEMY_KEY ? `wss://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}` : undefined,
    streamType: 'solana',
  },
  {
    id: 'monad',
    name: 'MONAD',
    symbol: 'MON',
    color: '#836EF9',
    blockInterval: 600,
    startHeight: 1284729,
    avgTxPerBlock: 6000,
    emoji: 'M',
    wsUrl: MONAD_WS,
    streamType: 'evm',
  },
]

const HEX = '0123456789abcdef'

export function generateHash(): string {
  let h = '0x'
  for (let i = 0; i < 8; i++) h += HEX[Math.floor(Math.random() * 16)]
  return h
}

export function generateTxCount(chain: Chain): number {
  const variance = 0.3
  const min = Math.floor(chain.avgTxPerBlock * (1 - variance))
  const max = Math.ceil(chain.avgTxPerBlock * (1 + variance))
  return Math.max(1, Math.floor(Math.random() * (max - min + 1)) + min)
}

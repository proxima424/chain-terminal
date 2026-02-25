export interface Chain {
  id: string
  name: string
  symbol: string
  color: string
  blockInterval: number   // ms — demo speed
  startHeight: number
  avgTxPerBlock: number
  emoji: string
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

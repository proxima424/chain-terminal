export type BlockCallback = (data: {
  height: number
  hash: string
  txCount: number
  timestamp: number // Unix milliseconds
}) => void

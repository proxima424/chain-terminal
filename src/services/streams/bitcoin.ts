import type { BlockCallback } from './types'

const WS_URL = 'wss://mempool.space/api/v1/ws'

export function createBitcoinStream(onBlock: BlockCallback): () => void {
  let ws: WebSocket | null = null
  let destroyed = false
  let backoffMs = 1_000
  const MAX_BACKOFF = 60_000
  let lastHeight = 0

  function connect() {
    if (destroyed) return
    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      backoffMs = 1_000 // reset on successful connect
      ws!.send(JSON.stringify({ action: 'want', data: ['blocks'] }))
    }

    ws.onmessage = (event: MessageEvent) => {
      let msg: unknown
      try {
        msg = JSON.parse(event.data as string)
      } catch {
        return
      }

      const raw = msg as Record<string, unknown>
      if (!raw.block) return

      const b = raw.block as {
        id: string
        height: number
        tx_count: number
        timestamp: number // Unix seconds
      }

      // Guard against duplicate/reorg events
      if (b.height <= lastHeight) return
      lastHeight = b.height

      onBlock({
        height: b.height,
        hash: b.id, // full 64-char hex; Block.tsx shows first 8 chars + "…"
        txCount: b.tx_count,
        timestamp: b.timestamp * 1_000,
      })
    }

    ws.onerror = () => {
      // onclose fires after onerror — handle reconnect there
    }

    ws.onclose = () => {
      if (destroyed) return
      const delay = backoffMs
      backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF)
      setTimeout(connect, delay)
    }
  }

  connect()

  return () => {
    destroyed = true
    ws?.close()
  }
}

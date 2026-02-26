import type { BlockCallback } from './types'

/** Swap wss:// → https:// to derive the HTTP JSON-RPC endpoint from the WS URL */
function wsToHttp(wsUrl: string): string {
  return wsUrl.replace(/^wss?:\/\//, (m) => (m === 'wss://' ? 'https://' : 'http://'))
}

export function createEvmStream(wsUrl: string, onBlock: BlockCallback): () => void {
  let ws: WebSocket | null = null
  let destroyed = false
  let backoffMs = 1_000
  const MAX_BACKOFF = 60_000
  let reqId = 1
  let lastHeight = 0

  const httpUrl = wsToHttp(wsUrl)

  function connect() {
    if (destroyed) return
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      backoffMs = 1_000
      // Subscribe to new block headers
      ws!.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: reqId++,
          method: 'eth_subscribe',
          params: ['newHeads'],
        })
      )
    }

    ws.onmessage = async (event: MessageEvent) => {
      let msg: unknown
      try {
        msg = JSON.parse(event.data as string)
      } catch {
        return
      }

      const raw = msg as Record<string, unknown>

      // Subscription confirmation — has "result" (subscription ID) but no "params"
      if (!raw.params) return

      // Subscription event:
      // { "method": "eth_subscription", "params": { "result": { "number": "0x...", "hash": "0x...", "timestamp": "0x..." }, "subscription": "0x..." } }
      const params = raw.params as {
        result: { number: string; hash: string; timestamp: string }
      }
      const head = params.result
      if (!head?.number) return

      const blockHex = head.number
      const blockNumber = parseInt(blockHex, 16)
      if (blockNumber <= lastHeight) return // deduplicate
      lastHeight = blockNumber

      const hash = head.hash
      const timestamp = parseInt(head.timestamp, 16) * 1_000 // hex seconds → ms

      // Fetch tx count — not in newHeads, needs a separate call
      let txCount = 0
      try {
        const resp = await fetch(httpUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: reqId++,
            method: 'eth_getBlockTransactionCountByNumber',
            params: [blockHex],
          }),
        })
        const json = (await resp.json()) as { result: string }
        txCount = parseInt(json.result, 16)
      } catch {
        // emit block anyway with txCount 0 — display stays live
        txCount = 0
      }

      onBlock({ height: blockNumber, hash, txCount, timestamp })
    }

    ws.onerror = () => {}

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

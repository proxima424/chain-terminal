import type { BlockCallback } from './types'

function wsToHttp(wsUrl: string): string {
  return wsUrl.replace(/^wss?:\/\//, (m) => (m === 'wss://' ? 'https://' : 'http://'))
}

export function createSolanaStream(wsUrl: string, onBlock: BlockCallback): () => void {
  let ws: WebSocket | null = null
  let destroyed = false
  let backoffMs = 1_000
  const MAX_BACKOFF = 60_000
  let reqId = 1
  let lastSlot = 0

  const httpUrl = wsToHttp(wsUrl)

  function connect() {
    if (destroyed) return
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      backoffMs = 1_000
      lastSlot = 0
      // Subscribe to slot notifications
      ws!.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: reqId++,
          method: 'slotSubscribe',
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

      // Ignore subscription confirmation
      if (raw.method !== 'slotNotification') return

      // Slot notification shape:
      // { "method": "slotNotification", "params": { "result": { "slot": 123, "parent": 122, "root": 100 }, "subscription": 1 } }
      const params = raw.params as { result: { slot: number } }
      const slot = params.result?.slot
      if (typeof slot !== 'number') return

      // Deduplicate — slotSubscribe fires very frequently
      if (slot <= lastSlot) return
      lastSlot = slot

      // Fetch the block for this slot
      try {
        const resp = await fetch(httpUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: reqId++,
            method: 'getBlock',
            params: [
              slot,
              {
                encoding: 'json',
                maxSupportedTransactionVersion: 0,
                transactionDetails: 'signatures', // smallest payload that gives tx count
                rewards: false,
              },
            ],
          }),
        })
        const json = (await resp.json()) as {
          result:
            | null
            | {
                blockHeight: number | null
                blockTime: number | null
                blockhash: string
                signatures: string[]
              }
        }

        // null result = no block in this slot (skipped slot) — ignore
        if (!json.result) return

        const block = json.result

        onBlock({
          height: block.blockHeight ?? slot, // blockHeight can be null for very old slots
          hash: block.blockhash,
          txCount: block.signatures.length,
          timestamp: block.blockTime != null ? block.blockTime * 1_000 : Date.now(),
        })
      } catch {
        // Silently skip — next slot will retry
      }
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

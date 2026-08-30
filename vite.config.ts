import { defineConfig, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { applyEvent, claimSeatOnRoom, loadRoom, roomIdFrom, saveRoom, snapshotAfter } from './api/live-room-store.js'

function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw) as Record<string, unknown>)
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.end(JSON.stringify(body))
}

function liveRoomPlugin(): Plugin {
  return {
    name: 'pd-live-room',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.originalUrl || req.url || '').split('?')[0]
        if (path !== '/api/live-room') {
          next()
          return
        }
        void (async () => {
          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            res.end()
            return
          }
          if (req.method === 'GET') {
            const url = new URL(req.originalUrl || req.url || '', 'http://localhost')
            const room = roomIdFrom(url.searchParams.get('room'))
            if (!room) {
              send(res, 400, { error: 'bad_room' })
              return
            }
            send(res, 200, snapshotAfter(loadRoom(room), Number(url.searchParams.get('after') || 0)))
            return
          }
          if (req.method === 'POST') {
            const body = await readJson(req)
            const room = roomIdFrom(body.room)
            if (!room) {
              send(res, 400, { error: 'bad_room' })
              return
            }
            const event = body.event as {
              kind?: string
              name?: string
              clientId?: string
              preferred?: string
            } | undefined
            if (event?.kind === 'claim') {
              const claimed = claimSeatOnRoom(loadRoom(room), event.name, event.clientId, event.preferred)
              saveRoom(room, claimed.state)
              send(res, 200, { seat: claimed.seat, ...snapshotAfter(claimed.state, 0) })
              return
            }
            const next = applyEvent(loadRoom(room), event)
            saveRoom(room, next)
            send(res, 200, snapshotAfter(next, 0))
            return
          }
          send(res, 405, { error: 'method_not_allowed' })
        })().catch(() => next())
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), liveRoomPlugin()],
  server: {
    proxy: {
      '/api/create-checkout': {
        target: 'https://www.proximatedate.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})

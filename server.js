import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { WebSocketServer } from 'ws'
import mongoose from 'mongoose'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// registry: Map<debtorId, Set<WebSocket>>
const registry = new Map()

function broadcast(debtorId, message) {
  const sockets = registry.get(String(debtorId))
  if (!sockets || sockets.size === 0) return
  const data = JSON.stringify(message)
  for (const ws of sockets) {
    if (ws.readyState === 1 /* OPEN */) ws.send(data)
  }
}

// Acessível pelas API routes no mesmo processo Node.js
globalThis.__wsBroadcast = broadcast

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res, parse(req.url, true))
  })

  // noServer: true — gerenciamos o upgrade manualmente para não interferir
  // com o WebSocket do HMR do Next.js (_next/webpack-hmr)
  const wss = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://localhost`)
    if (url.pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    }
    // Outros paths (_next/webpack-hmr etc.) passam para o handler do Next.js
  })

  wss.on('connection', (ws) => {
    const subs = new Set()

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.type === 'subscribe' && msg.debtorId) {
          const id = String(msg.debtorId)
          if (!registry.has(id)) registry.set(id, new Set())
          registry.get(id).add(ws)
          subs.add(id)
        }
      } catch {}
    })

    ws.on('close', () => {
      for (const id of subs) registry.get(id)?.delete(ws)
    })

    ws.on('error', () => {})
  })

  // MongoDB Change Streams como camada extra (requer replica set / Atlas)
  setupChangeStreams()

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})

async function setupChangeStreams() {
  try {
    const { connectDB } = await import('./src/lib/db.js')
    await connectDB()

    const db = mongoose.connection.db
    if (!db) return

    const txStream = db.collection('transactions').watch(
      [{ $match: { operationType: { $in: ['insert', 'update', 'delete', 'replace'] } } }],
      { fullDocument: 'updateLookup' }
    )

    txStream.on('change', (change) => {
      const debtorId =
        change.fullDocument?.debtorId?.toString() ||
        change.documentKey?.debtorId?.toString()
      if (!debtorId) return

      const op = change.operationType
      if (op === 'insert') {
        broadcast(debtorId, { type: 'tx:insert', payload: ser(change.fullDocument) })
      } else if (op === 'delete') {
        broadcast(debtorId, { type: 'tx:delete', payload: { _id: change.documentKey._id.toString() } })
      } else if (op === 'update' || op === 'replace') {
        broadcast(debtorId, { type: 'tx:update', payload: ser(change.fullDocument) })
      }
    })

    const debtorStream = db.collection('debtors').watch(
      [{ $match: { operationType: 'update' } }],
      { fullDocument: 'updateLookup' }
    )

    debtorStream.on('change', (change) => {
      if (!change.fullDocument) return
      const id = change.fullDocument._id.toString()
      const { displayMode, canCreatePayment, name } = change.fullDocument
      broadcast(id, { type: 'debtor:update', payload: { displayMode, canCreatePayment, name } })
    })

    txStream.on('error', () => {})
    debtorStream.on('error', () => {})

    console.log('> MongoDB Change Streams ativos')
  } catch (err) {
    console.warn('> Change Streams indisponíveis (MongoDB standalone):', err.message)
    console.warn('> Usando apenas broadcast direto das APIs')
  }
}

function ser(doc) {
  if (!doc) return null
  return JSON.parse(JSON.stringify(doc))
}

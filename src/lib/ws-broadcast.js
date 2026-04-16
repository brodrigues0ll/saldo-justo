/**
 * Envia mensagem via WebSocket para todos os clientes subscritos a um devedor.
 * Só funciona quando rodando com o servidor customizado (server.js).
 * É um no-op silencioso em outros ambientes (testes, Vercel, etc).
 */
export function wsBroadcast(debtorId, message) {
  if (typeof globalThis.__wsBroadcast === 'function') {
    globalThis.__wsBroadcast(String(debtorId), message)
  }
}

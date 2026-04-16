// sessionStorage: leitura síncrona (zero latência, mesma sessão)
// IndexedDB: leitura assíncrona (~5ms, persiste entre sessões)

const DB_NAME = 'saldo-justo-v1'
const STORE = 'cache'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// --- sessionStorage (síncrono) ---

export function sessionGet(key) {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function sessionSet(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

// --- IndexedDB (assíncrono, persistente) ---

export async function idbGet(key) {
  try {
    const db = await openDB()
    return await new Promise((resolve) => {
      const req = db.transaction(STORE).objectStore(STORE).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    })
  } catch { return null }
}

export async function idbSet(key, value) {
  try {
    const db = await openDB()
    await new Promise((resolve) => {
      const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, key)
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
    })
  } catch {}
}

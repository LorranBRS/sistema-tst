// Fotos guardadas no próprio aparelho (IndexedDB), fora do localStorage, que é pequeno.
// Os registros guardam só o id da foto. O backup inclui as fotos.
import { useEffect, useState } from 'react'
import { lerLogo } from './imagem'
import { uid } from './utils'

const BANCO = 'sistema-tst-fotos'
const LOJA = 'fotos'
let conexao: Promise<IDBDatabase> | null = null
const cache = new Map<string, string>()

function abrir() {
  if (!conexao) {
    conexao = new Promise((ok, falha) => {
      const req = indexedDB.open(BANCO, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(LOJA)
      req.onsuccess = () => ok(req.result)
      req.onerror = () => falha(req.error)
    })
  }
  return conexao
}

async function operar<T>(modo: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const banco = await abrir()
  return new Promise((ok, falha) => {
    const req = f(banco.transaction(LOJA, modo).objectStore(LOJA))
    req.onsuccess = () => ok(req.result)
    req.onerror = () => falha(req.error)
  })
}

/** Reduz a foto (máx. 1280 px, JPEG) e guarda. Devolve o id. */
export async function salvarFoto(arquivo: File) {
  const dados = await lerLogo(arquivo, 1280, 'image/jpeg')
  const id = 'f' + uid()
  await operar('readwrite', (s) => s.put(dados, id))
  cache.set(id, dados)
  return id
}

export async function lerFoto(id: string) {
  if (cache.has(id)) return cache.get(id)!
  const dados = (await operar<string | undefined>('readonly', (s) => s.get(id))) ?? ''
  if (dados) cache.set(id, dados)
  return dados
}

export async function apagarFoto(id: string) {
  cache.delete(id)
  await operar('readwrite', (s) => s.delete(id))
}

export function useFoto(id: string) {
  const [src, setSrc] = useState(cache.get(id) ?? '')
  useEffect(() => {
    let vivo = true
    if (!cache.has(id)) lerFoto(id).then((d) => vivo && setSrc(d)).catch(() => {})
    else setSrc(cache.get(id)!)
    return () => { vivo = false }
  }, [id])
  return src
}

/** Todas as fotos (para o backup). */
export async function todasFotos(): Promise<Record<string, string>> {
  const banco = await abrir()
  return new Promise((ok, falha) => {
    const out: Record<string, string> = {}
    const req = banco.transaction(LOJA, 'readonly').objectStore(LOJA).openCursor()
    req.onsuccess = () => {
      const c = req.result
      if (c) { out[String(c.key)] = c.value as string; c.continue() } else ok(out)
    }
    req.onerror = () => falha(req.error)
  })
}

export async function restaurarFotos(fotos: Record<string, string>) {
  for (const [id, dados] of Object.entries(fotos)) {
    await operar('readwrite', (s) => s.put(dados, id))
    cache.set(id, dados)
  }
}

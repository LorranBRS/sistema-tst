// Armazenamento local (localStorage) com assinatura reativa para o React.
// Toda a camada de dados passa por aqui: trocar por uma API/Supabase no futuro
// significa reescrever só este arquivo.
import { useSyncExternalStore } from 'react'
import type { ColKey, Config, DB } from './types'
import { dbDemo, dbVazio } from './seed'
import { uid } from './utils'

const CHAVE = 'sistema-tst:db:v1'

function carregar(): DB {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (bruto) {
      const dados = JSON.parse(bruto)
      const base = dbVazio()
      // Migração da v1.0: quem ainda usa os dados de demonstração ganha os exemplos dos módulos novos
      if (dados.requisitos === undefined && Array.isArray(dados.empresas) && dados.empresas.some((e: { id: string }) => e.id === 'e1')) {
        const demo = dbDemo()
        dados.pts = demo.pts
        dados.requisitos = demo.requisitos
        const oc = demo.ocorrencias.find((o) => o.id === 'o1')
        if (Array.isArray(dados.ocorrencias)) dados.ocorrencias = dados.ocorrencias.map((o: { id: string }) => (o.id === 'o1' && oc ? { ...o, investigacao: oc.investigacao } : o))
      }
      return { ...base, ...dados, config: { ...base.config, ...(dados.config || {}) } }
    }
  } catch {
    /* sem acesso ao storage: segue com a demonstração em memória */
  }
  return dbDemo()
}

let estado: DB = carregar()
const ouvintes = new Set<() => void>()

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado))
  } catch {
    /* modo privado / cota cheia: os dados ficam só nesta aba */
  }
}

function definir(novo: DB) {
  estado = novo
  salvar()
  ouvintes.forEach((f) => f())
}

function assinar(f: () => void) {
  ouvintes.add(f)
  return () => ouvintes.delete(f)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Registro = { id: string; [k: string]: any }

export const db = {
  get estado() {
    return estado
  },
  adicionar<K extends ColKey>(col: K, dados: Omit<DB[K][number], 'id'> & { id?: string }) {
    const reg = { ...dados, id: dados.id || uid() } as DB[K][number]
    definir({ ...estado, [col]: [reg, ...(estado[col] as Registro[])] })
    return reg.id
  },
  atualizar<K extends ColKey>(col: K, id: string, patch: Partial<DB[K][number]>) {
    definir({
      ...estado,
      [col]: (estado[col] as Registro[]).map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })
  },
  remover<K extends ColKey>(col: K, id: string) {
    definir({ ...estado, [col]: (estado[col] as Registro[]).filter((r) => r.id !== id) })
  },
  buscar<K extends ColKey>(col: K, id: string): DB[K][number] | undefined {
    return (estado[col] as Registro[]).find((r) => r.id === id) as DB[K][number] | undefined
  },
  configurar(patch: Partial<Config>) {
    definir({ ...estado, config: { ...estado.config, ...patch } })
  },
  exportar() {
    return JSON.stringify({ app: 'sistema-tst', versao: 1, exportadoEm: new Date().toISOString(), dados: estado }, null, 2)
  },
  importar(json: string) {
    const obj = JSON.parse(json)
    const dados = obj?.dados ?? obj
    if (!dados || !Array.isArray(dados.colaboradores)) throw new Error('Arquivo de backup inválido')
    const base = dbVazio()
    definir({ ...base, ...dados, config: { ...base.config, ...(dados.config || {}) } })
  },
  restaurarDemo() {
    definir(dbDemo())
  },
  apagarTudo() {
    definir({ ...dbVazio(), config: { ...estado.config, empresaAtiva: '' } })
  },
}

export function useDB(): DB {
  return useSyncExternalStore(assinar, () => estado)
}

export function useConfig(): Config {
  return useSyncExternalStore(assinar, () => estado.config)
}

/** Nome do colaborador / empresa / EPI para exibição. */
export const nomes = {
  colaborador: (d: DB, id: string) => d.colaboradores.find((c) => c.id === id)?.nome ?? '—',
  empresa: (d: DB, id: string) => d.empresas.find((e) => e.id === id)?.nome ?? '—',
  epi: (d: DB, id: string) => d.epis.find((e) => e.id === id)?.nome ?? '—',
}

/** Empresa a que um registro pertence (direto ou via colaborador). */
export function empresaDoRegistro(d: DB, r: Registro): string {
  if (r.empresaId) return r.empresaId
  if (r.colaboradorId) return d.colaboradores.find((c) => c.id === r.colaboradorId)?.empresaId ?? ''
  return ''
}

/** Filtra pela empresa ativa (se houver). */
export function daEmpresaAtiva<T extends Registro>(d: DB, lista: T[]): T[] {
  const e = d.config.empresaAtiva
  if (!e) return lista
  return lista.filter((r) => empresaDoRegistro(d, r) === e)
}

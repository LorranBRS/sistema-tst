// Utilidades de datas, formatação e identificadores.
// Todas as datas do sistema são guardadas como texto ISO "AAAA-MM-DD".

export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5)

export function toISO(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export const hoje = () => toISO(new Date())

export function parseISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addDias(iso: string, n: number) {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function addMeses(iso: string, n: number) {
  const d = parseISO(iso)
  const dia = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(dia, ultimo))
  return toISO(d)
}

/** Dias entre hoje e a data (negativo = já passou). */
export function diasAte(iso: string) {
  return Math.round((parseISO(iso).getTime() - parseISO(hoje()).getTime()) / 86400000)
}

export function fmtData(iso?: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export const fmtNum = (n: number, casas = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })

export const fmtMoeda = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export type Situacao = 'vencido' | 'avencer' | 'ok' | 'sem'

export function situacao(iso: string | undefined, alertaDias = 30): Situacao {
  if (!iso) return 'sem'
  const d = diasAte(iso)
  if (d < 0) return 'vencido'
  if (d <= alertaDias) return 'avencer'
  return 'ok'
}

export function textoPrazo(iso?: string) {
  if (!iso) return 'Sem validade'
  const d = diasAte(iso)
  if (d < 0) return `Vencido há ${-d} dia${d === -1 ? '' : 's'}`
  if (d === 0) return 'Vence hoje'
  return `Vence em ${d} dia${d === 1 ? '' : 's'}`
}

export const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function baixarArquivo(nome: string, conteudo: string, tipo = 'text/plain') {
  const blob = new Blob([conteudo], { type: tipo + ';charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function gerarCSV(cabecalho: string[], linhas: string[][]) {
  const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`
  // BOM para o Excel abrir com acentos corretos; ; como separador (padrão pt-BR)
  return '﻿' + [cabecalho, ...linhas].map((l) => l.map(esc).join(';')).join('\r\n')
}

export const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

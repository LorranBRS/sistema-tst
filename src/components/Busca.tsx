// Busca global (Ctrl+K): procura em todos os cadastros e leva direto ao registro.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CornerDownLeft, Search, X } from 'lucide-react'
import { db, empresaDoRegistro, useDB } from '../lib/store'
import type { DB } from '../lib/types'
import { fmtData, normalizar } from '../lib/utils'
import { navegar } from './ui'

/** Texto que a próxima página de cadastro deve usar no campo de busca. */
export const buscaPendente = { texto: '' }
export const EVENTO_BUSCA = 'sistema-tst:busca'

export function irPara(rota: string, busca?: string) {
  buscaPendente.texto = busca ?? ''
  const mesma = window.location.hash.replace(/^#/, '') === rota
  navegar(rota)
  // Já estava na página: avisa a lista para aplicar a busca
  if (mesma && busca) window.dispatchEvent(new CustomEvent(EVENTO_BUSCA, { detail: busca }))
}

interface Resultado {
  tipo: string
  titulo: string
  sub: string
  rota: string
  busca?: string
  empresaId?: string
  texto: string
}

export interface PaginaMenu {
  rota: string
  nome: string
  icone: ReactNode
}

function indexar(d: DB): Resultado[] {
  const r: Resultado[] = []
  const emp = (id: string) => d.empresas.find((e) => e.id === id)?.nome ?? ''
  const col = (id: string) => d.colaboradores.find((c) => c.id === id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const add = (rec: any, tipo: string, titulo: string, sub: string, rota: string, extra = '', busca?: string) =>
    r.push({ tipo, titulo, sub, rota, busca, empresaId: tipo === 'Empresa' ? rec.id : empresaDoRegistro(d, rec), texto: normalizar(`${titulo} ${sub} ${extra}`) })

  for (const e of d.empresas) add(e, 'Empresa', e.nome, e.cnpj, '/app/empresas', e.cnae, e.nome)
  for (const c of d.colaboradores) add(c, 'Colaborador', c.nome, `${c.funcao} · ${c.setor} · ${emp(c.empresaId)}`, '/app/ficha-epi/' + c.id, c.matricula)
  for (const e of d.epis) add(e, 'EPI', e.nome, `CA ${e.ca}`, '/app/epis', e.fabricante, e.ca)
  for (const t of d.treinamentos) add(t, 'Treinamento', `${t.curso} – ${col(t.colaboradorId)?.nome ?? ''}`, `Realizado em ${fmtData(t.data)}`, '/app/treinamentos', '', col(t.colaboradorId)?.nome)
  for (const x of d.extintores) add(x, 'Extintor', `Extintor ${x.numero}`, `${x.tipo} ${x.capacidade} · ${x.local}`, '/app/extintores', emp(x.empresaId), x.numero)
  for (const x of d.equipamentos) add(x, 'Equipamento', `${x.tipo} ${x.numeroSerie}`, `${x.descricao} · ${x.local}`, '/app/equipamentos', x.fabricante, x.numeroSerie)
  for (const q of d.quimicos) add(q, 'Produto químico', q.nome, `${q.local} · CAS ${q.cas} · ONU ${q.onu}`, '/app/quimicos', q.fabricante, q.nome)
  for (const i of d.inspecoes) add(i, 'Inspeção', i.titulo, `${i.local} · ${fmtData(i.data)} · ${i.status}`, '/app/inspecoes/' + i.id, emp(i.empresaId))
  for (const a of d.aprs) add(a, 'APR', `${a.numero} – ${a.atividade}`, `${a.local} · ${fmtData(a.data)}`, '/app/apr/' + a.id, emp(a.empresaId))
  for (const p of d.pts) add(p, 'PT', `${p.numero} – ${p.tipo}`, `${p.atividade} · ${fmtData(p.data)}`, '/app/pt/' + p.id, `${p.local} ${p.executantes}`)
  for (const o of d.ocorrencias) add(o, 'Ocorrência', `${o.tipo} – ${fmtData(o.data)}`, `${o.local} · ${col(o.colaboradorId)?.nome ?? ''}`, '/app/investigacao/' + o.id, `${o.descricao} ${o.cat}`)
  for (const a of d.acoes) add(a, 'Ação', a.oque, `${a.quem || 'Sem responsável'} · ${a.status}`, '/app/acoes', a.origem, a.oque)
  for (const x of d.dds) add(x, 'DDS', x.tema, `${fmtData(x.data)} · ${x.responsavel}`, '/app/dds/' + x.id, emp(x.empresaId))
  for (const x of d.riscos) add(x, 'Risco (PGR)', x.perigo, `${x.setor} · ${x.tipo}`, '/app/pgr', `${x.fonte} ${x.funcoes}`, x.perigo)
  for (const o of d.ordens) add(o, 'Ordem de serviço', `OS – ${o.funcao}`, emp(o.empresaId), '/app/os/' + o.id)
  for (const c of d.contratadas) add(c, 'Contratada', c.nome, `${c.servico} · ${c.cnpj}`, '/app/terceiros/' + c.id, c.responsavel)
  for (const t of d.terceiros) add(t, 'Terceiro', t.nome, `${t.funcao} · ${d.contratadas.find((c) => c.id === t.contratadaId)?.nome ?? ''}`, '/app/terceiros/' + t.contratadaId, t.documento)
  for (const s of d.simulados) add(s, 'Simulado', `Simulado ${s.tipo}`, `${fmtData(s.data)} · ${s.local}`, '/app/simulados/' + s.id, s.cenario)
  for (const a of d.atestados) add(a, 'Atestado', `Atestado – ${col(a.colaboradorId)?.nome ?? ''}`, `${fmtData(a.data)} · ${a.dias} dia(s) · ${a.motivo}`, '/app/absenteismo', a.cid, col(a.colaboradorId)?.nome)
  for (const a of d.avaliacoes) add(a, 'Avaliação ambiental', `${a.agente} – ${a.ghe}`, `${a.setor} · ${String(a.resultado).replace(".", ",")} ${a.unidade} · ${fmtData(a.data)}`, '/app/avaliacoes', `${a.descricaoAgente} ${a.funcoes}`, a.ghe)
  for (const s of d.sipats) add(s, 'SIPAT', `SIPAT ${s.ano}`, `${emp(s.empresaId)} · ${fmtData(s.inicio)} a ${fmtData(s.fim)}`, '/app/sipat/' + s.id, `${s.tema} ${s.atividades.map((a) => a.tema).join(' ')}`)
  return r
}

export function BuscaGlobal({ paginas }: { paginas: PaginaMenu[] }) {
  const [aberto, setAberto] = useState(false)
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setAberto(true)
      }
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])
  return (
    <>
      <button className="btn btn-busca" onClick={() => setAberto(true)} title="Buscar em todo o sistema (Ctrl+K)" aria-label="Buscar em todo o sistema">
        <Search size={17} />
        <span className="esconde-mobile">Buscar</span>
        <kbd className="esconde-mobile">Ctrl K</kbd>
      </button>
      {aberto && createPortal(<JanelaBusca paginas={paginas} onClose={() => setAberto(false)} />, document.body)}
    </>
  )
}

function JanelaBusca({ paginas, onClose }: { paginas: PaginaMenu[]; onClose: () => void }) {
  const d = useDB()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const lista = useRef<HTMLDivElement>(null)
  const indice = useMemo(() => indexar(d), [d])

  const resultados = useMemo(() => {
    const termos = normalizar(q.trim()).split(/\s+/).filter(Boolean)
    const pags: Resultado[] = paginas.map((p) => ({ tipo: 'Página', titulo: p.nome, sub: 'Abrir módulo', rota: p.rota, texto: normalizar(p.nome) }))
    if (!termos.length) return pags.slice(0, 8)
    const casa = (r: Resultado) => termos.every((t) => r.texto.includes(t))
    const pontos = (r: Resultado) => (normalizar(r.titulo).startsWith(termos[0]) ? 0 : normalizar(r.titulo).includes(termos[0]) ? 1 : 2)
    return [...pags.filter(casa), ...indice.filter(casa).sort((a, b) => pontos(a) - pontos(b))].slice(0, 40)
  }, [q, indice, paginas])

  useEffect(() => setSel(0), [q])
  useEffect(() => {
    lista.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  function abrir(r?: Resultado) {
    if (!r) return
    onClose()
    // Registro de outra empresa: troca o filtro do topo para ele aparecer na lista
    const ativa = d.config.empresaAtiva
    if (ativa && r.empresaId && r.empresaId !== ativa && r.tipo !== 'Empresa') db.configurar({ empresaAtiva: r.empresaId })
    irPara(r.rota, r.busca)
  }

  function tecla(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, resultados.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); abrir(resultados[sel]) }
    else if (e.key === 'Escape') onClose()
  }

  // agrupa mantendo a ordem
  const grupos: { tipo: string; itens: { r: Resultado; i: number }[] }[] = []
  resultados.forEach((r, i) => {
    const g = grupos.find((x) => x.tipo === r.tipo)
    if (g) g.itens.push({ r, i })
    else grupos.push({ tipo: r.tipo, itens: [{ r, i }] })
  })

  return (
    <div className="busca-fundo" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="busca-caixa" role="dialog" aria-label="Busca global" aria-modal="true">
        <div className="busca-campo">
          <Search size={18} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={tecla}
            placeholder="Buscar colaborador, CA, extintor, APR, produto químico..."
            aria-label="Termo de busca"
            role="combobox"
            aria-expanded="true"
            aria-controls="busca-resultados"
          />
          <button className="btn btn-icon" onClick={onClose} aria-label="Fechar busca"><X size={17} /></button>
        </div>
        <div className="busca-lista" id="busca-resultados" role="listbox" ref={lista}>
          {resultados.length === 0 && <div className="busca-vazio">Nada encontrado para "{q}".</div>}
          {grupos.map((g) => (
            <div key={g.tipo}>
              <div className="busca-grupo">{g.tipo === 'Página' && !q.trim() ? 'Ir para' : g.tipo}</div>
              {g.itens.map(({ r, i }) => (
                <button
                  key={i}
                  role="option"
                  aria-selected={i === sel}
                  className="busca-item"
                  onMouseMove={() => sel !== i && setSel(i)}
                  onClick={() => abrir(r)}
                >
                  <span className="t">{r.titulo}</span>
                  <span className="s">{r.sub}</span>
                  {i === sel && <CornerDownLeft size={14} className="enter" />}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="busca-rodape esconde-mobile">↑ ↓ para escolher · Enter para abrir · Esc para fechar</div>
      </div>
    </div>
  )
}

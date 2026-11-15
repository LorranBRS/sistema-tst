// Mapa de riscos (padrão CIPA): círculos por tipo (cor) e grau (tamanho) sobre a planta do setor,
// gerados a partir do Inventário de riscos. Arraste os círculos para posicioná-los.
import { useRef, useState } from 'react'
import { ImagePlus, Printer, RotateCcw, Trash2 } from 'lucide-react'
import { CabecalhoDoc, Link, PageHead, Vazio, toast } from '../components/ui'
import { CORES_RISCO, TIPOS_RISCO } from '../lib/catalogos'
import { lerLogo } from '../lib/imagem'
import { daEmpresaAtiva, db, useDB } from '../lib/store'
import type { Risco } from '../lib/types'
import { fmtData, hoje } from '../lib/utils'
import { nivelDe } from './Riscos'

/** Grau do mapa: pequeno (baixo), médio (moderado), grande (alto/crítico) — em % da largura da planta. */
function grau(r: Risco) {
  const n = nivelDe(r)
  if (n.valor >= 10) return { nome: 'Grande', tam: 11 }
  if (n.valor >= 5) return { nome: 'Médio', tam: 8 }
  return { nome: 'Pequeno', tam: 5.5 }
}

export default function MapaRiscos() {
  const d = useDB()
  const riscos = daEmpresaAtiva(d, d.riscos)
  const pares = [...new Map(riscos.map((r) => [r.empresaId + '|' + r.setor, { empresaId: r.empresaId, setor: r.setor }])).values()].sort((a, b) => a.setor.localeCompare(b.setor))
  const [sel, setSel] = useState('')
  const atual = pares.find((p) => p.empresaId + '|' + p.setor === sel) ?? pares[0]

  if (!atual) {
    return (
      <>
        <PageHead titulo="Mapa de riscos" sub="Representação gráfica dos riscos de cada setor (NR-5), feita a partir do Inventário de riscos." />
        <div className="card"><Vazio texto="Cadastre riscos no Inventário de riscos (PGR) para montar o mapa."><Link to="/app/pgr" className="btn btn-primary">Ir para o inventário</Link></Vazio></div>
      </>
    )
  }
  return <Mapa key={atual.empresaId + atual.setor} empresaId={atual.empresaId} setor={atual.setor} pares={pares} onSetor={setSel} />
}

function Mapa({ empresaId, setor, pares, onSetor }: { empresaId: string; setor: string; pares: { empresaId: string; setor: string }[]; onSetor: (v: string) => void }) {
  const d = useDB()
  const caixa = useRef<HTMLDivElement>(null)
  const arquivo = useRef<HTMLInputElement>(null)
  const empresa = d.empresas.find((e) => e.id === empresaId)
  const riscos = d.riscos.filter((r) => r.empresaId === empresaId && r.setor === setor)
  const mapa = d.mapas.find((m) => m.empresaId === empresaId && m.setor === setor)
  const [arrastando, setArrastando] = useState<{ id: string; x: number; y: number } | null>(null)

  // Posição padrão: espalha os círculos em grade
  const padrao = (i: number) => {
    const col = 4
    return { x: 14 + (i % col) * 24, y: 22 + Math.floor(i / col) * 30 }
  }
  const pos = (r: Risco, i: number) => (arrastando?.id === r.id ? arrastando : mapa?.posicoes[r.id] ?? padrao(i))

  // Sempre lê o estado atual (evita criar dois registros quando dois eventos chegam juntos)
  const mapaAtual = () => db.estado.mapas.find((m) => m.empresaId === empresaId && m.setor === setor)
  function salvarMapa(patch: { planta?: string; posicoes?: Record<string, { x: number; y: number }> }) {
    const m = mapaAtual()
    if (m) db.atualizar('mapas', m.id, patch)
    else db.adicionar('mapas', { empresaId, setor, posicoes: {}, ...patch })
  }

  function mover(e: React.PointerEvent, id: string) {
    const r = caixa.current!.getBoundingClientRect()
    const x = Math.min(97, Math.max(3, ((e.clientX - r.left) / r.width) * 100))
    const y = Math.min(96, Math.max(4, ((e.clientY - r.top) / r.height) * 100))
    setArrastando({ id, x, y })
  }
  function soltar() {
    if (!arrastando) return
    const a = arrastando
    setArrastando(null)
    salvarMapa({ posicoes: { ...(mapaAtual()?.posicoes ?? {}), [a.id]: { x: a.x, y: a.y } } })
  }

  return (
    <>
      <div className="nao-imprimir">
        <PageHead titulo="Mapa de riscos" sub="Arraste os círculos para o local do risco na planta. Cor = tipo de risco · tamanho = grau · número = trabalhadores expostos.">
          <select className="input" style={{ width: 'auto' }} value={empresaId + '|' + setor} onChange={(e) => onSetor(e.target.value)} aria-label="Setor">
            {pares.map((p) => <option key={p.empresaId + p.setor} value={p.empresaId + '|' + p.setor}>{p.setor}{d.config.empresaAtiva ? '' : ` · ${d.empresas.find((e) => e.id === p.empresaId)?.nome}`}</option>)}
          </select>
          <button className="btn" onClick={() => arquivo.current?.click()}><ImagePlus size={16} /> {mapa?.planta ? 'Trocar planta' : 'Enviar planta / croqui'}</button>
          {mapa?.planta && <button className="btn btn-danger" onClick={() => confirm('Remover a planta deste setor?') && salvarMapa({ planta: '' })}><Trash2 size={16} /></button>}
          <button className="btn" title="Voltar os círculos para a posição inicial" onClick={() => confirm('Reorganizar todos os círculos?') && salvarMapa({ posicoes: {} })}><RotateCcw size={16} /></button>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Imprimir</button>
          <input ref={arquivo} type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try { salvarMapa({ planta: await lerLogo(f, 1400, 'image/jpeg') }); toast('Planta enviada') } catch (err) { alert((err as Error).message) }
          }} />
        </PageHead>
      </div>

      <div className="doc mapa-doc">
        <CabecalhoDoc empresa={empresa} />
        <h2>MAPA DE RISCOS – {setor.toUpperCase()}</h2>
        <div className="sub-doc">{empresa?.nome} · elaborado em {fmtData(hoje())}</div>
        <div
          ref={caixa}
          className={'mapa-area' + (mapa?.planta ? '' : ' sem-planta')}
          style={mapa?.planta ? { backgroundImage: `url(${mapa.planta})` } : undefined}
          onPointerMove={(e) => arrastando && mover(e, arrastando.id)}
          onPointerUp={soltar}
          onPointerLeave={soltar}
        >
          {!mapa?.planta && <span className="mapa-marca">{setor}<small className="nao-imprimir">Envie a planta ou um croqui do setor (foto ou imagem)</small></span>}
          {riscos.map((r, i) => {
            const p = pos(r, i)
            const g = grau(r)
            return (
              <button
                key={r.id}
                className="circulo-risco"
                style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${g.tam}%`, background: CORES_RISCO[r.tipo] ?? '#666' }}
                title={`${r.tipo} · ${r.perigo} · grau ${g.nome.toLowerCase()} · ${r.expostos} exposto(s)`}
                aria-label={`${r.tipo}: ${r.perigo}`}
                onPointerDown={(e) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); mover(e, r.id) }}
                onPointerMove={(e) => arrastando?.id === r.id && mover(e, r.id)}
                onPointerUp={(e) => { e.stopPropagation(); soltar() }}
              >
                <span>{r.expostos || ''}</span>
              </button>
            )
          })}
        </div>

        <div className="legenda-mapa">
          {TIPOS_RISCO.map((t) => <span key={t}><i style={{ background: CORES_RISCO[t] }} />{t}</span>)}
          <span className="sep" />
          <span><i className="g p" />Pequeno</span><span><i className="g m" />Médio</span><span><i className="g gr" />Grande</span>
        </div>

        <table>
          <thead><tr><th style={{ width: 30 }} /><th>Tipo</th><th>Perigo / fonte</th><th>Grau</th><th>Expostos</th><th>Medidas</th></tr></thead>
          <tbody>
            {riscos.map((r) => (
              <tr key={r.id}>
                <td><span className="bolinha" style={{ background: CORES_RISCO[r.tipo] }} /></td>
                <td>{r.tipo}</td>
                <td>{r.perigo}{r.fonte ? ` – ${r.fonte}` : ''}</td>
                <td>{grau(r).nome}</td>
                <td>{r.expostos}</td>
                <td>{r.medidasExistentes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="nota">Cores conforme o padrão usual dos mapas de risco: verde físico, vermelho químico, marrom biológico, amarelo ergonômico e azul acidente. Elaborado com participação da CIPA (NR-5).</p>
      </div>
    </>
  )
}

// Investigação de acidente/incidente: 5 porquês + causas por categoria (6M) + causa raiz.
import { ArrowLeft, CheckCheck, ListPlus, Plus, Printer, Trash2 } from 'lucide-react'
import { BadgeStatus, Campo, Link, PageHead, Vazio, toast } from '../components/ui'
import { CATEGORIAS_6M } from '../lib/catalogos'
import { db, nomes, useDB } from '../lib/store'
import type { Investigacao as Inv } from '../lib/types'
import { addDias, fmtData, hoje } from '../lib/utils'

const nova = (): Inv => ({
  dataInicio: hoje(),
  equipe: '',
  testemunhas: '',
  sequencia: '',
  porques: ['', '', '', '', ''],
  causas: {},
  causaRaiz: '',
  conclusao: '',
})

export default function Investigacao({ id }: { id: string }) {
  const d = useDB()
  const oc = d.ocorrencias.find((o) => o.id === id)
  if (!oc) return <Vazio texto="Ocorrência não encontrada."><Link to="/app/ocorrencias">Voltar</Link></Vazio>
  const inv = oc.investigacao ?? nova()
  const empresa = d.empresas.find((e) => e.id === oc.empresaId)
  const set = (patch: Partial<Inv>) => db.atualizar('ocorrencias', oc.id, { investigacao: { ...inv, ...patch } })
  const setPorque = (i: number, v: string) => set({ porques: inv.porques.map((p, j) => (j === i ? v : p)) })
  const causasPreenchidas = CATEGORIAS_6M.filter((c) => inv.causas[c]?.trim())

  function gerarAcoes() {
    const itens = causasPreenchidas.map((c) => ({ cat: c, texto: inv.causas[c] }))
    if (!itens.length && !inv.causaRaiz.trim()) return alert('Preencha as causas ou a causa raiz antes de gerar ações.')
    const base = itens.length ? itens : [{ cat: 'Causa raiz', texto: inv.causaRaiz }]
    for (const it of base) {
      db.adicionar('acoes', {
        empresaId: oc!.empresaId,
        oque: `Eliminar causa (${it.cat}): ${it.texto}`,
        porque: `Investigação da ocorrência de ${fmtData(oc!.data)} – ${oc!.tipo}`,
        onde: oc!.local,
        quem: '',
        quando: addDias(hoje(), 30),
        como: '',
        quanto: '',
        prioridade: oc!.gravidade === 'Com afastamento' || oc!.gravidade === 'Fatal' ? 'Alta' : 'Média',
        status: 'Aberta',
        origem: `Investigação: ${oc!.tipo} (${fmtData(oc!.data)})`,
      })
    }
    set({ acoesGeradas: true })
    toast(`${base.length} ação(ões) criada(s) no plano de ação`)
  }

  return (
    <>
      <div className="nao-imprimir" style={{ marginBottom: 10 }}>
        <Link to="/app/ocorrencias"><ArrowLeft size={14} style={{ verticalAlign: -2 }} /> Ocorrências</Link>
      </div>
      <div className="nao-imprimir">
        <PageHead titulo="Investigação de ocorrência" sub={`${oc.tipo} · ${fmtData(oc.data)} · ${oc.local || 'local não informado'}`}>
          <button className="btn" onClick={gerarAcoes} disabled={inv.acoesGeradas}>
            <ListPlus size={16} /> {inv.acoesGeradas ? 'Ações já geradas' : 'Gerar ações'}
          </button>
          <button className="btn" onClick={() => window.print()}><Printer size={16} /> Imprimir / PDF</button>
          {inv.concluida ? (
            <button className="btn" onClick={() => { set({ concluida: false }); db.atualizar('ocorrencias', oc.id, { status: 'Em investigação' }) }}>Reabrir</button>
          ) : (
            <button className="btn btn-primary" onClick={() => {
              if (!inv.causaRaiz.trim()) return alert('Informe a causa raiz antes de concluir.')
              db.atualizar('ocorrencias', oc.id, { status: 'Concluída', investigacao: { ...inv, concluida: true } })
              toast('Investigação concluída')
            }}>
              <CheckCheck size={16} /> Concluir
            </button>
          )}
        </PageHead>

        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <BadgeStatus valor={oc.gravidade} />
            <BadgeStatus valor={oc.status} />
            {oc.colaboradorId && <span className="badge">{nomes.colaborador(d, oc.colaboradorId)}</span>}
            {oc.cat && <span className="badge info">CAT {oc.cat}</span>}
          </div>
          <p style={{ margin: '0 0 14px', color: 'var(--muted)' }}>{oc.descricao || 'Sem descrição registrada.'}</p>
          <div className="form-grid">
            <Campo label="Início da investigação"><input className="input" type="date" value={inv.dataInicio} onChange={(e) => set({ dataInicio: e.target.value })} /></Campo>
            <Campo label="Testemunhas"><input className="input" value={inv.testemunhas} onChange={(e) => set({ testemunhas: e.target.value })} /></Campo>
            <Campo label="Equipe de investigação" full><input className="input" value={inv.equipe} onChange={(e) => set({ equipe: e.target.value })} placeholder="Ex.: técnico de segurança, supervisor, membro da CIPA" /></Campo>
            <Campo label="Como aconteceu (sequência dos fatos)" full>
              <textarea className="input" value={inv.sequencia} onChange={(e) => set({ sequencia: e.target.value })} />
            </Campo>
          </div>
        </div>

        <div className="grid grid-2" style={{ marginBottom: 16 }}>
          <div className="card card-pad">
            <h3 style={{ fontSize: 15, marginBottom: 4 }}>5 porquês</h3>
            <p className="nota" style={{ marginTop: 0 }}>Pergunte "por quê?" a partir do fato até chegar à causa que, eliminada, impede a repetição.</p>
            {inv.porques.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                <span className="badge info" style={{ marginTop: 8 }}>{i + 1}º</span>
                <textarea className="input" style={{ minHeight: 52 }} value={p} onChange={(e) => setPorque(i, e.target.value)} placeholder={i === 0 ? 'Por que o fato aconteceu?' : 'Por quê?'} />
                {inv.porques.length > 1 && (
                  <button className="btn btn-icon btn-danger" aria-label="Remover" onClick={() => set({ porques: inv.porques.filter((_, j) => j !== i) })}><Trash2 size={15} /></button>
                )}
              </div>
            ))}
            <button className="btn btn-sm" onClick={() => set({ porques: [...inv.porques, ''] })}><Plus size={14} /> Mais um porquê</button>
          </div>

          <div className="card card-pad">
            <h3 style={{ fontSize: 15, marginBottom: 4 }}>Causas por categoria (6M)</h3>
            <p className="nota" style={{ marginTop: 0 }}>Diagrama de Ishikawa: preencha só as categorias que contribuíram. Cada uma vira uma ação ao clicar em "Gerar ações".</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {CATEGORIAS_6M.map((c) => (
                <Campo key={c} label={c}>
                  <input className="input" value={inv.causas[c] ?? ''} onChange={(e) => set({ causas: { ...inv.causas, [c]: e.target.value } })} />
                </Campo>
              ))}
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <div className="form-grid">
            <Campo label="Causa raiz *" full><textarea className="input" style={{ minHeight: 60 }} value={inv.causaRaiz} onChange={(e) => set({ causaRaiz: e.target.value })} /></Campo>
            <Campo label="Conclusão e recomendações" full><textarea className="input" value={inv.conclusao} onChange={(e) => set({ conclusao: e.target.value })} /></Campo>
          </div>
        </div>
      </div>

      {/* Versão para impressão */}
      <div className="so-impressao doc">
        <h2>RELATÓRIO DE INVESTIGAÇÃO DE OCORRÊNCIA</h2>
        <div className="sub-doc">{empresa?.nome} · CNPJ {empresa?.cnpj}</div>
        <div className="info">
          <div><b>Tipo:</b> {oc.tipo}</div>
          <div><b>Data:</b> {fmtData(oc.data)}</div>
          <div><b>Gravidade:</b> {oc.gravidade}{oc.diasPerdidos ? ` (${oc.diasPerdidos} dias perdidos)` : ''}</div>
          <div><b>Local:</b> {oc.local}</div>
          <div><b>Envolvido:</b> {oc.colaboradorId ? nomes.colaborador(d, oc.colaboradorId) : '—'}</div>
          <div><b>Parte do corpo:</b> {oc.parteCorpo || '—'}</div>
          <div><b>CAT:</b> {oc.cat || '—'}</div>
          <div><b>Testemunhas:</b> {inv.testemunhas || '—'}</div>
          <div style={{ gridColumn: '1 / -1' }}><b>Equipe:</b> {inv.equipe}</div>
        </div>
        <p className="declaracao"><b>Descrição:</b> {oc.descricao}</p>
        <p className="declaracao"><b>Sequência dos fatos:</b> {inv.sequencia}</p>
        <table>
          <thead><tr><th style={{ width: 50 }}>#</th><th>5 porquês</th></tr></thead>
          <tbody>{inv.porques.filter((p) => p.trim()).map((p, i) => <tr key={i}><td>{i + 1}º</td><td>{p}</td></tr>)}</tbody>
        </table>
        {causasPreenchidas.length > 0 && (
          <table>
            <thead><tr><th style={{ width: 140 }}>Categoria</th><th>Causa contribuinte</th></tr></thead>
            <tbody>{causasPreenchidas.map((c) => <tr key={c}><td>{c}</td><td>{inv.causas[c]}</td></tr>)}</tbody>
          </table>
        )}
        <p className="declaracao"><b>Causa raiz:</b> {inv.causaRaiz}</p>
        <p className="declaracao"><b>Conclusão e recomendações:</b> {inv.conclusao}</p>
        <div className="assinaturas">
          <div>{d.config.tecnico}<br />Técnico(a) de Segurança do Trabalho</div>
          <div>{empresa?.responsavel || 'Responsável da empresa'}<br />Ciente</div>
        </div>
      </div>
    </>
  )
}

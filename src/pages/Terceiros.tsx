// Terceiros / contratadas: documentos da empresa e dos trabalhadores, com liberação de acesso.
import { useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronRight, Plus, Printer, ShieldCheck, ShieldX, Trash2 } from 'lucide-react'
import { BlocoAssinatura } from '../components/Assinatura'
import { CabecalhoDoc, Campo, Link, Modal, PageHead, Vazio, navegar, toast } from '../components/ui'
import { DOCS_EMPRESA_TERCEIRO, DOCS_TRAB_TERCEIRO } from '../lib/catalogos'
import { daEmpresaAtiva, db, nomes, useDB } from '../lib/store'
import type { Contratada, DocEntregue, Terceiro } from '../lib/types'
import { fmtData, hoje, situacao, textoPrazo } from '../lib/utils'

/** Pendências que impedem a entrada (documento faltando ou vencido) e avisos (a vencer). */
export function avaliar(c: Contratada, t: Terceiro | null, alerta = 30) {
  const bloqueios: string[] = []
  const avisos: string[] = []
  const conferir = (exigidos: string[], docs: DocEntregue[], de: string) => {
    for (const tipo of exigidos) {
      const doc = docs.find((x) => x.tipo === tipo)
      if (!doc) bloqueios.push(`${tipo}${de} não entregue`)
      else if (situacao(doc.validade, alerta) === 'vencido') bloqueios.push(`${tipo}${de} vencido`)
      else if (situacao(doc.validade, alerta) === 'avencer') avisos.push(`${tipo}${de} vence em ${fmtData(doc.validade)}`)
    }
  }
  if (c.contratoFim && situacao(c.contratoFim) === 'vencido') bloqueios.push('Contrato encerrado')
  conferir(c.docsExigidosEmpresa, c.docs, ' da empresa')
  if (t) {
    if (!t.ativo) bloqueios.push('Trabalhador inativo')
    conferir(c.docsExigidosTrab, t.docs, '')
  }
  return { liberado: bloqueios.length === 0, bloqueios, avisos }
}

export default function Terceiros() {
  const d = useDB()
  const [nova, setNova] = useState(false)
  const lista = [...daEmpresaAtiva(d, d.contratadas)].sort((a, b) => a.nome.localeCompare(b.nome))

  return (
    <>
      <PageHead titulo="Terceiros e contratadas" sub="Documentação das empresas prestadoras e dos seus trabalhadores, com liberação de acesso para a portaria.">
        <button className="btn btn-primary" onClick={() => setNova(true)}><Plus size={16} /> Nova contratada</button>
      </PageHead>
      <div className="card">
        {lista.length === 0 ? <Vazio texto="Nenhuma contratada cadastrada." /> : (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead><tr><th>Contratada</th><th className="esconde-mobile">Cliente / unidade</th><th>Documentos da empresa</th><th>Trabalhadores liberados</th><th className="esconde-mobile">Contrato</th></tr></thead>
              <tbody>
                {lista.map((c) => {
                  const emp = avaliar(c, null, d.config.alertaDias)
                  const trab = d.terceiros.filter((t) => t.contratadaId === c.id && t.ativo)
                  const lib = trab.filter((t) => avaliar(c, t, d.config.alertaDias).liberado).length
                  return (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navegar('/app/terceiros/' + c.id)}>
                      <td><strong>{c.nome}</strong><span className="sub">{c.servico}</span></td>
                      <td className="esconde-mobile">{nomes.empresa(d, c.empresaId)}</td>
                      <td>{emp.liberado ? <span className={'badge ' + (emp.avisos.length ? 'avencer' : 'ok')}>{emp.avisos.length ? `${emp.avisos.length} a vencer` : 'Em dia'}</span> : <span className="badge vencido">{emp.bloqueios.length} pendência(s)</span>}</td>
                      <td><span className={'badge ' + (lib === trab.length && trab.length ? 'ok' : lib ? 'avencer' : 'vencido')}>{lib}/{trab.length}</span></td>
                      <td className="esconde-mobile">{c.contratoFim ? <><div>{fmtData(c.contratoFim)}</div><span className="sub">{textoPrazo(c.contratoFim)}</span></> : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {nova && <NovaContratada onClose={() => setNova(false)} />}
    </>
  )
}

function NovaContratada({ onClose }: { onClose: () => void }) {
  const d = useDB()
  const [nome, setNome] = useState('')
  const [servico, setServico] = useState('')
  const [empresaId, setEmpresa] = useState(d.config.empresaAtiva || d.empresas[0]?.id || '')
  return (
    <Modal titulo="Nova contratada" onClose={onClose} rodape={
      <>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={() => {
          if (!nome.trim() || !empresaId) return alert('Informe o nome e a empresa cliente.')
          const id = db.adicionar('contratadas', { empresaId, nome: nome.trim(), cnpj: '', servico, responsavel: '', telefone: '', contratoFim: '', docsExigidosEmpresa: ['PGR', 'PCMSO'], docsExigidosTrab: ['ASO', 'Integração de segurança', 'Ficha de EPI'], docs: [] })
          onClose(); navegar('/app/terceiros/' + id)
        }}>Cadastrar</button>
      </>
    }>
      <div className="form-grid">
        <Campo label="Nome da contratada *" full><input className="input" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus /></Campo>
        <Campo label="Serviço prestado"><input className="input" value={servico} onChange={(e) => setServico(e.target.value)} /></Campo>
        <Campo label="Cliente / unidade *">
          <select className="input" value={empresaId} onChange={(e) => setEmpresa(e.target.value)}>{d.empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select>
        </Campo>
      </div>
    </Modal>
  )
}

/** Lista de documentos exigidos com "entregue" + validade. */
function EditorDocs({ exigidos, docs, onChange }: { exigidos: string[]; docs: DocEntregue[]; onChange: (d: DocEntregue[]) => void }) {
  const d = useDB()
  if (!exigidos.length) return <p className="nota">Nenhum documento exigido.</p>
  return (
    <div className="docs-lista">
      {exigidos.map((tipo) => {
        const doc = docs.find((x) => x.tipo === tipo)
        const s = doc ? situacao(doc.validade, d.config.alertaDias) : 'falta'
        return (
          <div key={tipo} className="doc-linha">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 150, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!doc} style={{ width: 17, height: 17 }} onChange={() => onChange(doc ? docs.filter((x) => x.tipo !== tipo) : [...docs, { tipo, validade: '' }])} />
              <span>{tipo}</span>
            </label>
            {doc && <input className="input" type="date" style={{ width: 160 }} value={doc.validade} aria-label={`Validade de ${tipo}`} onChange={(e) => onChange(docs.map((x) => (x.tipo === tipo ? { ...x, validade: e.target.value } : x)))} />}
            <span className={'badge ' + ({ falta: 'vencido', vencido: 'vencido', avencer: 'avencer', ok: 'ok', sem: 'ok' } as Record<string, string>)[s]}>
              {({ falta: 'Falta', vencido: 'Vencido', avencer: 'A vencer', ok: 'Em dia', sem: 'Entregue' } as Record<string, string>)[s]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function DetalheContratada({ id }: { id: string }) {
  const d = useDB()
  const [aberto, setAberto] = useState<string | null>(null)
  const [novoNome, setNovoNome] = useState('')
  const c = d.contratadas.find((x) => x.id === id)
  if (!c) return <Vazio texto="Contratada não encontrada."><Link to="/app/terceiros">Voltar</Link></Vazio>
  const empresa = d.empresas.find((e) => e.id === c.empresaId)
  const set = (p: Partial<Contratada>) => db.atualizar('contratadas', c.id, p)
  const trab = d.terceiros.filter((t) => t.contratadaId === c.id).sort((a, b) => a.nome.localeCompare(b.nome))
  const emp = avaliar(c, null, d.config.alertaDias)
  const toggle = (lista: string[], v: string) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v])

  function addTrab() {
    if (!novoNome.trim()) return
    const tid = db.adicionar('terceiros', { contratadaId: c!.id, nome: novoNome.trim(), funcao: '', documento: '', ativo: true, docs: [] })
    setNovoNome(''); setAberto(tid); toast('Trabalhador adicionado')
  }

  return (
    <>
      <div className="nao-imprimir" style={{ marginBottom: 10 }}>
        <Link to="/app/terceiros"><ArrowLeft size={14} style={{ verticalAlign: -2 }} /> Terceiros</Link>
      </div>
      <div className="nao-imprimir">
        <PageHead titulo={c.nome} sub={`${c.servico || 'Serviço não informado'} · cliente: ${empresa?.nome ?? '—'}`}>
          <button className="btn btn-danger" onClick={() => { if (confirm(`Excluir a contratada ${c.nome} e seus trabalhadores?`)) { trab.forEach((t) => db.remover('terceiros', t.id)); db.remover('contratadas', c.id); navegar('/app/terceiros') } }}><Trash2 size={16} /></button>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Lista para a portaria</button>
        </PageHead>

        <div className="grid grid-2" style={{ marginBottom: 16 }}>
          <div className="card card-pad">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Dados da contratada</h3>
            <div className="form-grid">
              <Campo label="Nome" full><input className="input" value={c.nome} onChange={(e) => set({ nome: e.target.value })} /></Campo>
              <Campo label="CNPJ"><input className="input" value={c.cnpj} onChange={(e) => set({ cnpj: e.target.value })} /></Campo>
              <Campo label="Serviço"><input className="input" value={c.servico} onChange={(e) => set({ servico: e.target.value })} /></Campo>
              <Campo label="Responsável"><input className="input" value={c.responsavel} onChange={(e) => set({ responsavel: e.target.value })} /></Campo>
              <Campo label="Telefone"><input className="input" value={c.telefone} onChange={(e) => set({ telefone: e.target.value })} /></Campo>
              <Campo label="Fim do contrato"><input className="input" type="date" value={c.contratoFim} onChange={(e) => set({ contratoFim: e.target.value })} /></Campo>
              <Campo label="Cliente / unidade">
                <select className="input" value={c.empresaId} onChange={(e) => set({ empresaId: e.target.value })}>{d.empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select>
              </Campo>
            </div>
          </div>
          <div className="card card-pad">
            <h3 style={{ fontSize: 15, marginBottom: 6 }}>Documentos exigidos</h3>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Da empresa</label>
              <div className="chips">{DOCS_EMPRESA_TERCEIRO.map((x) => <button key={x} className={'chip' + (c.docsExigidosEmpresa.includes(x) ? ' ativo' : '')} onClick={() => set({ docsExigidosEmpresa: toggle(c.docsExigidosEmpresa, x) })}>{x}</button>)}</div>
            </div>
            <div className="field">
              <label>De cada trabalhador</label>
              <div className="chips">{DOCS_TRAB_TERCEIRO.map((x) => <button key={x} className={'chip' + (c.docsExigidosTrab.includes(x) ? ' ativo' : '')} onClick={() => set({ docsExigidosTrab: toggle(c.docsExigidosTrab, x) })}>{x}</button>)}</div>
            </div>
          </div>
        </div>

        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <h3 style={{ fontSize: 15, margin: 0 }}>Documentos da empresa</h3>
            {emp.liberado ? <span className="badge ok">Em dia</span> : <span className="badge vencido">{emp.bloqueios.length} pendência(s)</span>}
          </div>
          <EditorDocs exigidos={c.docsExigidosEmpresa} docs={c.docs} onChange={(docs) => set({ docs })} />
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Trabalhadores ({trab.length})</h3>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <input className="input" style={{ width: 220 }} placeholder="Nome do trabalhador" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTrab()} />
              <button className="btn btn-sm btn-primary" onClick={addTrab}><Plus size={14} /> Adicionar</button>
            </div>
          </div>
          {trab.length === 0 ? <Vazio texto="Nenhum trabalhador cadastrado." /> : trab.map((t) => {
            const av = avaliar(c, t, d.config.alertaDias)
            const exp = aberto === t.id
            const setT = (p: Partial<Terceiro>) => db.atualizar('terceiros', t.id, p)
            return (
              <div key={t.id} className="terceiro">
                <button className="terceiro-cab" onClick={() => setAberto(exp ? null : t.id)} aria-expanded={exp}>
                  {exp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                    <div className="titulo" style={{ fontWeight: 600 }}>{t.nome}</div>
                    <div className="sub" style={{ fontSize: 12.5, color: 'var(--muted)' }}>{t.funcao || 'Função não informada'}{!av.liberado ? ` · ${av.bloqueios.join('; ')}` : av.avisos.length ? ` · ${av.avisos.join('; ')}` : ''}</div>
                  </div>
                  {av.liberado ? <span className={'badge ' + (av.avisos.length ? 'avencer' : 'ok')}><ShieldCheck size={13} /> Liberado</span> : <span className="badge vencido"><ShieldX size={13} /> Bloqueado</span>}
                </button>
                {exp && (
                  <div className="terceiro-corpo">
                    <div className="form-grid" style={{ marginBottom: 12 }}>
                      <Campo label="Nome"><input className="input" value={t.nome} onChange={(e) => setT({ nome: e.target.value })} /></Campo>
                      <Campo label="Função"><input className="input" value={t.funcao} onChange={(e) => setT({ funcao: e.target.value })} /></Campo>
                      <Campo label="Documento de identificação"><input className="input" value={t.documento} onChange={(e) => setT({ documento: e.target.value })} placeholder="RG ou matrícula" /></Campo>
                      <Campo label="Situação">
                        <select className="input" value={t.ativo ? 'Ativo' : 'Inativo'} onChange={(e) => setT({ ativo: e.target.value === 'Ativo' })}><option>Ativo</option><option>Inativo</option></select>
                      </Campo>
                    </div>
                    <EditorDocs exigidos={c.docsExigidosTrab} docs={t.docs} onChange={(docs) => setT({ docs })} />
                    <button className="btn btn-sm btn-danger" style={{ marginTop: 10 }} onClick={() => confirm(`Excluir ${t.nome}?`) && db.remover('terceiros', t.id)}><Trash2 size={14} /> Excluir trabalhador</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="so-impressao doc">
        <CabecalhoDoc empresa={empresa} />
        <h2>LIBERAÇÃO DE ACESSO – TERCEIROS</h2>
        <div className="sub-doc">{empresa?.nome} · emitido em {fmtData(hoje())}</div>
        <div className="info">
          <div><b>Contratada:</b> {c.nome}</div>
          <div><b>CNPJ:</b> {c.cnpj || '—'}</div>
          <div><b>Serviço:</b> {c.servico || '—'}</div>
          <div><b>Responsável:</b> {c.responsavel || '—'} {c.telefone}</div>
          <div><b>Contrato até:</b> {fmtData(c.contratoFim)}</div>
          <div><b>Documentos da empresa:</b> {emp.liberado ? 'em dia' : emp.bloqueios.join('; ')}</div>
        </div>
        <table>
          <thead><tr><th>Trabalhador</th><th>Função</th><th>Documento</th><th>Situação</th><th>Observação</th></tr></thead>
          <tbody>
            {trab.filter((t) => t.ativo).map((t) => {
              const av = avaliar(c, t, d.config.alertaDias)
              return <tr key={t.id}><td>{t.nome}</td><td>{t.funcao}</td><td>{t.documento}</td><td><b>{av.liberado ? 'LIBERADO' : 'BLOQUEADO'}</b></td><td>{av.liberado ? av.avisos.join('; ') : av.bloqueios.join('; ')}</td></tr>
            })}
          </tbody>
        </table>
        <p className="declaracao">Lista válida para a data de emissão. Trabalhadores bloqueados só podem entrar após a regularização dos documentos junto ao SESMT.</p>
        <div className="assinaturas">
          <BlocoAssinatura imagem={d.config.assinatura}>{d.config.tecnico}<br />Segurança do Trabalho</BlocoAssinatura>
          <div>Portaria<br />Recebido em ___/___/______</div>
        </div>
      </div>
    </>
  )
}

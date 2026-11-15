// Ordem de Serviço de SST por função (NR-1): riscos do inventário, medidas, EPIs, treinamentos e ciência do colaborador.
import { useState } from 'react'
import { ArrowLeft, CheckCircle2, FileSignature, PenLine, Plus, Printer, Trash2 } from 'lucide-react'
import { BlocoAssinatura, ImgAssinatura, PadAssinatura, quandoAssinou } from '../components/Assinatura'
import { CabecalhoDoc, Campo, Link, PageHead, Vazio, navegar, toast } from '../components/ui'
import { OS_PADRAO } from '../lib/catalogos'
import { db, nomes, useDB } from '../lib/store'
import type { DB, OrdemServico } from '../lib/types'
import { fmtData, hoje, normalizar } from '../lib/utils'
import { cursosDaFuncao } from './Matriz'
import { nivelDe } from './Riscos'

const mesma = (a: string, b: string) => normalizar(a.trim()) === normalizar(b.trim())

/** Riscos do inventário ligados à função (pelo campo "Funções expostas" ou pelo setor de quem exerce a função). */
export function riscosDaFuncao(d: DB, empresaId: string, funcao: string) {
  const setores = new Set(d.colaboradores.filter((c) => c.empresaId === empresaId && mesma(c.funcao, funcao)).map((c) => normalizar(c.setor)))
  return d.riscos
    .filter((r) => r.empresaId === empresaId)
    .filter((r) => r.funcoes.split(',').some((f) => mesma(f, funcao)) || (!r.funcoes.trim() && setores.has(normalizar(r.setor))))
    .sort((a, b) => nivelDe(b).valor - nivelDe(a).valor)
}

const colabsDa = (d: DB, os: Pick<OrdemServico, 'empresaId' | 'funcao'>) =>
  d.colaboradores.filter((c) => c.empresaId === os.empresaId && c.status !== 'Desligado' && mesma(c.funcao, os.funcao)).sort((a, b) => a.nome.localeCompare(b.nome))

export default function Ordens() {
  const d = useDB()
  const empresas = d.config.empresaAtiva ? d.empresas.filter((e) => e.id === d.config.empresaAtiva) : d.empresas
  const linhas = empresas.flatMap((e) => {
    const funcoes = [...new Set(d.colaboradores.filter((c) => c.empresaId === e.id && c.status !== 'Desligado').map((c) => c.funcao.trim()).filter(Boolean))]
    return funcoes.map((f) => ({ empresa: e, funcao: f, os: d.ordens.find((o) => o.empresaId === e.id && mesma(o.funcao, f)) }))
  }).sort((a, b) => a.empresa.nome.localeCompare(b.empresa.nome) || a.funcao.localeCompare(b.funcao))

  function criar(empresaId: string, funcao: string) {
    const colabs = d.colaboradores.filter((c) => c.empresaId === empresaId && mesma(c.funcao, funcao)).map((c) => c.id)
    const epis = [...new Set(d.entregas.filter((x) => colabs.includes(x.colaboradorId)).map((x) => nomes.epi(d, x.epiId)))]
    const id = db.adicionar('ordens', { empresaId, funcao, atividades: '', epis: epis.join(', '), obrigacoes: OS_PADRAO.obrigacoes, proibicoes: OS_PADRAO.proibicoes, emergencia: OS_PADRAO.emergencia, revisao: hoje() })
    navegar('/app/os/' + id)
  }

  return (
    <>
      <PageHead titulo="Ordens de Serviço" sub="OS de segurança e saúde por função (NR-1): riscos do inventário, medidas, EPIs, treinamentos exigidos e ciência assinada pelo colaborador." />
      <div className="card">
        {linhas.length === 0 ? <Vazio texto="Cadastre colaboradores com função para gerar as ordens de serviço." /> : (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead><tr><th>Função</th><th className="esconde-mobile">Empresa</th><th>Riscos</th><th>Ciência</th><th /></tr></thead>
              <tbody>
                {linhas.map(({ empresa, funcao, os }) => {
                  const colabs = colabsDa(d, { empresaId: empresa.id, funcao })
                  const assinados = os ? colabs.filter((c) => os.assinaturas?.some((a) => mesma(a.nome, c.nome))).length : 0
                  return (
                    <tr key={empresa.id + funcao}>
                      <td><strong>{funcao}</strong><span className="sub">{colabs.length} colaborador(es){os ? ` · revisão ${fmtData(os.revisao)}` : ''}</span></td>
                      <td className="esconde-mobile">{empresa.nome}</td>
                      <td>{riscosDaFuncao(d, empresa.id, funcao).length}</td>
                      <td>{os ? <span className={'badge ' + (assinados === colabs.length ? 'ok' : 'avencer')}>{assinados}/{colabs.length} assinada(s)</span> : <span className="badge">Sem OS</span>}</td>
                      <td>
                        <div className="acoes-linha">
                          {os ? (
                            <>
                              <Link to={'/app/os/' + os.id} className="btn btn-sm"><FileSignature size={14} /> Abrir</Link>
                              <button className="btn btn-icon btn-danger" aria-label="Excluir OS" onClick={() => confirm(`Excluir a OS da função ${funcao}?`) && db.remover('ordens', os.id)}><Trash2 size={15} /></button>
                            </>
                          ) : (
                            <button className="btn btn-sm btn-primary" onClick={() => criar(empresa.id, funcao)}><Plus size={14} /> Criar OS</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="nota">Os riscos vêm do Inventário de riscos (PGR) quando a função aparece em “Funções expostas”. Os treinamentos vêm da Matriz de treinamentos.</p>
    </>
  )
}

export function EditarOrdem({ id }: { id: string }) {
  const d = useDB()
  const [assinando, setAssinando] = useState<string | null>(null)
  const [imprimirPara, setImprimirPara] = useState('')
  const os = d.ordens.find((o) => o.id === id)
  if (!os) return <Vazio texto="Ordem de serviço não encontrada."><Link to="/app/os">Voltar</Link></Vazio>
  const empresa = d.empresas.find((e) => e.id === os.empresaId)
  const set = (p: Partial<OrdemServico>) => db.atualizar('ordens', os.id, p)
  const riscos = riscosDaFuncao(d, os.empresaId, os.funcao)
  const cursos = cursosDaFuncao(d, os.funcao)
  const colabs = colabsDa(d, os)
  const assinaturaDe = (nome: string) => os.assinaturas?.find((a) => mesma(a.nome, nome))
  const alvo = colabs.find((c) => c.id === imprimirPara)

  return (
    <>
      <div className="nao-imprimir" style={{ marginBottom: 10 }}>
        <Link to="/app/os"><ArrowLeft size={14} style={{ verticalAlign: -2 }} /> Ordens de serviço</Link>
      </div>
      <div className="nao-imprimir">
        <PageHead titulo={`OS · ${os.funcao}`} sub={`${empresa?.nome ?? '—'} · as alterações são salvas automaticamente`}>
          <select className="input" style={{ width: 'auto' }} value={imprimirPara} onChange={(e) => setImprimirPara(e.target.value)} aria-label="Imprimir para">
            <option value="">Imprimir: lista de todos</option>
            {colabs.map((c) => <option key={c.id} value={c.id}>Imprimir: {c.nome}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Imprimir / PDF</button>
        </PageHead>

        <div className="grid grid-2" style={{ marginBottom: 16 }}>
          <div className="card card-pad">
            <h3 style={{ fontSize: 15, marginBottom: 8 }}>Riscos da função ({riscos.length})</h3>
            {riscos.length === 0 ? <p className="nota" style={{ marginTop: 0 }}>Nenhum risco do inventário ligado a esta função. Inclua “{os.funcao}” em “Funções expostas” no <Link to="/app/pgr">Inventário de riscos</Link>.</p> : (
              <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6, fontSize: 14 }}>
                {riscos.map((r) => { const n = nivelDe(r); return <li key={r.id}><span className={'risco ' + n.cls}>{n.nome}</span> <b>{r.tipo}:</b> {r.perigo} — {r.medidasExistentes || 'sem medidas registradas'}</li> })}
              </ul>
            )}
          </div>
          <div className="card card-pad">
            <h3 style={{ fontSize: 15, marginBottom: 8 }}>Treinamentos exigidos ({cursos.length})</h3>
            {cursos.length === 0 ? <p className="nota" style={{ marginTop: 0 }}>Defina os cursos da função na <Link to="/app/matriz">Matriz de treinamentos</Link>.</p> : (
              <div className="chips">{cursos.map((c) => <span key={c} className="badge info">{c}</span>)}</div>
            )}
          </div>
        </div>

        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="form-grid">
            <Campo label="Descrição das atividades" full><textarea className="input" value={os.atividades} onChange={(e) => set({ atividades: e.target.value })} placeholder="O que o trabalhador faz no dia a dia" /></Campo>
            <Campo label="EPIs obrigatórios" full><textarea className="input" style={{ minHeight: 60 }} value={os.epis} onChange={(e) => set({ epis: e.target.value })} /></Campo>
            <Campo label="Obrigações" full><textarea className="input" value={os.obrigacoes} onChange={(e) => set({ obrigacoes: e.target.value })} /></Campo>
            <Campo label="Proibições" full><textarea className="input" value={os.proibicoes} onChange={(e) => set({ proibicoes: e.target.value })} /></Campo>
            <Campo label="Procedimentos em caso de emergência ou acidente" full><textarea className="input" value={os.emergencia} onChange={(e) => set({ emergencia: e.target.value })} /></Campo>
            <Campo label="Data da revisão"><input className="input" type="date" value={os.revisao} onChange={(e) => set({ revisao: e.target.value })} /></Campo>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Ciência dos colaboradores</h3><span className="badge">{colabs.filter((c) => assinaturaDe(c.nome)).length}/{colabs.length}</span></div>
          {colabs.length === 0 ? <Vazio texto="Nenhum colaborador ativo com esta função." /> : (
            <ul className="lista">
              {colabs.map((c) => {
                const a = assinaturaDe(c.nome)
                return (
                  <li key={c.id}>
                    <div style={{ minWidth: 0 }}>
                      <div className="titulo">{c.nome}</div>
                      <div className="sub">{a ? `Assinou em ${quandoAssinou(a)}` : 'Ainda não assinou'}</div>
                    </div>
                    <div className="dir" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {a ? (
                        <>
                          <ImgAssinatura a={a} altura={30} />
                          <CheckCircle2 size={18} color="var(--ok)" />
                          <button className="btn btn-icon btn-danger" aria-label={`Remover assinatura de ${c.nome}`} onClick={() => confirm(`Remover a assinatura de ${c.nome}?`) && set({ assinaturas: os.assinaturas!.filter((x) => !mesma(x.nome, c.nome)) })}><Trash2 size={14} /></button>
                        </>
                      ) : (
                        <button className="btn btn-sm btn-primary" onClick={() => setAssinando(c.nome)}><PenLine size={14} /> Assinar</button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        {assinando && (
          <PadAssinatura
            titulo="Ciência da Ordem de Serviço"
            nome={assinando}
            aviso={`${assinando} declara ter recebido, lido e compreendido a Ordem de Serviço da função ${os.funcao}, comprometendo-se a cumpri-la.`}
            onClose={() => setAssinando(null)}
            onSalvar={(a) => { set({ assinaturas: [...(os.assinaturas ?? []).filter((x) => !mesma(x.nome, assinando)), { ...a, nome: assinando }] }); toast('Ciência registrada') }}
          />
        )}
      </div>

      <div className="so-impressao doc">
        <CabecalhoDoc empresa={empresa} />
        <h2>ORDEM DE SERVIÇO DE SEGURANÇA E SAÚDE NO TRABALHO</h2>
        <div className="sub-doc">NR-1, item 1.4.1 · {empresa?.nome} · CNPJ {empresa?.cnpj}</div>
        <div className="info">
          <div><b>Função:</b> {os.funcao}</div>
          <div><b>Revisão:</b> {fmtData(os.revisao)}</div>
          {alvo && <><div><b>Colaborador:</b> {alvo.nome}</div><div><b>Matrícula / setor:</b> {alvo.matricula || '—'} · {alvo.setor || '—'}</div></>}
        </div>
        {os.atividades && <><h4 className="secao-doc">Atividades</h4><p className="declaracao">{os.atividades}</p></>}
        <h4 className="secao-doc">Riscos e medidas de prevenção</h4>
        {riscos.length ? (
          <table>
            <thead><tr><th>Tipo</th><th>Perigo / fonte</th><th>Possíveis danos</th><th>Medidas de prevenção</th></tr></thead>
            <tbody>{riscos.map((r) => <tr key={r.id}><td>{r.tipo}</td><td>{r.perigo}{r.fonte ? ` – ${r.fonte}` : ''}</td><td>{r.lesoes}</td><td>{[r.medidasExistentes, r.medidasPropostas].filter(Boolean).join('; ')}</td></tr>)}</tbody>
          </table>
        ) : <p className="vazio-doc">Sem riscos registrados no inventário para esta função.</p>}
        <h4 className="secao-doc">EPIs obrigatórios</h4><p className="declaracao">{os.epis || '—'}</p>
        {cursos.length > 0 && <><h4 className="secao-doc">Treinamentos obrigatórios</h4><p className="declaracao">{cursos.join('; ')}</p></>}
        <h4 className="secao-doc">Obrigações</h4><p className="declaracao">{os.obrigacoes}</p>
        <h4 className="secao-doc">Proibições</h4><p className="declaracao">{os.proibicoes}</p>
        <h4 className="secao-doc">Emergência e acidentes</h4><p className="declaracao">{os.emergencia}</p>
        <p className="declaracao">Declaro ter recebido, lido e compreendido esta Ordem de Serviço e estou ciente de que o descumprimento das normas de segurança constitui ato faltoso (CLT, art. 158).</p>
        {alvo ? (
          <div className="assinaturas">
            <BlocoAssinatura imagem={assinaturaDe(alvo.nome)?.imagem}>{alvo.nome}<br />Colaborador{assinaturaDe(alvo.nome) ? ` · ${quandoAssinou(assinaturaDe(alvo.nome)!)}` : ''}</BlocoAssinatura>
            <BlocoAssinatura imagem={d.config.assinatura}>{d.config.tecnico}<br />Técnico(a) de Segurança do Trabalho</BlocoAssinatura>
          </div>
        ) : (
          <>
            <table>
              <thead><tr><th style={{ width: '40%' }}>Colaborador</th><th>Assinatura</th><th style={{ width: 120 }}>Data/hora</th></tr></thead>
              <tbody>
                {colabs.map((c) => { const a = assinaturaDe(c.nome); return <tr key={c.id}><td style={{ height: 30 }}>{c.nome}</td><td>{a && <img src={a.imagem} alt="" style={{ maxHeight: 32, maxWidth: 200 }} />}</td><td>{a ? quandoAssinou(a) : ''}</td></tr> })}
              </tbody>
            </table>
            <div className="assinaturas"><BlocoAssinatura imagem={d.config.assinatura}>{d.config.tecnico}<br />Técnico(a) de Segurança do Trabalho</BlocoAssinatura><div>{empresa?.responsavel || 'Responsável pela empresa'}<br />Empregador</div></div>
          </>
        )}
      </div>
    </>
  )
}


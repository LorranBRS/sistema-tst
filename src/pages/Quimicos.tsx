// Inventário de produtos químicos: FDS (FISPQ), pictogramas GHS, armazenamento e incompatibilidades.
import { AlertTriangle, ArrowLeft, ExternalLink, Printer } from 'lucide-react'
import { BlocoAssinatura } from '../components/Assinatura'
import { CrudPage, type CrudConfig } from '../components/CrudPage'
import { CabecalhoDoc, Link, PageHead } from '../components/ui'
import { INCOMPATIVEIS, PICTOGRAMAS_GHS, rotuloGhs } from '../lib/catalogos'
import { daEmpresaAtiva, nomes, useDB } from '../lib/store'
import type { Quimico } from '../lib/types'
import { diasAte, fmtData, hoje, normalizar } from '../lib/utils'

const cods = (q: Pick<Quimico, 'ghs'>) => (q.ghs ?? []).map((g) => g.slice(0, 5))
const fdsAntiga = (q: Quimico) => !!q.dataFds && diasAte(q.dataFds) < -5 * 365

export function Pictograma({ cod, tam = 30 }: { cod: string; tam?: number }) {
  const p = PICTOGRAMAS_GHS.find((x) => x.cod === cod)
  if (!p) return null
  return (
    <svg width={tam} height={tam} viewBox="0 0 40 40" role="img" aria-label={`${p.cod} ${p.nome}`} className="ghs">
      <title>{`${p.cod} – ${p.nome}`}</title>
      <rect x="7" y="7" width="26" height="26" transform="rotate(45 20 20)" fill="#fff" stroke="#d00" strokeWidth="3.2" />
      <text x="20" y="25" textAnchor="middle" fontSize="14">{p.simbolo}</text>
    </svg>
  )
}

/** Pares incompatíveis guardados no mesmo local. */
export function conflitos(lista: Quimico[]) {
  const out: { local: string; a: Quimico; b: Quimico; motivo: string }[] = []
  for (let i = 0; i < lista.length; i++)
    for (let j = i + 1; j < lista.length; j++) {
      const a = lista[i], b = lista[j]
      if (a.empresaId !== b.empresaId || !a.local || normalizar(a.local.trim()) !== normalizar(b.local.trim())) continue
      for (const [x, y, motivo] of INCOMPATIVEIS)
        if ((cods(a).includes(x) && cods(b).includes(y)) || (cods(a).includes(y) && cods(b).includes(x))) { out.push({ local: a.local, a, b, motivo }); break }
    }
  return out
}

const cfg: CrudConfig = {
  colecao: 'quimicos',
  titulo: 'Produtos químicos',
  sub: 'Inventário com FDS (antiga FISPQ), pictogramas GHS, EPIs e armazenamento, com alerta de produtos incompatíveis guardados juntos.',
  singular: 'Produto',
  escopo: 'empresa',
  campos: [
    { nome: 'nome', rotulo: 'Nome comercial', tipo: 'text', obrigatorio: true, full: true },
    { nome: 'empresaId', rotulo: 'Empresa', tipo: 'ref', ref: 'empresas', obrigatorio: true },
    { nome: 'fabricante', rotulo: 'Fabricante / fornecedor', tipo: 'text' },
    { nome: 'cas', rotulo: 'Nº CAS', tipo: 'text' },
    { nome: 'onu', rotulo: 'Nº ONU', tipo: 'text' },
    { nome: 'local', rotulo: 'Local de armazenamento', tipo: 'datalist', opcoes: (d) => [...new Set(d.quimicos.map((q) => q.local).filter(Boolean))], obrigatorio: true },
    { nome: 'quantidade', rotulo: 'Quantidade estocada', tipo: 'text', placeholder: '20 L, 6 cilindros...' },
    { nome: 'ghs', rotulo: 'Pictogramas GHS (seção 2 da FDS)', tipo: 'multi', opcoes: PICTOGRAMAS_GHS.map((p) => rotuloGhs(p.cod)) },
    { nome: 'dataFds', rotulo: 'Data de revisão da FDS', tipo: 'date' },
    { nome: 'linkFds', rotulo: 'Link da FDS (site do fabricante)', tipo: 'text', placeholder: 'https://...' },
    { nome: 'epis', rotulo: 'EPIs para manuseio (seção 8)', tipo: 'textarea' },
    { nome: 'armazenamento', rotulo: 'Cuidados de armazenamento (seção 7)', tipo: 'textarea' },
    { nome: 'primeirosSocorros', rotulo: 'Primeiros socorros (seção 4)', tipo: 'textarea' },
  ],
  colunas: [
    { rotulo: 'Produto', texto: (r) => `${r.nome} ${r.fabricante} ${r.cas}`, render: (r) => <div><strong>{r.nome}</strong><span className="sub">{r.fabricante}{r.cas && r.cas !== '—' ? ` · CAS ${r.cas}` : ''}{r.onu && r.onu !== '—' ? ` · ONU ${r.onu}` : ''}</span></div> },
    { rotulo: 'Perigos', texto: (r) => (r.ghs ?? []).join(', '), render: (r) => <div className="ghs-lista">{cods(r as Quimico).map((c) => <Pictograma key={c} cod={c} />)}{!(r.ghs ?? []).length && <span className="sub">Não classificado</span>}</div> },
    { rotulo: 'Local', texto: (r, d) => `${r.local} ${nomes.empresa(d, r.empresaId)}`, render: (r, d) => <div>{r.local}<span className="sub">{r.quantidade}</span>{conflitos(d.quimicos).some((c) => c.a.id === r.id || c.b.id === r.id) && <span className="badge vencido" style={{ marginTop: 3 }}><AlertTriangle size={12} /> Incompatível no local</span>}</div> },
    {
      rotulo: 'FDS',
      texto: (r) => fmtData(r.dataFds),
      render: (r) => (
        <div>
          {fmtData(r.dataFds)}
          {fdsAntiga(r as Quimico) && <span className="sub" style={{ color: 'var(--warn)' }}>Mais de 5 anos – confira se há versão nova</span>}
          {r.linkFds && <a className="sub" href={r.linkFds} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}><ExternalLink size={11} /> Abrir FDS</a>}
        </div>
      ),
      esconderMobile: true,
    },
  ],
  filtros: [
    { rotulo: 'Incompatíveis', teste: (r, d) => conflitos(d.quimicos).some((c) => c.a.id === r.id || c.b.id === r.id) },
    { rotulo: 'FDS com mais de 5 anos', teste: (r) => fdsAntiga(r as Quimico) },
    { rotulo: 'Inflamáveis', teste: (r) => cods(r as Quimico).includes('GHS02') },
    { rotulo: 'Corrosivos', teste: (r) => cods(r as Quimico).includes('GHS05') },
  ],
  padroes: () => ({ ghs: [] }),
  ordenar: (a, b) => a.local.localeCompare(b.local) || a.nome.localeCompare(b.nome),
  botoesExtras: <Link to="/app/quimicos/imprimir" className="btn"><Printer size={16} /> Imprimir inventário</Link>,
  cabecalhoExtra: <AlertaIncompativeis />,
}

function AlertaIncompativeis() {
  const d = useDB()
  const lista = conflitos(daEmpresaAtiva(d, d.quimicos))
  if (!lista.length) return null
  return (
    <div className="resultado perigo" style={{ marginBottom: 16 }}>
      <strong><AlertTriangle size={16} style={{ verticalAlign: -3 }} /> {lista.length} combinação(ões) incompatível(is) no mesmo local</strong>
      <ul style={{ margin: '6px 0 0', paddingLeft: 20, fontSize: 14 }}>
        {lista.map((c, i) => <li key={i}><b>{c.local}:</b> {c.a.nome} × {c.b.nome} — {c.motivo}</li>)}
      </ul>
      <div className="nota" style={{ marginTop: 6 }}>Alerta simplificado pelos pictogramas. Confirme nas seções 7 e 10 das FDS e separe os produtos (distância, barreira ou outro local).</div>
    </div>
  )
}

export default function Quimicos() {
  return <CrudPage cfg={cfg} />
}

export function ImprimirQuimicos() {
  const d = useDB()
  const empresa = d.empresas.find((e) => e.id === d.config.empresaAtiva)
  const lista = [...daEmpresaAtiva(d, d.quimicos)].sort((a, b) => a.local.localeCompare(b.local) || a.nome.localeCompare(b.nome))
  const confl = conflitos(lista)
  return (
    <>
      <div className="nao-imprimir" style={{ marginBottom: 10 }}>
        <Link to="/app/quimicos"><ArrowLeft size={14} style={{ verticalAlign: -2 }} /> Produtos químicos</Link>
      </div>
      <div className="nao-imprimir">
        <PageHead titulo="Imprimir inventário de produtos químicos" sub={empresa ? empresa.nome : 'Todas as empresas — escolha uma empresa no topo para imprimir só a dela'}>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Imprimir / PDF</button>
        </PageHead>
      </div>
      <div className="doc">
        <CabecalhoDoc empresa={empresa} />
        <h2>INVENTÁRIO DE PRODUTOS QUÍMICOS</h2>
        <div className="sub-doc">{empresa?.nome ?? 'Todas as empresas'} · {fmtData(hoje())}</div>
        <table>
          <thead><tr><th>Produto</th><th>CAS / ONU</th><th>Perigos (GHS)</th><th>Local / qtd.</th><th>EPIs</th><th>FDS</th></tr></thead>
          <tbody>
            {lista.map((q) => (
              <tr key={q.id}>
                <td><b>{q.nome}</b><br />{q.fabricante}</td>
                <td>{q.cas}<br />{q.onu}</td>
                <td><div className="ghs-lista">{cods(q).map((c) => <Pictograma key={c} cod={c} tam={24} />)}</div>{(q.ghs ?? []).map((g) => g.slice(8)).join(', ')}</td>
                <td>{q.local}<br />{q.quantidade}</td>
                <td>{q.epis}</td>
                <td>{fmtData(q.dataFds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {confl.length > 0 && (
          <>
            <h4 className="secao-doc">Incompatibilidades a corrigir</h4>
            <ul className="declaracao">{confl.map((c, i) => <li key={i}>{c.local}: {c.a.nome} × {c.b.nome} — {c.motivo}</li>)}</ul>
          </>
        )}
        <div className="assinaturas">
          <BlocoAssinatura imagem={d.config.assinatura}>{d.config.tecnico}<br />Técnico(a) de Segurança do Trabalho</BlocoAssinatura>
          <div>{empresa?.responsavel || 'Responsável pela empresa'}<br />Ciente</div>
        </div>
      </div>
    </>
  )
}

import { useState } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { Link, PageHead } from '../components/ui'
import { NRS, NRS_URL } from '../lib/catalogos'
import { normalizar } from '../lib/utils'

export default function Nrs() {
  const [q, setQ] = useState('')
  const lista = NRS.filter((n) => !q || normalizar(`nr-${n.n} nr ${n.n} ${n.titulo}`).includes(normalizar(q)))
  return (
    <>
      <PageHead titulo="Normas Regulamentadoras" sub="Consulta rápida das NRs e atalho para o texto oficial atualizado no portal do Ministério do Trabalho e Emprego.">
        <a className="btn" href={NRS_URL} target="_blank" rel="noreferrer">
          <ExternalLink size={16} /> NRs vigentes (gov.br)
        </a>
      </PageHead>
      <div className="card">
        <div className="toolbar">
          <div className="search">
            <Search size={16} />
            <input className="input" placeholder="Buscar por número ou assunto..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <ul className="lista">
          {lista.map((n) => (
            <li key={n.n}>
              <span className="badge info" style={{ minWidth: 58, justifyContent: 'center' }}>
                NR-{String(n.n).padStart(2, '0')}
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="titulo" style={{ textDecoration: n.revogada ? 'line-through' : undefined }}>
                  {n.titulo}
                </div>
                {n.revogada && <div className="sub">Revogada</div>}
              </div>
              <div className="dir">{n.modulo && <Link to={n.modulo.rota} className="btn btn-sm">{n.modulo.nome}</Link>}</div>
            </li>
          ))}
        </ul>
      </div>
      <p className="nota">As normas são atualizadas periodicamente. Sempre confira a redação vigente no portal oficial antes de emitir documentos.</p>
    </>
  )
}

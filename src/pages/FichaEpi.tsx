import { ArrowLeft, Printer } from 'lucide-react'
import { Link, PageHead, Vazio } from '../components/ui'
import { useDB } from '../lib/store'
import { fmtData } from '../lib/utils'

export default function FichaEpi({ id }: { id: string }) {
  const d = useDB()
  const c = d.colaboradores.find((x) => x.id === id)
  if (!c) return <Vazio texto="Colaborador não encontrado."><Link to="/app/colaboradores">Voltar</Link></Vazio>
  const e = d.empresas.find((x) => x.id === c.empresaId)
  const entregas = d.entregas.filter((x) => x.colaboradorId === id).sort((a, b) => a.data.localeCompare(b.data))
  const linhasVazias = Math.max(0, 8 - entregas.length)

  return (
    <>
      <div className="nao-imprimir" style={{ marginBottom: 10 }}>
        <Link to="/app/colaboradores">
          <ArrowLeft size={14} style={{ verticalAlign: -2 }} /> Colaboradores
        </Link>
      </div>
      <PageHead titulo="Ficha de controle de EPI" sub={`${c.nome} · ${entregas.length} entrega(s) registrada(s)`}>
        <Link to="/app/entregas" className="btn">Registrar entrega</Link>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={16} /> Imprimir / PDF
        </button>
      </PageHead>

      <div className="doc">
        <h2>FICHA DE CONTROLE DE ENTREGA DE EPI</h2>
        <div className="sub-doc">Conforme NR-6 – Equipamentos de Proteção Individual</div>
        <div className="info">
          <div><b>Empresa:</b> {e?.nome ?? '—'}</div>
          <div><b>CNPJ:</b> {e?.cnpj ?? '—'}</div>
          <div><b>Colaborador:</b> {c.nome}</div>
          <div><b>Matrícula:</b> {c.matricula || '—'}</div>
          <div><b>Função:</b> {c.funcao}</div>
          <div><b>Setor:</b> {c.setor || '—'}</div>
          <div><b>Admissão:</b> {fmtData(c.admissao)}</div>
        </div>
        <p className="declaracao">
          Declaro ter recebido gratuitamente os Equipamentos de Proteção Individual abaixo relacionados, bem como o treinamento sobre seu uso
          correto, guarda e conservação. Comprometo-me a usá-los apenas para a finalidade a que se destinam, responsabilizar-me por sua guarda e
          conservação, comunicar qualquer alteração que os torne impróprios para uso e devolvê-los quando solicitado ou no desligamento. Estou
          ciente de que a recusa injustificada ao uso do EPI constitui ato faltoso, nos termos da legislação trabalhista.
        </p>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Qtd</th>
              <th>Descrição do EPI</th>
              <th>Nº CA</th>
              <th>Motivo</th>
              <th>Devolução</th>
              <th style={{ width: '22%' }}>Assinatura do colaborador</th>
            </tr>
          </thead>
          <tbody>
            {entregas.map((x) => {
              const epi = d.epis.find((p) => p.id === x.epiId)
              return (
                <tr key={x.id}>
                  <td>{fmtData(x.data)}</td>
                  <td>{x.quantidade}</td>
                  <td>{epi?.nome ?? '—'}</td>
                  <td>{epi?.ca ?? '—'}</td>
                  <td>{x.motivo}</td>
                  <td />
                  <td />
                </tr>
              )
            })}
            {Array.from({ length: linhasVazias }, (_, i) => (
              <tr key={'v' + i}>
                <td style={{ height: 28 }} />
                <td /><td /><td /><td /><td /><td />
              </tr>
            ))}
          </tbody>
        </table>
        <div className="assinaturas">
          <div>{c.nome}<br />Colaborador</div>
          <div>{d.config.tecnico}{d.config.registro ? ` – ${d.config.registro}` : ''}<br />Técnico(a) de Segurança do Trabalho</div>
        </div>
      </div>
    </>
  )
}

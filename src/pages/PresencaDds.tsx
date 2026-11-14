// Lista de presença do DDS com assinatura de cada participante na tela.
import { ArrowLeft, Printer } from 'lucide-react'
import { BlocoAssinatura, ColetaAssinaturas, TabelaAssinaturas } from '../components/Assinatura'
import { CabecalhoDoc, Link, PageHead, Vazio } from '../components/ui'
import { TEMAS_DDS } from '../lib/catalogos'
import { db, useDB } from '../lib/store'
import { fmtData } from '../lib/utils'

export default function PresencaDds({ id }: { id: string }) {
  const d = useDB()
  const dds = d.dds.find((x) => x.id === id)
  if (!dds) return <Vazio texto="DDS não encontrado."><Link to="/app/dds">Voltar</Link></Vazio>
  const empresa = d.empresas.find((e) => e.id === dds.empresaId)
  const texto = TEMAS_DDS.find((t) => t.tema === dds.tema)?.texto
  const presentes = dds.presencas ?? []
  const colabs = d.colaboradores.filter((c) => c.empresaId === dds.empresaId && c.status === 'Ativo').map((c) => c.nome)

  return (
    <>
      <div className="nao-imprimir" style={{ marginBottom: 10 }}>
        <Link to="/app/dds"><ArrowLeft size={14} style={{ verticalAlign: -2 }} /> DDS</Link>
      </div>
      <div className="nao-imprimir">
        <PageHead titulo={`Lista de presença · ${dds.tema}`} sub={`${empresa?.nome ?? '—'} · ${fmtData(dds.data)} · conduzido por ${dds.responsavel}`}>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Imprimir / PDF</button>
        </PageHead>
        {texto && (
          <div className="card card-pad">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Conteúdo do tema</div>
            <p style={{ margin: '4px 0 0' }}>{texto}</p>
          </div>
        )}
        <ColetaAssinaturas
          titulo="Participantes"
          ajuda="Passe o celular para cada participante assinar. O número de participantes do DDS é atualizado automaticamente."
          assinaturas={presentes}
          sugestoes={colabs}
          onChange={(l) => db.atualizar('dds', dds.id, { presencas: l, participantes: l.length || dds.participantes })}
        />
      </div>

      <div className="so-impressao doc">
        <CabecalhoDoc empresa={empresa} />
        <h2>LISTA DE PRESENÇA – DIÁLOGO DIÁRIO DE SEGURANÇA</h2>
        <div className="sub-doc">{empresa?.nome} · CNPJ {empresa?.cnpj}</div>
        <div className="info">
          <div><b>Tema:</b> {dds.tema}</div>
          <div><b>Data:</b> {fmtData(dds.data)}</div>
          <div><b>Conduzido por:</b> {dds.responsavel}</div>
          <div><b>Duração:</b> {dds.duracao} min</div>
        </div>
        {texto && <p className="declaracao"><b>Conteúdo:</b> {texto}</p>}
        {dds.observacoes && <p className="declaracao"><b>Observações:</b> {dds.observacoes}</p>}
        <TabelaAssinaturas rotulo="Participante" nomes={[]} assinaturas={presentes} minimo={Math.max(12, presentes.length)} />
        <div className="assinaturas">
          <BlocoAssinatura imagem={dds.responsavel === d.config.tecnico ? d.config.assinatura : undefined}>{dds.responsavel}<br />Responsável pelo DDS</BlocoAssinatura>
          <div>Total de participantes: {presentes.length || dds.participantes}</div>
        </div>
      </div>
    </>
  )
}

import { useRef } from 'react'
import { Download, RotateCcw, Trash2, Upload } from 'lucide-react'
import { Campo, CampoLogo, PageHead, toast } from '../components/ui'
import { CORES } from '../lib/catalogos'
import { db, useDB } from '../lib/store'
import { baixarArquivo, hoje } from '../lib/utils'

export default function Configuracoes() {
  const d = useDB()
  const c = d.config
  const arquivo = useRef<HTMLInputElement>(null)

  function importar(f: File) {
    const r = new FileReader()
    r.onload = () => {
      try {
        if (!confirm('Importar este backup vai substituir todos os dados atuais. Continuar?')) return
        db.importar(String(r.result))
        toast('Backup importado com sucesso')
      } catch (e) {
        alert('Não foi possível importar: ' + (e as Error).message)
      }
    }
    r.readAsText(f)
  }

  const total = d.empresas.length + d.colaboradores.length + d.epis.length + d.entregas.length + d.treinamentos.length + d.asos.length + d.ocorrencias.length + d.acoes.length + d.dds.length + d.inspecoes.length + d.aprs.length

  return (
    <>
      <PageHead titulo="Configurações" sub="Seu perfil, preferências e cópia de segurança dos dados." />
      <div className="grid grid-2">
        <div className="card card-pad">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Perfil do técnico</h3>
          <div className="form-grid">
            <Campo label="Nome" full>
              <input className="input" value={c.tecnico} onChange={(e) => db.configurar({ tecnico: e.target.value })} />
            </Campo>
            <Campo label="Registro profissional" ajuda="Aparece nas fichas e documentos">
              <input className="input" value={c.registro} onChange={(e) => db.configurar({ registro: e.target.value })} placeholder="Ex.: MTE 00.000/SP" />
            </Campo>
            <Campo label="Telefone">
              <input className="input" value={c.telefone} onChange={(e) => db.configurar({ telefone: e.target.value })} />
            </Campo>
            <Campo label="E-mail" full>
              <input className="input" type="email" value={c.email} onChange={(e) => db.configurar({ email: e.target.value })} />
            </Campo>
            <Campo label="Seu logo (técnico / consultoria)" full ajuda="Sai no canto direito dos documentos impressos; o logo de cada empresa é cadastrado em Empresas">
              <CampoLogo valor={c.logo} onChange={(v) => db.configurar({ logo: v })} />
            </Campo>
          </div>
          <h3 style={{ fontSize: 15, margin: '22px 0 10px' }}>Cor do sistema</h3>
          <div className="swatches" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', marginBottom: 6 }}>
            {CORES.map((cor) => (
              <button key={cor.id} className={'swatch' + ((c.corPrimaria || 'verde') === cor.id ? ' ativo' : '')} aria-pressed={(c.corPrimaria || 'verde') === cor.id} onClick={() => db.configurar({ corPrimaria: cor.id })}>
                <span className="bola" style={{ background: cor.claro[0] }} />
                {cor.nome}
              </button>
            ))}
          </div>
          <h3 style={{ fontSize: 15, margin: '22px 0 14px' }}>Preferências</h3>
          <div className="form-grid">
            <Campo label="Alertar vencimentos com antecedência de" ajuda="Treinamentos, ASOs e CAs">
              <select className="input" value={c.alertaDias} onChange={(e) => db.configurar({ alertaDias: Number(e.target.value) })}>
                {[15, 30, 45, 60, 90].map((n) => (
                  <option key={n} value={n}>
                    {n} dias
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Tema">
              <select className="input" value={c.tema} onChange={(e) => db.configurar({ tema: e.target.value as 'auto' })}>
                <option value="auto">Automático (sistema)</option>
                <option value="claro">Claro</option>
                <option value="escuro">Escuro</option>
              </select>
            </Campo>
          </div>
        </div>

        <div className="card card-pad" style={{ alignSelf: 'start' }}>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>Seus dados</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 0 }}>
            Nesta versão os dados ficam salvos <b>somente neste navegador</b> ({total} registros). Faça backups regularmente para não perder
            informações ou para levar os dados a outro computador.
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            <button className="btn" onClick={() => { baixarArquivo(`sistema-tst-backup-${hoje()}.json`, db.exportar(), 'application/json'); toast('Backup gerado') }}>
              <Download size={16} /> Baixar backup (.json)
            </button>
            <button className="btn" onClick={() => arquivo.current?.click()}>
              <Upload size={16} /> Importar backup
            </button>
            <input ref={arquivo} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importar(f); e.target.value = '' }} />
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', width: '100%', margin: '6px 0' }} />
            <button className="btn" onClick={() => { if (confirm('Substituir todos os dados atuais pelos dados de demonstração?')) { db.restaurarDemo(); toast('Dados de demonstração restaurados') } }}>
              <RotateCcw size={16} /> Restaurar dados de demonstração
            </button>
            <button className="btn btn-danger" onClick={() => { if (confirm('Apagar TODOS os registros deste navegador? Essa ação não pode ser desfeita. Recomendamos baixar um backup antes.')) { db.apagarTudo(); toast('Todos os registros foram apagados') } }}>
              <Trash2 size={16} /> Começar do zero (apagar tudo)
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

import { useRef } from 'react'
import { Download, RotateCcw, Smartphone, Trash2, Upload } from 'lucide-react'
import { ehIOS, instalar, jaInstalado, useConviteInstalar } from '../lib/instalar'
import { Campo, CampoLogo, PageHead, toast } from '../components/ui'
import { PadAssinatura } from '../components/Assinatura'
import { useState } from 'react'
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
            <Campo label="Sua assinatura" full ajuda="Sai acima do seu nome nas fichas de EPI, relatórios, investigações e nas APRs, PTs e DDS em que você é o responsável">
              <AssinaturaTecnico valor={c.assinatura} nome={c.tecnico} />
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

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
        <InstalarApp />
        <div className="card card-pad">
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
      </div>
    </>
  )
}

function InstalarApp() {
  const convite = useConviteInstalar()
  const instalado = jaInstalado()
  return (
    <div className="card card-pad">
      <h3 style={{ fontSize: 15, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}><Smartphone size={17} /> Aplicativo no celular</h3>
      {instalado ? (
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Você está usando o app instalado. Ele abre mesmo sem internet.</p>
      ) : (
        <>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 0 }}>
            Instale o Sistema TST na tela inicial do celular ou do computador. Ele abre como um aplicativo e <b>funciona sem internet</b> (útil em obra e em áreas sem sinal).
          </p>
          {convite ? (
            <button className="btn btn-primary" onClick={() => instalar()}><Download size={16} /> Instalar agora</button>
          ) : ehIOS() ? (
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, display: 'grid', gap: 4 }}>
              <li>Abra este site no <b>Safari</b>.</li>
              <li>Toque em <b>Compartilhar</b> (quadrado com seta para cima).</li>
              <li>Escolha <b>Adicionar à Tela de Início</b>.</li>
            </ol>
          ) : (
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, display: 'grid', gap: 4 }}>
              <li>Abra este site no <b>Chrome</b> (Android ou computador) ou no <b>Edge</b>.</li>
              <li>Toque no menu <b>⋮</b> e escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li>
            </ol>
          )}
          <p className="nota">Os dados continuam salvos só neste aparelho. Para levar a outro, use o backup abaixo.</p>
        </>
      )}
    </div>
  )
}

function AssinaturaTecnico({ valor, nome }: { valor?: string; nome: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ width: 160, height: 60, border: '1px dashed var(--border)', borderRadius: 9, display: 'grid', placeItems: 'center', background: '#fff', overflow: 'hidden' }}>
        {valor ? <img src={valor} alt="Sua assinatura" style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <span style={{ fontSize: 12, color: '#888' }}>Sem assinatura</span>}
      </div>
      <button type="button" className="btn btn-sm" onClick={() => setAberto(true)}>{valor ? 'Refazer' : 'Assinar'}</button>
      {valor && <button type="button" className="btn btn-sm btn-danger" onClick={() => db.configurar({ assinatura: '' })}>Remover</button>}
      {aberto && (
        <PadAssinatura titulo="Sua assinatura" nome={nome} onClose={() => setAberto(false)} onSalvar={(a) => { db.configurar({ assinatura: a.imagem }); toast('Assinatura salva') }} />
      )}
    </div>
  )
}

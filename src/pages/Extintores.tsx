// Controle de extintores: recarga, teste hidrostático e inspeção mensal (NR-23 / NBR 12962).
import { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { CrudPage, type CrudConfig, type Reg } from '../components/CrudPage'
import { Campo, Modal, Validade, toast } from '../components/ui'
import { ITENS_INSPECAO_EXTINTOR, TIPOS_EXTINTOR } from '../lib/catalogos'
import { db, nomes, useDB } from '../lib/store'
import type { DB, Extintor } from '../lib/types'
import { addDias, addMeses, diasAte, fmtData, hoje, situacao } from '../lib/utils'

/** Inspeção mensal atrasada: mais de 30 dias desde a última. */
export const inspecaoAtrasada = (e: Pick<Extintor, 'ultimaInspecao' | 'status'>) =>
  e.status === 'Em uso' && (!e.ultimaInspecao || diasAte(e.ultimaInspecao) < -30)

const alerta = (d: DB) => d.config.alertaDias

const cfg: CrudConfig = {
  colecao: 'extintores',
  titulo: 'Extintores',
  sub: 'Controle de recarga (anual), teste hidrostático (5 anos) e inspeção mensal de cada extintor. Prazos sugeridos — siga a NBR 12962 e o plano da empresa.',
  singular: 'Extintor',
  escopo: 'empresa',
  campos: [
    { nome: 'numero', rotulo: 'Identificação / nº', tipo: 'text', obrigatorio: true, placeholder: 'EXT-01' },
    { nome: 'empresaId', rotulo: 'Empresa', tipo: 'ref', ref: 'empresas', obrigatorio: true },
    { nome: 'tipo', rotulo: 'Agente extintor', tipo: 'select', opcoes: TIPOS_EXTINTOR, obrigatorio: true },
    { nome: 'capacidade', rotulo: 'Capacidade', tipo: 'text', placeholder: '6 kg, 10 L...' },
    { nome: 'local', rotulo: 'Localização', tipo: 'text', obrigatorio: true, full: true },
    { nome: 'ultimaRecarga', rotulo: 'Última recarga / manutenção', tipo: 'date' },
    { nome: 'proximaRecarga', rotulo: 'Próxima recarga', tipo: 'date', ajuda: 'Calculada: +12 meses' },
    { nome: 'ultimoTeste', rotulo: 'Último teste hidrostático', tipo: 'date' },
    { nome: 'proximoTeste', rotulo: 'Próximo teste hidrostático', tipo: 'date', ajuda: 'Calculado: +5 anos' },
    { nome: 'status', rotulo: 'Situação', tipo: 'select', opcoes: ['Em uso', 'Em manutenção', 'Baixado'], obrigatorio: true },
    { nome: 'ultimaInspecao', rotulo: 'Última inspeção mensal', tipo: 'date' },
    { nome: 'observacoes', rotulo: 'Observações', tipo: 'textarea' },
  ],
  padroes: () => ({ status: 'Em uso', tipo: 'Pó químico ABC' }),
  derivar: (v, campo) => {
    if (campo === 'ultimaRecarga' && v.ultimaRecarga) return { proximaRecarga: addMeses(v.ultimaRecarga, 12) }
    if (campo === 'ultimoTeste' && v.ultimoTeste) return { proximoTeste: addMeses(v.ultimoTeste, 60) }
    return {}
  },
  colunas: [
    { rotulo: 'Extintor', texto: (r) => `${r.numero} ${r.tipo}`, render: (r) => <div><strong>{r.numero}</strong><span className="sub">{r.tipo} · {r.capacidade}</span></div> },
    { rotulo: 'Local', texto: (r, d) => `${r.local} ${nomes.empresa(d, r.empresaId)}`, render: (r, d) => <div>{r.local}<span className="sub">{nomes.empresa(d, r.empresaId)}</span></div> },
    { rotulo: 'Recarga', texto: (r) => fmtData(r.proximaRecarga), render: (r, d) => <Validade iso={r.proximaRecarga} alerta={alerta(d)} /> },
    { rotulo: 'Teste hidrostático', texto: (r) => fmtData(r.proximoTeste), render: (r, d) => <Validade iso={r.proximoTeste} alerta={alerta(d)} />, esconderMobile: true },
    {
      rotulo: 'Inspeção mensal',
      texto: (r) => fmtData(r.ultimaInspecao),
      render: (r) => (
        <div>
          {fmtData(r.ultimaInspecao)}
          {r.status !== 'Em uso' ? <span className="sub">{r.status}</span> : inspecaoAtrasada(r as Extintor) ? <span className="sub" style={{ color: 'var(--danger)' }}>Atrasada</span> : <span className="sub">Em dia</span>}
        </div>
      ),
    },
  ],
  filtros: [
    { rotulo: 'Recarga vencida', teste: (r, d) => situacao(r.proximaRecarga, alerta(d)) === 'vencido' },
    { rotulo: 'Recarga a vencer', teste: (r, d) => situacao(r.proximaRecarga, alerta(d)) === 'avencer' },
    { rotulo: 'Teste vencido', teste: (r) => situacao(r.proximoTeste) === 'vencido' },
    { rotulo: 'Inspeção atrasada', teste: (r) => inspecaoAtrasada(r as Extintor) },
  ],
  ordenar: (a, b) => a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true }),
  acoesExtras: (r) => <BotaoInspecao r={r} />,
}

export default function Extintores() {
  return <CrudPage cfg={cfg} />
}

function BotaoInspecao({ r }: { r: Reg }) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button className="btn btn-sm" onClick={() => setAberto(true)} title="Registrar inspeção mensal">
        <ClipboardCheck size={14} /> Inspecionar
      </button>
      {aberto && <InspecaoMensal ext={r as Extintor} onClose={() => setAberto(false)} />}
    </>
  )
}

function InspecaoMensal({ ext, onClose }: { ext: Extintor; onClose: () => void }) {
  const d = useDB()
  const [nc, setNc] = useState<string[]>([])
  const [obs, setObs] = useState('')
  const [data, setData] = useState(hoje())

  function salvar() {
    const insp = { data, ok: nc.length === 0, itensNc: nc, obs, responsavel: d.config.tecnico }
    db.atualizar('extintores', ext.id, { ultimaInspecao: data, inspecoes: [insp, ...(ext.inspecoes ?? [])].slice(0, 36) })
    for (const item of nc) {
      db.adicionar('acoes', {
        empresaId: ext.empresaId,
        oque: `Extintor ${ext.numero}: corrigir "${item}"`,
        porque: obs || 'Não conformidade na inspeção mensal do extintor',
        onde: ext.local,
        quem: '',
        quando: addDias(hoje(), 7),
        como: '',
        quanto: '',
        prioridade: 'Alta',
        status: 'Aberta',
        origem: `Inspeção de extintor (${fmtData(data)})`,
      })
    }
    toast(nc.length ? `Inspeção registrada e ${nc.length} ação(ões) criada(s)` : 'Inspeção registrada: tudo conforme')
    onClose()
  }

  return (
    <Modal
      titulo={`Inspeção mensal · ${ext.numero}`}
      onClose={onClose}
      rodape={
        <>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar}>Registrar inspeção</button>
        </>
      }
    >
      <p style={{ marginTop: 0, color: 'var(--muted)', fontSize: 14 }}>{ext.tipo} · {ext.capacidade} · {ext.local}. Desmarque o que <b>não</b> estiver conforme.</p>
      <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
        {ITENS_INSPECAO_EXTINTOR.map((item) => {
          const ok = !nc.includes(item)
          return (
            <label key={item} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 9, cursor: 'pointer', background: ok ? undefined : 'var(--danger-soft)' }}>
              <input type="checkbox" checked={ok} onChange={() => setNc(ok ? [...nc, item] : nc.filter((x) => x !== item))} style={{ width: 18, height: 18 }} />
              <span style={{ flex: 1 }}>{item}</span>
              <span className={'badge ' + (ok ? 'ok' : 'vencido')}>{ok ? 'Conforme' : 'Não conforme'}</span>
            </label>
          )
        })}
      </div>
      <div className="form-grid">
        <Campo label="Data"><input className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} /></Campo>
        <Campo label="Observações" full><textarea className="input" style={{ minHeight: 60 }} value={obs} onChange={(e) => setObs(e.target.value)} /></Campo>
      </div>
      {nc.length > 0 && <p className="nota">Cada item não conforme vira uma ação de prioridade alta no plano de ação (prazo de 7 dias).</p>}
      {ext.inspecoes && ext.inspecoes.length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>Histórico ({ext.inspecoes.length})</summary>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
            {ext.inspecoes.map((i, k) => <li key={k}>{fmtData(i.data)} – {i.ok ? 'Conforme' : `Não conforme: ${i.itensNc.join('; ')}`}{i.obs ? ` (${i.obs})` : ''}</li>)}
          </ul>
        </details>
      )}
    </Modal>
  )
}

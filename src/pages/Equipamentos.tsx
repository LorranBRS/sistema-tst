// Controle de equipamentos de segurança: cintos, talabartes, escadas, detectores, instrumentos...
import { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { CrudPage, type CrudConfig, type Reg } from '../components/CrudPage'
import { BadgeStatus, Campo, Modal, Validade, toast } from '../components/ui'
import { TIPOS_EQUIPAMENTO } from '../lib/catalogos'
import { db, nomes, useDB } from '../lib/store'
import type { DB, Equipamento } from '../lib/types'
import { addDias, fmtData, hoje, situacao } from '../lib/utils'

const alerta = (d: DB) => d.config.alertaDias
/** Situação geral: o pior entre inspeção, calibração e vida útil. */
export function pendenciaEquip(e: Equipamento, alertaDias = 30) {
  if (e.status !== 'Em uso') return null
  const s = [situacao(e.proximaInspecao, 3), situacao(e.proximaCalibracao, alertaDias), situacao(e.fimVidaUtil, alertaDias)]
  return s.includes('vencido') ? 'vencido' : s.includes('avencer') ? 'avencer' : null
}

const cfg: CrudConfig = {
  colecao: 'equipamentos',
  titulo: 'Equipamentos de segurança',
  sub: 'Cintos, talabartes, escadas, detectores de gases e instrumentos de medição: inspeção periódica, calibração, vida útil e laudos.',
  singular: 'Equipamento',
  escopo: 'empresa',
  campos: [
    { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: TIPOS_EQUIPAMENTO.map((t) => t.tipo), obrigatorio: true },
    { nome: 'empresaId', rotulo: 'Empresa', tipo: 'ref', ref: 'empresas', obrigatorio: true },
    { nome: 'descricao', rotulo: 'Descrição / modelo', tipo: 'text', full: true },
    { nome: 'numeroSerie', rotulo: 'Nº de série / identificação', tipo: 'text', obrigatorio: true },
    { nome: 'fabricante', rotulo: 'Fabricante', tipo: 'text' },
    { nome: 'local', rotulo: 'Local / responsável', tipo: 'text', full: true },
    { nome: 'ultimaInspecao', rotulo: 'Última inspeção', tipo: 'date' },
    { nome: 'periodicidadeDias', rotulo: 'Inspecionar a cada (dias)', tipo: 'number', ajuda: 'Sugestão pelo tipo; ajuste ao manual do fabricante' },
    { nome: 'proximaInspecao', rotulo: 'Próxima inspeção', tipo: 'date' },
    { nome: 'proximaCalibracao', rotulo: 'Próxima calibração', tipo: 'date', ajuda: 'Para instrumentos de medição' },
    { nome: 'fimVidaUtil', rotulo: 'Fim da vida útil', tipo: 'date', ajuda: 'Conforme fabricante (ex.: cintos e talabartes)' },
    { nome: 'laudo', rotulo: 'Laudo / certificado', tipo: 'text' },
    { nome: 'status', rotulo: 'Situação', tipo: 'select', opcoes: ['Em uso', 'Bloqueado', 'Em manutenção', 'Descartado'], obrigatorio: true },
  ],
  padroes: () => ({ status: 'Em uso', tipo: TIPOS_EQUIPAMENTO[0].tipo, periodicidadeDias: TIPOS_EQUIPAMENTO[0].dias, ultimaInspecao: hoje(), proximaInspecao: addDias(hoje(), TIPOS_EQUIPAMENTO[0].dias) }),
  derivar: (v, campo) => {
    if (campo === 'tipo') {
      const t = TIPOS_EQUIPAMENTO.find((x) => x.tipo === v.tipo)
      return t ? { periodicidadeDias: t.dias, proximaInspecao: v.ultimaInspecao ? addDias(v.ultimaInspecao, t.dias) : v.proximaInspecao } : {}
    }
    if ((campo === 'ultimaInspecao' || campo === 'periodicidadeDias') && v.ultimaInspecao && Number(v.periodicidadeDias) > 0)
      return { proximaInspecao: addDias(v.ultimaInspecao, Number(v.periodicidadeDias)) }
    return {}
  },
  colunas: [
    { rotulo: 'Equipamento', texto: (r) => `${r.tipo} ${r.numeroSerie} ${r.descricao}`, render: (r) => <div><strong>{r.tipo}</strong><span className="sub">{r.numeroSerie} · {r.descricao}</span></div> },
    { rotulo: 'Local', texto: (r, d) => `${r.local} ${nomes.empresa(d, r.empresaId)}`, render: (r, d) => <div>{r.local || '—'}<span className="sub">{nomes.empresa(d, r.empresaId)}</span></div>, esconderMobile: true },
    { rotulo: 'Próxima inspeção', texto: (r) => fmtData(r.proximaInspecao), render: (r) => (r.status === 'Em uso' ? <Validade iso={r.proximaInspecao} alerta={3} /> : '—') },
    {
      rotulo: 'Calibração / vida útil',
      texto: (r) => `${fmtData(r.proximaCalibracao)} ${fmtData(r.fimVidaUtil)}`,
      render: (r, d) => (
        <div style={{ display: 'grid', gap: 4 }}>
          {r.proximaCalibracao && <div><span className="sub">Calibração</span><Validade iso={r.proximaCalibracao} alerta={alerta(d)} /></div>}
          {r.fimVidaUtil && <div><span className="sub">Vida útil</span><Validade iso={r.fimVidaUtil} alerta={alerta(d)} /></div>}
          {!r.proximaCalibracao && !r.fimVidaUtil && '—'}
        </div>
      ),
      esconderMobile: true,
    },
    { rotulo: 'Situação', texto: (r) => r.status, render: (r) => <BadgeStatus valor={r.status === 'Em uso' ? 'Ativo' : r.status === 'Bloqueado' ? 'Inapto' : 'Desligado'} /> },
  ],
  filtros: [
    { rotulo: 'Inspeção vencida', teste: (r) => r.status === 'Em uso' && situacao(r.proximaInspecao, 3) === 'vencido' },
    { rotulo: 'Calibração/vida útil vencendo', teste: (r, d) => r.status === 'Em uso' && [situacao(r.proximaCalibracao, alerta(d)), situacao(r.fimVidaUtil, alerta(d))].some((s) => s === 'vencido' || s === 'avencer') },
    { rotulo: 'Bloqueados', teste: (r) => r.status === 'Bloqueado' },
  ],
  ordenar: (a, b) => a.tipo.localeCompare(b.tipo) || a.numeroSerie.localeCompare(b.numeroSerie, 'pt-BR', { numeric: true }),
  acoesExtras: (r) => <BotaoInspecao r={r} />,
}

export default function Equipamentos() {
  return <CrudPage cfg={cfg} />
}

function BotaoInspecao({ r }: { r: Reg }) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button className="btn btn-sm" onClick={() => setAberto(true)} disabled={r.status === 'Descartado'}>
        <ClipboardCheck size={14} /> Inspecionar
      </button>
      {aberto && <Inspecao eq={r as Equipamento} onClose={() => setAberto(false)} />}
    </>
  )
}

function Inspecao({ eq, onClose }: { eq: Equipamento; onClose: () => void }) {
  const d = useDB()
  const [aprovado, setAprovado] = useState(true)
  const [obs, setObs] = useState('')
  const [data, setData] = useState(hoje())

  function salvar() {
    if (!aprovado && !obs.trim()) return alert('Descreva o defeito encontrado.')
    db.atualizar('equipamentos', eq.id, {
      ultimaInspecao: data,
      proximaInspecao: eq.periodicidadeDias > 0 ? addDias(data, Number(eq.periodicidadeDias)) : eq.proximaInspecao,
      status: aprovado ? (eq.status === 'Bloqueado' ? 'Em uso' : eq.status) : 'Bloqueado',
      inspecoes: [{ data, aprovado, obs, responsavel: d.config.tecnico }, ...(eq.inspecoes ?? [])].slice(0, 50),
    })
    if (!aprovado) {
      db.adicionar('acoes', {
        empresaId: eq.empresaId,
        oque: `${eq.tipo} ${eq.numeroSerie}: reparar ou substituir (${obs})`,
        porque: 'Equipamento reprovado na inspeção e bloqueado para uso',
        onde: eq.local,
        quem: '',
        quando: addDias(hoje(), 7),
        como: '',
        quanto: '',
        prioridade: 'Alta',
        status: 'Aberta',
        origem: `Inspeção de equipamento (${fmtData(data)})`,
      })
    }
    toast(aprovado ? 'Inspeção registrada: aprovado' : 'Equipamento reprovado e bloqueado; ação criada')
    onClose()
  }

  return (
    <Modal titulo={`Inspeção · ${eq.tipo} ${eq.numeroSerie}`} onClose={onClose} rodape={
      <>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={salvar}>Registrar</button>
      </>
    }>
      <div className="chips" style={{ marginBottom: 14 }}>
        <button className={'chip' + (aprovado ? ' ativo' : '')} onClick={() => setAprovado(true)}>Aprovado – pode usar</button>
        <button className={'chip' + (!aprovado ? ' ativo' : '')} onClick={() => setAprovado(false)} style={!aprovado ? { background: 'var(--danger)', borderColor: 'var(--danger)' } : undefined}>Reprovado – bloquear</button>
      </div>
      <div className="form-grid">
        <Campo label="Data"><input className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} /></Campo>
        <Campo label="Próxima inspeção" ajuda={`A cada ${eq.periodicidadeDias} dia(s)`}><input className="input" readOnly value={fmtData(eq.periodicidadeDias > 0 ? addDias(data, Number(eq.periodicidadeDias)) : eq.proximaInspecao)} /></Campo>
        <Campo label={aprovado ? 'Observações' : 'Defeito encontrado *'} full><textarea className="input" style={{ minHeight: 60 }} value={obs} onChange={(e) => setObs(e.target.value)} placeholder={aprovado ? '' : 'Ex.: costura do talabarte desfiada'} /></Campo>
      </div>
      {!aprovado && <p className="nota">O equipamento fica com a situação "Bloqueado" e uma ação de prioridade alta é criada no plano de ação.</p>}
      {eq.inspecoes && eq.inspecoes.length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>Histórico ({eq.inspecoes.length})</summary>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
            {eq.inspecoes.map((i, k) => <li key={k}>{fmtData(i.data)} – {i.aprovado ? 'Aprovado' : 'Reprovado'}{i.obs ? `: ${i.obs}` : ''}</li>)}
          </ul>
        </details>
      )}
    </Modal>
  )
}

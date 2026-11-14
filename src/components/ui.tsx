import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { CheckCircle2, ImagePlus, Inbox, X } from 'lucide-react'
import { lerLogo } from '../lib/imagem'
import { useDB } from '../lib/store'
import { fmtData, situacao, textoPrazo, type Situacao } from '../lib/utils'

/* ---------- Roteador por hash (compatível com GitHub Pages) ---------- */
function assinarHash(f: () => void) {
  window.addEventListener('hashchange', f)
  return () => window.removeEventListener('hashchange', f)
}
export function useRota() {
  return useSyncExternalStore(assinarHash, () => window.location.hash.replace(/^#/, '') || '/')
}
export function navegar(rota: string) {
  window.location.hash = rota
}
export function Link({ to, children, className, onClick }: { to: string; children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <a href={'#' + to} className={className} onClick={onClick}>
      {children}
    </a>
  )
}

/* ---------- Toast ---------- */
let mostrarToast: (msg: string) => void = () => {}
export const toast = (msg: string) => mostrarToast(msg)
export function ToastHost() {
  const [msg, setMsg] = useState('')
  useEffect(() => {
    let t: number
    mostrarToast = (m) => {
      setMsg(m)
      clearTimeout(t)
      t = window.setTimeout(() => setMsg(''), 2600)
    }
    return () => clearTimeout(t)
  }, [])
  if (!msg) return null
  return (
    <div className="toast" role="status">
      <CheckCircle2 size={17} /> {msg}
    </div>
  )
}

/* ---------- Estrutura ---------- */
export function PageHead({ titulo, sub, children }: { titulo: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{titulo}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="acoes nao-imprimir">{children}</div>}
    </div>
  )
}

export function Vazio({ texto, children }: { texto: string; children?: ReactNode }) {
  return (
    <div className="vazio">
      <Inbox size={40} />
      <div>{texto}</div>
      {children && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  )
}

export function Modal({ titulo, onClose, children, rodape, largura }: { titulo: string; onClose: () => void; children: ReactNode; rodape?: ReactNode; largura?: number }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', esc)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} style={largura ? { width: `min(${largura}px, 100%)` } : undefined}>
        <div className="modal-head">
          <h2>{titulo}</h2>
          <button className="btn btn-icon" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {rodape && <div className="modal-foot">{rodape}</div>}
      </div>
    </div>
  )
}

export function Campo({ label, children, full, ajuda }: { label: string; children: ReactNode; full?: boolean; ajuda?: string }) {
  return (
    <div className={'field' + (full ? ' full' : '')}>
      <label>{label}</label>
      {children}
      {ajuda && <span className="ajuda">{ajuda}</span>}
    </div>
  )
}

/* ---------- Badges ---------- */
const ROTULO_SIT: Record<Situacao, string> = { vencido: 'Vencido', avencer: 'A vencer', ok: 'Em dia', sem: 'Sem validade' }

export function BadgeSituacao({ iso, alerta }: { iso?: string; alerta: number }) {
  const s = situacao(iso, alerta)
  return (
    <span className={'badge ' + s} title={textoPrazo(iso)}>
      {ROTULO_SIT[s]}
    </span>
  )
}

export function Validade({ iso, alerta }: { iso?: string; alerta: number }) {
  const s = situacao(iso, alerta)
  return (
    <div>
      <div>{fmtData(iso)}</div>
      {iso && <span className={'sub ' + (s === 'vencido' ? 'txt-danger' : s === 'avencer' ? 'txt-warn' : '')} style={{ color: s === 'vencido' ? 'var(--danger)' : s === 'avencer' ? 'var(--warn)' : undefined }}>{textoPrazo(iso)}</span>}
    </div>
  )
}

const CORES_STATUS: Record<string, string> = {
  Ativo: 'ok', Afastado: 'warn', Desligado: '',
  Aberta: 'info', 'Em andamento': 'warn', Concluída: 'ok',
  'Em investigação': 'warn', Rascunho: '', Aprovada: 'ok', Encerrada: '',
  Apto: 'ok', Inapto: 'danger', 'Apto com restrição': 'warn',
  Alta: 'danger', Média: 'warn', Baixa: '',
  'Com afastamento': 'danger', Fatal: 'danger', 'Sem afastamento': 'warn', 'Sem lesão': '',
}
export function BadgeStatus({ valor }: { valor: string }) {
  return <span className={'badge ' + (CORES_STATUS[valor] ?? '')}>{valor || '—'}</span>
}

export function Stat({ rotulo, valor, detalhe, icone, tom, to }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; icone: ReactNode; tom?: 'danger' | 'warn' | 'info'; to?: string }) {
  const corpo = (
    <>
      <div className="rotulo">
        <span className={'ico ' + (tom ?? '')}>{icone}</span>
        {rotulo}
      </div>
      <div className="valor">{valor}</div>
      {detalhe && <div className="detalhe">{detalhe}</div>}
    </>
  )
  return to ? (
    <a className="card stat" href={'#' + to}>
      {corpo}
    </a>
  ) : (
    <div className="card stat">{corpo}</div>
  )
}

/* ---------- Logo ---------- */
export function CampoLogo({ valor, onChange }: { valor?: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [erro, setErro] = useState('')
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ width: 120, height: 60, border: '1px dashed var(--border)', borderRadius: 9, display: 'grid', placeItems: 'center', background: '#fff', overflow: 'hidden' }}>
          {valor ? <img src={valor} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 12, color: '#888' }}>Sem logo</span>}
        </div>
        <button type="button" className="btn btn-sm" onClick={() => ref.current?.click()}><ImagePlus size={14} /> {valor ? 'Trocar' : 'Escolher imagem'}</button>
        {valor && <button type="button" className="btn btn-sm btn-danger" onClick={() => onChange('')}>Remover</button>}
      </div>
      {erro && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{erro}</div>}
      <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0]
        e.target.value = ''
        if (!f) return
        try { setErro(''); onChange(await lerLogo(f)) } catch (err) { setErro((err as Error).message) }
      }} />
    </div>
  )
}

/** Logos da empresa (esquerda) e do técnico/consultoria (direita) no topo dos documentos impressos. */
export function CabecalhoDoc({ empresa }: { empresa?: { logo?: string; nome: string } }) {
  const d = useDB()
  if (!empresa?.logo && !d.config.logo) return null
  return (
    <div className="logos-doc">
      {empresa?.logo ? <img src={empresa.logo} alt={`Logo ${empresa.nome}`} /> : <span />}
      {d.config.logo ? <img src={d.config.logo} alt="Logo do responsável técnico" /> : <span />}
    </div>
  )
}

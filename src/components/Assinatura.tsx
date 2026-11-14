// Assinatura com o dedo (celular) ou o mouse (computador), salva como imagem PNG.
import { useEffect, useRef, useState } from 'react'
import { Eraser, PenLine } from 'lucide-react'
import { Campo, Modal } from './ui'
import type { Assinatura } from '../lib/types'
import { fmtData } from '../lib/utils'

export function PadAssinatura({
  titulo,
  nome: nomeInicial = '',
  pedirNome = false,
  sugestoesNome = [],
  aviso,
  onSalvar,
  onClose,
}: {
  titulo: string
  nome?: string
  pedirNome?: boolean
  sugestoesNome?: string[]
  aviso?: string
  onSalvar: (a: Assinatura) => void
  onClose: () => void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [nome, setNome] = useState(nomeInicial)
  const [vazio, setVazio] = useState(true)
  const [erro, setErro] = useState('')
  const desenhando = useRef(false)
  const ultimo = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const c = canvas.current!
    const ajustar = () => {
      const r = c.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      c.width = r.width * dpr
      c.height = r.height * dpr
      const g = c.getContext('2d')!
      g.scale(dpr, dpr)
      g.lineCap = 'round'
      g.lineJoin = 'round'
      g.lineWidth = 2.4
      g.strokeStyle = '#111'
      setVazio(true)
    }
    ajustar()
  }, [])

  const ponto = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  function inicio(e: React.PointerEvent) {
    e.preventDefault()
    canvas.current!.setPointerCapture(e.pointerId)
    desenhando.current = true
    ultimo.current = ponto(e)
    const g = canvas.current!.getContext('2d')!
    g.beginPath()
    g.arc(ultimo.current.x, ultimo.current.y, 1.2, 0, Math.PI * 2)
    g.fillStyle = '#111'
    g.fill()
    setVazio(false)
  }
  function mover(e: React.PointerEvent) {
    if (!desenhando.current || !ultimo.current) return
    const p = ponto(e)
    const g = canvas.current!.getContext('2d')!
    g.beginPath()
    g.moveTo(ultimo.current.x, ultimo.current.y)
    g.lineTo(p.x, p.y)
    g.stroke()
    ultimo.current = p
  }
  const fim = () => {
    desenhando.current = false
    ultimo.current = null
  }
  function limpar() {
    const c = canvas.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    setVazio(true)
  }

  function salvar() {
    if (pedirNome && !nome.trim()) return setErro('Informe o nome de quem está assinando.')
    if (vazio) return setErro('Faça a assinatura no quadro.')
    onSalvar({ nome: nome.trim(), imagem: recortar(canvas.current!), em: new Date().toISOString() })
    onClose()
  }

  return (
    <Modal
      titulo={titulo}
      onClose={onClose}
      rodape={
        <>
          {erro && <span style={{ color: 'var(--danger)', fontSize: 13, marginRight: 'auto' }}>{erro}</span>}
          <button className="btn" onClick={limpar}><Eraser size={16} /> Limpar</button>
          <button className="btn btn-primary" onClick={salvar}><PenLine size={16} /> Salvar assinatura</button>
        </>
      }
    >
      {aviso && <p style={{ marginTop: 0, fontSize: 13.5, color: 'var(--muted)' }}>{aviso}</p>}
      {pedirNome ? (
        <div style={{ marginBottom: 12 }}>
          <Campo label="Nome de quem assina *">
            <input className="input" list="dl-assinantes" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
            <datalist id="dl-assinantes">{sugestoesNome.map((n) => <option key={n} value={n} />)}</datalist>
          </Campo>
        </div>
      ) : (
        nome && <p style={{ margin: '0 0 10px', fontWeight: 600 }}>{nome}</p>
      )}
      <div className="pad-assinatura">
        <canvas
          ref={canvas}
          onPointerDown={inicio}
          onPointerMove={mover}
          onPointerUp={fim}
          onPointerCancel={fim}
          onPointerLeave={fim}
          aria-label="Área para assinar"
        />
        {vazio && <span className="pad-dica">Assine aqui com o dedo ou o mouse</span>}
        <span className="pad-linha" />
      </div>
    </Modal>
  )
}

/** Recorta a área desenhada, reduz o tamanho e devolve um PNG (data URL). */
function recortar(c: HTMLCanvasElement) {
  const g = c.getContext('2d')!
  const { width: w, height: h } = c
  const px = g.getImageData(0, 0, w, h).data
  let x0 = w, y0 = h, x1 = 0, y1 = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 10) {
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
  const m = 8
  x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w, x1 + m); y1 = Math.min(h, y1 + m)
  const cw = Math.max(1, x1 - x0), ch = Math.max(1, y1 - y0)
  const escala = Math.min(1, 360 / cw, 120 / ch)
  const out = document.createElement('canvas')
  out.width = Math.round(cw * escala)
  out.height = Math.round(ch * escala)
  out.getContext('2d')!.drawImage(c, x0, y0, cw, ch, 0, 0, out.width, out.height)
  return out.toDataURL('image/png')
}

/** Mostra a assinatura (ou um espaço em branco para assinar no papel). */
export function ImgAssinatura({ a, altura = 40 }: { a?: Assinatura | string; altura?: number }) {
  if (!a) return null
  const src = typeof a === 'string' ? a : a.imagem
  const titulo = typeof a === 'string' ? 'Assinatura' : `Assinado por ${a.nome || '—'} em ${fmtData(a.em.slice(0, 10))} ${a.em.slice(11, 16)}`
  return <img src={src} alt={titulo} title={titulo} className="img-assinatura" style={{ maxHeight: altura }} />
}

export const quandoAssinou = (a: Assinatura) => {
  const d = new Date(a.em)
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

/** Bloco de assinatura dos documentos: mostra a imagem acima do traço quando houver. */
export function BlocoAssinatura({ imagem, children }: { imagem?: string; children: React.ReactNode }) {
  if (!imagem) return <div>{children}</div>
  return (
    <div className="com-assinatura">
      <img src={imagem} alt="Assinatura" className="img-assinatura" style={{ maxHeight: 48 }} />
      <div className="traco">{children}</div>
    </div>
  )
}

/** Cartão para coletar assinaturas de várias pessoas (equipe da APR, executantes da PT, DDS). */
export function ColetaAssinaturas({
  titulo,
  ajuda,
  assinaturas = [],
  sugestoes = [],
  onChange,
}: {
  titulo: string
  ajuda: string
  assinaturas?: Assinatura[]
  sugestoes?: string[]
  onChange: (l: Assinatura[]) => void
}) {
  const [aberto, setAberto] = useState<string | null>(null) // nome sugerido ou '' para nome livre
  const jaAssinaram = new Set(assinaturas.map((a) => a.nome.trim().toLowerCase()))
  const pendentes = sugestoes.filter((n) => n.trim() && !jaAssinaram.has(n.trim().toLowerCase()))

  return (
    <div className="card card-pad nao-imprimir" style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: 15, margin: 0 }}>{titulo}</h3>
        <span className="badge">{assinaturas.length} assinatura(s)</span>
        <button className="btn btn-sm btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setAberto('')}>
          <PenLine size={14} /> Coletar assinatura
        </button>
      </div>
      <p className="nota" style={{ marginTop: 6 }}>{ajuda}</p>
      {pendentes.length > 0 && (
        <div className="chips" style={{ marginTop: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)', alignSelf: 'center' }}>Faltam:</span>
          {pendentes.map((n) => (
            <button key={n} className="chip" onClick={() => setAberto(n)}>
              <PenLine size={12} /> {n}
            </button>
          ))}
        </div>
      )}
      {assinaturas.length > 0 && (
        <div className="lista-assinaturas">
          {assinaturas.map((a, i) => (
            <div className="ass" key={i}>
              <ImgAssinatura a={a} altura={46} />
              <div className="nome">{a.nome}</div>
              <div className="quando">{quandoAssinou(a)}</div>
              <button className="btn btn-icon btn-danger" aria-label={`Remover assinatura de ${a.nome}`} onClick={() => confirm(`Remover a assinatura de ${a.nome}?`) && onChange(assinaturas.filter((_, j) => j !== i))}>
                <Eraser size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {aberto !== null && (
        <PadAssinatura
          titulo="Coletar assinatura"
          nome={aberto}
          pedirNome
          sugestoesNome={pendentes}
          onClose={() => setAberto(null)}
          onSalvar={(a) => onChange([...assinaturas.filter((x) => x.nome.trim().toLowerCase() !== a.nome.toLowerCase()), a])}
        />
      )}
    </div>
  )
}

/** Tabela de assinaturas para impressão: nomes previstos + quem assinou na tela. */
export function TabelaAssinaturas({ rotulo, nomes, assinaturas = [], minimo = 4 }: { rotulo: string; nomes: string[]; assinaturas?: Assinatura[]; minimo?: number }) {
  const porNome = new Map(assinaturas.map((a) => [a.nome.trim().toLowerCase(), a]))
  const linhas: { nome: string; a?: Assinatura }[] = nomes.filter((n) => n.trim()).map((n) => ({ nome: n.trim(), a: porNome.get(n.trim().toLowerCase()) }))
  for (const a of assinaturas) if (!linhas.some((l) => l.nome.toLowerCase() === a.nome.trim().toLowerCase())) linhas.push({ nome: a.nome, a })
  while (linhas.length < minimo) linhas.push({ nome: '' })
  return (
    <table>
      <thead><tr><th style={{ width: '45%' }}>{rotulo}</th><th>Assinatura</th><th style={{ width: 120 }}>Data/hora</th></tr></thead>
      <tbody>
        {linhas.map((l, i) => (
          <tr key={i}>
            <td style={{ height: 30 }}>{l.nome}</td>
            <td>{l.a && <img src={l.a.imagem} alt={`Assinatura de ${l.nome}`} style={{ maxHeight: 34, maxWidth: 200 }} />}</td>
            <td>{l.a ? quandoAssinou(l.a) : ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

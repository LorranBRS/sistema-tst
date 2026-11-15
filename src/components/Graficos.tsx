// Gráficos simples em SVG (sem biblioteca): barras verticais (empilháveis), barras horizontais e linha.
// Regras: marcas finas, um eixo só, legenda quando há 2+ séries, tooltip ao passar o mouse.
import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Largura real do contêiner, para o SVG ser desenhado em pixels (texto sempre legível). */
function useLargura() {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(600)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

export interface Serie { nome: string; cor: string }
interface Dica { x: number; y: number; conteudo: ReactNode }

function Tooltip({ dica }: { dica: Dica | null }) {
  if (!dica) return null
  return <div className="viz-tip" style={{ left: dica.x, top: dica.y }}>{dica.conteudo}</div>
}

export function Legenda({ series }: { series: Serie[] }) {
  if (series.length < 2) return null
  return (
    <div className="viz-legenda">
      {series.map((s) => <span key={s.nome}><i style={{ background: s.cor }} />{s.nome}</span>)}
    </div>
  )
}

const tetoBonito = (v: number) => {
  if (v <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((x) => x >= v) ?? v
}

/** Barras verticais por categoria (ex.: meses), empilhando as séries. */
export function BarrasVerticais({ rotulos, valores, series, formato = (v) => String(v), altura = 180 }: {
  rotulos: string[]
  valores: number[][] // [categoria][serie]
  series: Serie[]
  formato?: (v: number) => string
  altura?: number
}) {
  const [dica, setDica] = useState<Dica | null>(null)
  const [ref, W] = useLargura()
  const totais = valores.map((v) => v.reduce((s, x) => s + x, 0))
  const teto = tetoBonito(Math.max(0, ...totais))
  const H = altura, esq = 38, base = H - 22, topo = 8
  const larg = (W - esq) / rotulos.length
  const barra = Math.min(28, larg * 0.62)
  const y = (v: number) => base - (v / teto) * (base - topo)
  return (
    <div className="viz" onMouseLeave={() => setDica(null)}>
      <Legenda series={series} />
      <div ref={ref} style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={series.map((s) => s.nome).join(', ')}>
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={esq} x2={W} y1={y(teto * f)} y2={y(teto * f)} className="viz-grade" />
              <text x={esq - 6} y={y(teto * f) + 4} textAnchor="end" className="viz-eixo">{formato(teto * f)}</text>
            </g>
          ))}
          {rotulos.map((r, i) => {
            const cx = esq + larg * i + larg / 2
            let acum = 0
            return (
              <g key={r}>
                {valores[i].map((v, k) => {
                  if (!v) return null
                  const y0 = y(acum), y1 = y(acum + v)
                  acum += v
                  const topoDaPilha = valores[i].slice(k + 1).every((x) => !x)
                  const h = Math.max(1, y0 - y1 - (k > 0 ? 0 : 0))
                  return (
                    <rect key={k} x={cx - barra / 2} y={y1 + (k > 0 ? 1 : 0)} width={barra} height={Math.max(1, h - (k > 0 ? 1 : 0))} rx={topoDaPilha ? 4 : 0} fill={series[k].cor} />
                  )
                })}
                <text x={cx} y={H - 6} textAnchor="middle" className="viz-eixo">{larg < 26 ? r.charAt(0).toUpperCase() : r}</text>
                <rect
                  x={cx - larg / 2} y={topo} width={larg} height={base - topo} fill="transparent"
                  onMouseMove={(e) => {
                    const box = (e.currentTarget.ownerSVGElement!.parentElement as HTMLElement).getBoundingClientRect()
                    setDica({
                      x: e.clientX - box.left, y: e.clientY - box.top,
                      conteudo: (
                        <>
                          <b>{r}</b>
                          {series.map((s, k) => <div key={s.nome}>{series.length > 1 && <i style={{ background: s.cor }} />}{s.nome}: {formato(valores[i][k])}</div>)}
                        </>
                      ),
                    })
                  }}
                />
              </g>
            )
          })}
          <line x1={esq} x2={W} y1={base} y2={base} className="viz-base" />
        </svg>
        <Tooltip dica={dica} />
      </div>
    </div>
  )
}

/** Barras horizontais ordenadas (ranking). */
export function BarrasHorizontais({ itens, cor, formato = (v) => String(v), vazio = 'Sem dados no período.' }: { itens: { rotulo: string; valor: number }[]; cor: string; formato?: (v: number) => string; vazio?: string }) {
  if (!itens.length) return <div className="viz-vazio">{vazio}</div>
  const max = Math.max(...itens.map((i) => i.valor), 1)
  return (
    <div className="viz-hbar">
      {itens.map((i) => (
        <div key={i.rotulo} className="viz-hbar-linha" title={`${i.rotulo}: ${formato(i.valor)}`}>
          <span className="r">{i.rotulo}</span>
          <span className="trilho"><span className="barra" style={{ width: `${(i.valor / max) * 100}%`, background: cor }} /></span>
          <span className="v">{formato(i.valor)}</span>
        </div>
      ))}
    </div>
  )
}

/** Linha com marcadores (valores nulos = sem dado no mês). */
export function Linha({ rotulos, valores, cor, min = 0, max = 100, formato = (v) => String(v), altura = 180 }: { rotulos: string[]; valores: (number | null)[]; cor: string; min?: number; max?: number; formato?: (v: number) => string; altura?: number }) {
  const [dica, setDica] = useState<Dica | null>(null)
  const [ref, W] = useLargura()
  const H = altura, esq = 42, base = H - 22, topo = 10
  const larg = (W - esq) / rotulos.length
  const x = (i: number) => esq + larg * i + larg / 2
  const y = (v: number) => base - ((v - min) / (max - min)) * (base - topo)
  const segs: string[] = []
  let atual = ''
  valores.forEach((v, i) => {
    if (v === null) { if (atual) segs.push(atual); atual = '' }
    else atual += `${atual ? 'L' : 'M'}${x(i)},${y(v)}`
  })
  if (atual) segs.push(atual)
  return (
    <div className="viz" onMouseLeave={() => setDica(null)}>
      <div ref={ref} style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
          {[0, 0.5, 1].map((f) => {
            const v = min + (max - min) * f
            return <g key={f}><line x1={esq} x2={W} y1={y(v)} y2={y(v)} className="viz-grade" /><text x={esq - 6} y={y(v) + 4} textAnchor="end" className="viz-eixo">{formato(v)}</text></g>
          })}
          {segs.map((d, i) => <path key={i} d={d} fill="none" stroke={cor} strokeWidth={2} strokeLinejoin="round" />)}
          {valores.map((v, i) => v !== null && <circle key={i} cx={x(i)} cy={y(v)} r={4.5} fill={cor} stroke="var(--surface)" strokeWidth={2} />)}
          {rotulos.map((r, i) => (
            <g key={r}>
              <text x={x(i)} y={H - 6} textAnchor="middle" className="viz-eixo">{larg < 26 ? r.charAt(0).toUpperCase() : r}</text>
              <rect x={x(i) - larg / 2} y={topo} width={larg} height={base - topo} fill="transparent" onMouseMove={(e) => {
                const box = (e.currentTarget.ownerSVGElement!.parentElement as HTMLElement).getBoundingClientRect()
                setDica({ x: e.clientX - box.left, y: e.clientY - box.top, conteudo: <><b>{r}</b><div>{valores[i] === null ? 'Sem dado' : formato(valores[i]!)}</div></> })
              }} />
            </g>
          ))}
          <line x1={esq} x2={W} y1={base} y2={base} className="viz-base" />
        </svg>
        <Tooltip dica={dica} />
      </div>
    </div>
  )
}

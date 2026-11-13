import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Campo, PageHead } from '../components/ui'
import { TIPOS_ACIDENTE } from '../lib/catalogos'
import { daEmpresaAtiva, useDB } from '../lib/store'
import { fmtMoeda, fmtNum, hoje } from '../lib/utils'

const ABAS = ['Taxas de frequência e gravidade', 'Dose de ruído', 'IBUTG (calor)', 'Insalubridade e periculosidade'] as const

export default function Calculadoras() {
  const [aba, setAba] = useState(0)
  return (
    <>
      <PageHead titulo="Calculadoras" sub="Ferramentas de cálculo do dia a dia. Os resultados apoiam, mas não substituem, o laudo técnico." />
      <div className="tabs" role="tablist">
        {ABAS.map((a, i) => (
          <button key={a} role="tab" aria-selected={aba === i} className={'tab' + (aba === i ? ' ativo' : '')} onClick={() => setAba(i)}>
            {a}
          </button>
        ))}
      </div>
      {aba === 0 && <Taxas />}
      {aba === 1 && <Ruido />}
      {aba === 2 && <Ibutg />}
      {aba === 3 && <Adicionais />}
    </>
  )
}

const num = (v: string) => (v === '' ? NaN : Number(v.replace(',', '.')))

function Taxas() {
  const d = useDB()
  const ano = hoje().slice(0, 4)
  const doAno = daEmpresaAtiva(d, d.ocorrencias).filter((o) => o.data.startsWith(ano) && TIPOS_ACIDENTE.includes(o.tipo))
  const [acidentes, setAcidentes] = useState(String(doAno.filter((o) => o.gravidade !== 'Sem lesão').length))
  const [dias, setDias] = useState(String(doAno.reduce((s, o) => s + (Number(o.diasPerdidos) || 0), 0)))
  const [debitados, setDebitados] = useState('0')
  const [trab, setTrab] = useState(String(daEmpresaAtiva(d, d.colaboradores).filter((c) => c.status !== 'Desligado').length))
  const [horas, setHoras] = useState('176')
  const [meses, setMeses] = useState(String(Number(hoje().slice(5, 7))))
  const hht = num(trab) * num(horas) * num(meses)
  const tf = (num(acidentes) * 1_000_000) / hht
  const tg = ((num(dias) + num(debitados)) * 1_000_000) / hht
  const ok = isFinite(tf) && hht > 0

  return (
    <div className="grid grid-2">
      <div className="card card-pad">
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>Dados do período</h3>
        <div className="form-grid">
          <Campo label="Nº de acidentes com lesão">
            <input className="input" inputMode="decimal" value={acidentes} onChange={(e) => setAcidentes(e.target.value)} />
          </Campo>
          <Campo label="Dias perdidos">
            <input className="input" inputMode="decimal" value={dias} onChange={(e) => setDias(e.target.value)} />
          </Campo>
          <Campo label="Dias debitados" ajuda="Morte/incapacidade permanente (tabela da NBR 14280)">
            <input className="input" inputMode="decimal" value={debitados} onChange={(e) => setDebitados(e.target.value)} />
          </Campo>
          <Campo label="Nº médio de trabalhadores">
            <input className="input" inputMode="decimal" value={trab} onChange={(e) => setTrab(e.target.value)} />
          </Campo>
          <Campo label="Horas trabalhadas por mês">
            <input className="input" inputMode="decimal" value={horas} onChange={(e) => setHoras(e.target.value)} />
          </Campo>
          <Campo label="Meses do período">
            <input className="input" inputMode="decimal" value={meses} onChange={(e) => setMeses(e.target.value)} />
          </Campo>
        </div>
        <p className="nota">Valores iniciais preenchidos com as ocorrências de {ano} cadastradas no sistema. HHT = trabalhadores × horas/mês × meses.</p>
      </div>
      <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
        <div className="resultado">
          <div style={{ fontWeight: 600 }}>Horas-homem trabalhadas (HHT)</div>
          <div className="grande">{ok ? fmtNum(hht) : '—'}</div>
        </div>
        <div className="resultado">
          <div style={{ fontWeight: 600 }}>Taxa de frequência (TF)</div>
          <div className="grande">{ok ? fmtNum(tf, 2) : '—'}</div>
          <div className="nota">acidentes por milhão de horas-homem · TF = N × 1.000.000 ÷ HHT</div>
        </div>
        <div className="resultado">
          <div style={{ fontWeight: 600 }}>Taxa de gravidade (TG)</div>
          <div className="grande">{ok ? fmtNum(tg, 2) : '—'}</div>
          <div className="nota">dias perdidos + debitados por milhão de HHT · conforme NBR 14280</div>
        </div>
      </div>
    </div>
  )
}

interface Exposicao {
  nivel: string
  horas: string
}

function Ruido() {
  const [norma, setNorma] = useState<'nr15' | 'nho01'>('nr15')
  const [linhas, setLinhas] = useState<Exposicao[]>([
    { nivel: '88', horas: '4' },
    { nivel: '92', horas: '2' },
    { nivel: '80', horas: '2' },
  ])
  const q = norma === 'nr15' ? 5 : 3
  const calc = linhas.map((l) => {
    const L = num(l.nivel)
    const c = num(l.horas)
    const t = 8 / Math.pow(2, (L - 85) / q) // tempo máximo permitido (h)
    // Abaixo do limiar de integração (80 dB(A)) a exposição não entra na dose
    const conta = L >= 80
    return { L, c, t, parcela: conta && isFinite(L) && isFinite(c) ? c / t : 0 }
  })
  const dose = calc.reduce((s, x) => s + x.parcela, 0)
  const nen = dose > 0 ? 85 + (q / Math.log10(2)) * Math.log10(dose) : NaN
  const acima115 = norma === 'nr15' && calc.some((x) => x.L > 115)
  const classe = dose > 1 ? 'perigo' : dose >= 0.5 ? 'alerta' : ''

  return (
    <div className="grid grid-2">
      <div className="card card-pad">
        <div className="chips" style={{ marginBottom: 14 }}>
          <button className={'chip' + (norma === 'nr15' ? ' ativo' : '')} onClick={() => setNorma('nr15')}>NR-15 Anexo 1 (q = 5)</button>
          <button className={'chip' + (norma === 'nho01' ? ' ativo' : '')} onClick={() => setNorma('nho01')}>NHO-01 (q = 3)</button>
        </div>
        <table className="tabela">
          <thead>
            <tr>
              <th>Nível dB(A)</th>
              <th>Tempo (h)</th>
              <th>Máx. permitido</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i}>
                <td>
                  <input className="input" inputMode="decimal" value={l.nivel} onChange={(e) => setLinhas(linhas.map((x, j) => (j === i ? { ...x, nivel: e.target.value } : x)))} aria-label="Nível" />
                </td>
                <td>
                  <input className="input" inputMode="decimal" value={l.horas} onChange={(e) => setLinhas(linhas.map((x, j) => (j === i ? { ...x, horas: e.target.value } : x)))} aria-label="Tempo" />
                </td>
                <td>{isFinite(calc[i].t) ? (calc[i].L < 80 ? 'não conta' : formatarHoras(calc[i].t)) : '—'}</td>
                <td>
                  <button className="btn btn-icon btn-danger" aria-label="Remover" onClick={() => setLinhas(linhas.filter((_, j) => j !== i))}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => setLinhas([...linhas, { nivel: '', horas: '' }])}>
          <Plus size={14} /> Adicionar exposição
        </button>
      </div>
      <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
        <div className={'resultado ' + classe}>
          <div style={{ fontWeight: 600 }}>Dose diária</div>
          <div className="grande">{fmtNum(dose * 100, 1)}%</div>
          <div className="nota">
            {dose > 1 ? 'Acima do limite de tolerância (dose > 100%).' : dose >= 0.5 ? 'Acima do nível de ação (dose ≥ 50%): adotar medidas preventivas.' : 'Abaixo do nível de ação.'}
          </div>
        </div>
        <div className="resultado">
          <div style={{ fontWeight: 600 }}>Nível equivalente normalizado (8 h)</div>
          <div className="grande">{isFinite(nen) ? fmtNum(nen, 1) + ' dB(A)' : '—'}</div>
          <div className="nota">NEN = 85 + {fmtNum(q / Math.log10(2), 2)} × log₁₀(dose)</div>
        </div>
        {acima115 && <div className="resultado perigo">Nível acima de 115 dB(A) sem proteção adequada oferece risco grave e iminente (NR-15).</div>}
        <p className="nota">
          Tempo máximo = 8 h ÷ 2^((L − 85) ÷ q). Exposições abaixo de 80 dB(A) não entram na dose. Use os níveis medidos pelo dosímetro ou
          medidor de nível de pressão sonora.
        </p>
      </div>
    </div>
  )
}

function formatarHoras(h: number) {
  const min = Math.round(h * 60)
  if (min >= 60) return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`
  return `${min} min`
}

function Ibutg() {
  const [sol, setSol] = useState(false)
  const [tbn, setTbn] = useState('25')
  const [tg, setTg] = useState('32')
  const [tbs, setTbs] = useState('30')
  const v = sol ? 0.7 * num(tbn) + 0.1 * num(tbs) + 0.2 * num(tg) : 0.7 * num(tbn) + 0.3 * num(tg)
  return (
    <div className="grid grid-2">
      <div className="card card-pad">
        <div className="chips" style={{ marginBottom: 14 }}>
          <button className={'chip' + (!sol ? ' ativo' : '')} onClick={() => setSol(false)}>Sem carga solar direta</button>
          <button className={'chip' + (sol ? ' ativo' : '')} onClick={() => setSol(true)}>Com carga solar direta</button>
        </div>
        <div className="form-grid">
          <Campo label="tbn – bulbo úmido natural (°C)">
            <input className="input" inputMode="decimal" value={tbn} onChange={(e) => setTbn(e.target.value)} />
          </Campo>
          <Campo label="tg – globo (°C)">
            <input className="input" inputMode="decimal" value={tg} onChange={(e) => setTg(e.target.value)} />
          </Campo>
          {sol && (
            <Campo label="tbs – bulbo seco (°C)">
              <input className="input" inputMode="decimal" value={tbs} onChange={(e) => setTbs(e.target.value)} />
            </Campo>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
        <div className="resultado">
          <div style={{ fontWeight: 600 }}>IBUTG</div>
          <div className="grande">{isFinite(v) ? fmtNum(v, 1) + ' °C' : '—'}</div>
          <div className="nota">{sol ? 'IBUTG = 0,7 tbn + 0,1 tbs + 0,2 tg' : 'IBUTG = 0,7 tbn + 0,3 tg'}</div>
        </div>
        <p className="nota">
          Compare o IBUTG médio ponderado com o limite de exposição em função da taxa metabólica da atividade (NR-15 Anexo 3 e NHO-06). Para o
          nível de ação, consulte o Anexo 3 da NR-9.
        </p>
      </div>
    </div>
  )
}

function Adicionais() {
  const [salMin, setSalMin] = useState('')
  const [grau, setGrau] = useState(20)
  const [salario, setSalario] = useState('')
  const ins = (num(salMin) * grau) / 100
  const per = num(salario) * 0.3
  return (
    <div className="grid grid-2">
      <div className="card card-pad">
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Insalubridade (NR-15)</h3>
        <div className="form-grid">
          <Campo label="Base de cálculo (R$)" ajuda="Em regra, o salário mínimo vigente">
            <input className="input" inputMode="decimal" value={salMin} placeholder="Informe o valor" onChange={(e) => setSalMin(e.target.value)} />
          </Campo>
          <Campo label="Grau">
            <select className="input" value={grau} onChange={(e) => setGrau(Number(e.target.value))}>
              <option value={10}>Mínimo – 10%</option>
              <option value={20}>Médio – 20%</option>
              <option value={40}>Máximo – 40%</option>
            </select>
          </Campo>
        </div>
        <div className="resultado" style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 600 }}>Adicional de insalubridade</div>
          <div className="grande">{isFinite(ins) ? fmtMoeda(ins) : '—'}</div>
        </div>
      </div>
      <div className="card card-pad">
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Periculosidade (NR-16)</h3>
        <Campo label="Salário-base do trabalhador (R$)" ajuda="Sem gratificações, prêmios ou participação nos lucros">
          <input className="input" inputMode="decimal" value={salario} placeholder="Informe o valor" onChange={(e) => setSalario(e.target.value)} />
        </Campo>
        <div className="resultado" style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 600 }}>Adicional de periculosidade (30%)</div>
          <div className="grande">{isFinite(per) ? fmtMoeda(per) : '—'}</div>
        </div>
        <p className="nota">Os adicionais de insalubridade e periculosidade não são cumulativos: o trabalhador opta pelo mais vantajoso.</p>
      </div>
    </div>
  )
}

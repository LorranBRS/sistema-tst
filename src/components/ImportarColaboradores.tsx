// Importação de colaboradores a partir de planilha (CSV salvo pelo Excel ou Google Planilhas).
import { useRef, useState } from 'react'
import { Download, FileUp, Upload } from 'lucide-react'
import { Campo, Modal, toast } from './ui'
import { db, useDB } from '../lib/store'
import type { Colaborador } from '../lib/types'
import { baixarArquivo, gerarCSV, normalizar } from '../lib/utils'

/** Lê CSV com aspas, detectando o separador (; , ou tab). */
export function lerCSV(texto: string): string[][] {
  const t = texto.replace(/^﻿/, '')
  const primeira = t.split(/\r?\n/)[0] ?? ''
  const sep = [';', '\t', ','].map((s) => ({ s, n: primeira.split(s).length })).sort((a, b) => b.n - a.n)[0].s
  const linhas: string[][] = []
  let linha: string[] = []
  let campo = ''
  let aspas = false
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (aspas) {
      if (ch === '"' && t[i + 1] === '"') { campo += '"'; i++ }
      else if (ch === '"') aspas = false
      else campo += ch
    } else if (ch === '"') aspas = true
    else if (ch === sep) { linha.push(campo); campo = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && t[i + 1] === '\n') i++
      linha.push(campo); campo = ''
      if (linha.some((c) => c.trim())) linhas.push(linha)
      linha = []
    } else campo += ch
  }
  linha.push(campo)
  if (linha.some((c) => c.trim())) linhas.push(linha)
  return linhas
}

/** Excel em português costuma salvar CSV em Windows-1252; tenta UTF-8 primeiro. */
function decodificar(buf: ArrayBuffer) {
  const utf8 = new TextDecoder('utf-8').decode(buf)
  return utf8.includes('�') ? new TextDecoder('windows-1252').decode(buf) : utf8
}

function dataISO(v: string) {
  const s = v.trim()
  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
  if (m) {
    const ano = m[3].length === 2 ? '20' + m[3] : m[3]
    return `${ano}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : ''
}

const COLUNAS: Record<string, string[]> = {
  nome: ['nome', 'nome completo', 'colaborador', 'funcionario', 'trabalhador'],
  matricula: ['matricula', 'registro', 'chapa', 'codigo'],
  funcao: ['funcao', 'cargo', 'ocupacao'],
  setor: ['setor', 'departamento', 'area'],
  admissao: ['admissao', 'data de admissao', 'data admissao'],
  telefone: ['telefone', 'celular', 'fone', 'whatsapp'],
  status: ['status', 'situacao'],
  empresa: ['empresa', 'cnpj', 'unidade'],
}

type Linha = Omit<Colaborador, 'id'> & { _empresaTexto: string; _dup: boolean }

export function BotaoImportarColaboradores() {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button className="btn" onClick={() => setAberto(true)}>
        <Upload size={16} /> Importar planilha
      </button>
      {aberto && <ImportarModal onClose={() => setAberto(false)} />}
    </>
  )
}

function ImportarModal({ onClose }: { onClose: () => void }) {
  const d = useDB()
  const arquivo = useRef<HTMLInputElement>(null)
  const [empresaPadrao, setEmpresaPadrao] = useState(d.config.empresaAtiva || d.empresas[0]?.id || '')
  const [linhas, setLinhas] = useState<Linha[] | null>(null)
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [erro, setErro] = useState('')

  function modelo() {
    const csv = gerarCSV(['Nome', 'Matrícula', 'Função', 'Setor', 'Admissão', 'Telefone', 'Situação', 'Empresa'], [
      ['Maria da Silva', '1001', 'Eletricista', 'Manutenção', '15/03/2024', '(11) 90000-0000', 'Ativo', ''],
      ['José Pereira', '1002', 'Soldador', 'Caldeiraria', '02/08/2025', '', 'Ativo', ''],
    ])
    baixarArquivo('modelo-importacao-colaboradores.csv', csv, 'text/csv')
  }

  function acharEmpresa(texto: string) {
    if (!texto.trim()) return ''
    const t = normalizar(texto)
    const digitos = texto.replace(/\D/g, '')
    return d.empresas.find((e) => normalizar(e.nome) === t || (digitos.length >= 8 && e.cnpj.replace(/\D/g, '') === digitos))?.id ?? ''
  }

  async function ler(f: File) {
    setErro('')
    setNomeArquivo(f.name)
    if (/\.xlsx?$/i.test(f.name)) {
      setLinhas(null)
      return setErro('Arquivos .xlsx não são lidos diretamente. No Excel, use "Salvar como" → "CSV (separado por vírgulas)" e importe o arquivo .csv.')
    }
    const tabela = lerCSV(decodificar(await f.arrayBuffer()))
    if (tabela.length < 2) return setErro('A planilha precisa ter uma linha de títulos e pelo menos um colaborador.')
    const cab = tabela[0].map((c) => normalizar(c.trim()))
    const idx: Record<string, number> = {}
    for (const [campo, nomes] of Object.entries(COLUNAS)) idx[campo] = cab.findIndex((c) => nomes.includes(c))
    if (idx.nome < 0) return setErro('Não encontrei a coluna "Nome". Baixe o modelo para ver o formato esperado.')
    const val = (l: string[], campo: string) => (idx[campo] >= 0 ? (l[idx[campo]] ?? '').trim() : '')
    const result: Linha[] = tabela.slice(1).filter((l) => val(l, 'nome')).map((l) => {
      const st = normalizar(val(l, 'status'))
      const empresaTexto = val(l, 'empresa')
      const empresaId = acharEmpresa(empresaTexto)
      return {
        empresaId,
        nome: val(l, 'nome'),
        matricula: val(l, 'matricula'),
        funcao: val(l, 'funcao'),
        setor: val(l, 'setor'),
        admissao: dataISO(val(l, 'admissao')),
        telefone: val(l, 'telefone'),
        status: st.startsWith('afast') ? 'Afastado' : st.startsWith('deslig') || st.startsWith('demit') ? 'Desligado' : 'Ativo',
        _empresaTexto: empresaTexto,
        _dup: false,
      }
    })
    setLinhas(result)
  }

  // duplicado = mesmo nome já cadastrado na mesma empresa (a empresa final depende da empresa padrão escolhida)
  const existentes = new Set(d.colaboradores.map((c) => normalizar(c.nome.trim()) + '|' + c.empresaId))
  const finais = (linhas ?? []).map((l) => {
    const empresaId = l.empresaId || empresaPadrao
    return { ...l, empresaId, _dup: existentes.has(normalizar(l.nome.trim()) + '|' + empresaId) }
  })
  const novos = finais.filter((l) => !l._dup)

  function importar() {
    if (!empresaPadrao && finais.some((l) => !l.empresaId)) return setErro('Escolha a empresa para os colaboradores sem empresa na planilha.')
    for (const { _empresaTexto, _dup, ...c } of novos) db.adicionar('colaboradores', c)
    toast(`${novos.length} colaborador(es) importado(s)`)
    onClose()
  }

  return (
    <Modal
      titulo="Importar colaboradores"
      largura={820}
      onClose={onClose}
      rodape={
        <>
          {erro && <span style={{ color: 'var(--danger)', fontSize: 13, marginRight: 'auto' }}>{erro}</span>}
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={importar} disabled={!novos.length}>
            Importar {novos.length || ''} colaborador(es)
          </button>
        </>
      }
    >
      <ol style={{ margin: '0 0 16px', paddingLeft: 20, color: 'var(--muted)', fontSize: 14, display: 'grid', gap: 4 }}>
        <li>Baixe o modelo ou use a sua planilha (precisa ter a coluna <b>Nome</b>; as demais são opcionais).</li>
        <li>No Excel, salve como <b>CSV</b>. No Google Planilhas: Arquivo → Fazer download → CSV.</li>
        <li>Escolha o arquivo, confira a prévia e clique em Importar. Nomes já cadastrados na mesma empresa são ignorados.</li>
      </ol>
      <div className="form-grid" style={{ marginBottom: 16 }}>
        <Campo label="Empresa (quando a planilha não informar)">
          <select className="input" value={empresaPadrao} onChange={(e) => setEmpresaPadrao(e.target.value)}>
            <option value="">Selecione...</option>
            {d.empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </Campo>
        <div className="field">
          <label>Arquivo</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => arquivo.current?.click()}><FileUp size={16} /> {nomeArquivo || 'Escolher arquivo'}</button>
            <button className="btn" onClick={modelo} title="Baixar modelo"><Download size={16} /> Modelo</button>
          </div>
          <input ref={arquivo} type="file" accept=".csv,text/csv,.txt,.xlsx,.xls" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) ler(f); e.target.value = '' }} />
        </div>
      </div>

      {linhas && (
        <div className="card">
          <div className="card-head">
            <h3>Prévia</h3>
            <span className="badge ok">{novos.length} novo(s)</span>
            {finais.length - novos.length > 0 && <span className="badge">{finais.length - novos.length} já cadastrado(s)</span>}
          </div>
          <div className="tabela-wrap" style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table className="tabela">
              <thead><tr><th>Nome</th><th>Função</th><th>Setor</th><th>Admissão</th><th>Empresa</th><th /></tr></thead>
              <tbody>
                {finais.map((l, i) => (
                  <tr key={i} style={l._dup ? { opacity: 0.5 } : undefined}>
                    <td><strong>{l.nome}</strong><span className="sub">{l.matricula && 'Mat. ' + l.matricula}</span></td>
                    <td>{l.funcao || '—'}</td>
                    <td>{l.setor || '—'}</td>
                    <td>{l.admissao ? l.admissao.split('-').reverse().join('/') : '—'}</td>
                    <td>
                      {d.empresas.find((e) => e.id === l.empresaId)?.nome ?? <span style={{ color: 'var(--danger)' }}>Sem empresa</span>}
                      {l._empresaTexto && !linhas[i].empresaId && <span className="sub">"{l._empresaTexto}" não encontrada</span>}
                    </td>
                    <td>{l._dup ? <span className="badge">Já existe</span> : <span className="badge ok">Novo</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  )
}

import { useEffect, useState, type ReactNode } from 'react'
import {
  AlertTriangle, Building2, Calculator, ClipboardCheck, FileWarning, GraduationCap, HardHat, LayoutDashboard, ListTodo, Menu,
  MessagesSquare, PackageCheck, Settings, ShieldCheck, Stethoscope, BookOpen, Users,
} from 'lucide-react'
import { Link, ToastHost, useRota } from './components/ui'
import { Pagina, PaginaDds, cfgAcoes, cfgAsos, cfgColaboradores, cfgEmpresas, cfgEntregas, cfgEpis, cfgOcorrencias, cfgTreinamentos } from './pages/cadastros'
import Painel from './pages/Painel'
import Inspecoes, { ExecutarInspecao } from './pages/Inspecoes'
import Aprs, { EditarApr } from './pages/Apr'
import FichaEpi from './pages/FichaEpi'
import Calculadoras from './pages/Calculadoras'
import Nrs from './pages/Nrs'
import Configuracoes from './pages/Configuracoes'
import Landing from './pages/Landing'

// Tela de apresentação (landing com recursos e planos) DESATIVADA: o sistema abre direto no painel.
// Para reativar, troque para true — o arquivo src/pages/Landing.tsx foi mantido.
const MOSTRAR_APRESENTACAO = false
import { db, daEmpresaAtiva, useDB } from './lib/store'
import { diasAte, situacao } from './lib/utils'
import type { DB } from './lib/types'

const Empresas = Pagina(cfgEmpresas)
const Colaboradores = Pagina(cfgColaboradores)
const Epis = Pagina(cfgEpis)
const Entregas = Pagina(cfgEntregas)
const Treinamentos = Pagina(cfgTreinamentos)
const Asos = Pagina(cfgAsos)
const Ocorrencias = Pagina(cfgOcorrencias)
const Acoes = Pagina(cfgAcoes)

interface ItemMenu {
  rota: string
  nome: string
  icone: ReactNode
  pagina: () => ReactNode
  contador?: (d: DB) => number
}

const MENU: { grupo: string; itens: ItemMenu[] }[] = [
  { grupo: '', itens: [{ rota: '/app', nome: 'Painel', icone: <LayoutDashboard size={18} />, pagina: () => <Painel /> }] },
  {
    grupo: 'Cadastros',
    itens: [
      { rota: '/app/empresas', nome: 'Empresas', icone: <Building2 size={18} />, pagina: () => <Empresas /> },
      { rota: '/app/colaboradores', nome: 'Colaboradores', icone: <Users size={18} />, pagina: () => <Colaboradores /> },
    ],
  },
  {
    grupo: 'Controles',
    itens: [
      { rota: '/app/epis', nome: 'EPIs e estoque', icone: <HardHat size={18} />, pagina: () => <Epis />, contador: (d) => d.epis.filter((e) => situacao(e.validadeCa, d.config.alertaDias) === 'vencido').length },
      { rota: '/app/entregas', nome: 'Entregas de EPI', icone: <PackageCheck size={18} />, pagina: () => <Entregas /> },
      { rota: '/app/treinamentos', nome: 'Treinamentos', icone: <GraduationCap size={18} />, pagina: () => <Treinamentos />, contador: (d) => contarVencidosUltimos(d, 'treinamentos') },
      { rota: '/app/asos', nome: 'ASOs e exames', icone: <Stethoscope size={18} />, pagina: () => <Asos />, contador: (d) => contarVencidosUltimos(d, 'asos') },
    ],
  },
  {
    grupo: 'Campo',
    itens: [
      { rota: '/app/inspecoes', nome: 'Inspeções', icone: <ClipboardCheck size={18} />, pagina: () => <Inspecoes /> },
      { rota: '/app/apr', nome: 'APR', icone: <FileWarning size={18} />, pagina: () => <Aprs /> },
      { rota: '/app/dds', nome: 'DDS', icone: <MessagesSquare size={18} />, pagina: () => <PaginaDds /> },
    ],
  },
  {
    grupo: 'Gestão',
    itens: [
      { rota: '/app/ocorrencias', nome: 'Ocorrências', icone: <AlertTriangle size={18} />, pagina: () => <Ocorrencias /> },
      { rota: '/app/acoes', nome: 'Plano de ação', icone: <ListTodo size={18} />, pagina: () => <Acoes />, contador: (d) => daEmpresaAtiva(d, d.acoes).filter((a) => a.status !== 'Concluída' && diasAte(a.quando) < 0).length },
    ],
  },
  {
    grupo: 'Ferramentas',
    itens: [
      { rota: '/app/calculadoras', nome: 'Calculadoras', icone: <Calculator size={18} />, pagina: () => <Calculadoras /> },
      { rota: '/app/nrs', nome: 'NRs', icone: <BookOpen size={18} />, pagina: () => <Nrs /> },
      { rota: '/app/configuracoes', nome: 'Configurações', icone: <Settings size={18} />, pagina: () => <Configuracoes /> },
    ],
  },
]

/** Conta itens vencidos considerando só o registro mais recente por colaborador (+ curso). */
function contarVencidosUltimos(d: DB, col: 'treinamentos' | 'asos') {
  const ativos = new Set(daEmpresaAtiva(d, d.colaboradores).filter((c) => c.status !== 'Desligado').map((c) => c.id))
  const m = new Map<string, { data: string; validade: string }>()
  for (const r of d[col]) {
    if (!ativos.has(r.colaboradorId)) continue
    const k = r.colaboradorId + ('curso' in r ? '|' + r.curso : '')
    const a = m.get(k)
    if (!a || r.data > a.data) m.set(k, r)
  }
  return [...m.values()].filter((r) => r.validade && diasAte(r.validade) < 0).length
}

function resolverPagina(rota: string): { ativo: string; conteudo: ReactNode } {
  const partes = rota.split('/').filter(Boolean) // ['app', 'inspecoes', 'id']
  if (partes[1] === 'inspecoes' && partes[2]) return { ativo: '/app/inspecoes', conteudo: <ExecutarInspecao id={partes[2]} /> }
  if (partes[1] === 'apr' && partes[2]) return { ativo: '/app/apr', conteudo: <EditarApr id={partes[2]} /> }
  if (partes[1] === 'ficha-epi' && partes[2]) return { ativo: '/app/colaboradores', conteudo: <FichaEpi id={partes[2]} /> }
  const base = '/' + partes.slice(0, 2).join('/')
  for (const g of MENU) for (const i of g.itens) if (i.rota === base) return { ativo: i.rota, conteudo: i.pagina() }
  return { ativo: '/app', conteudo: <Painel /> }
}

export default function App() {
  const rota = useRota()
  const d = useDB()
  const [menuAberto, setMenuAberto] = useState(false)

  // Tema claro/escuro
  useEffect(() => {
    const el = document.documentElement
    if (d.config.tema === 'claro') el.dataset.theme = 'light'
    else if (d.config.tema === 'escuro') el.dataset.theme = 'dark'
    else delete el.dataset.theme
  }, [d.config.tema])

  useEffect(() => {
    window.scrollTo(0, 0)
    setMenuAberto(false)
  }, [rota])

  const emApp = rota.startsWith('/app') || !MOSTRAR_APRESENTACAO
  const { ativo, conteudo } = emApp ? resolverPagina(rota) : { ativo: '', conteudo: null }
  const atual = MENU.flatMap((g) => g.itens).find((i) => i.rota === ativo)
  useTitulo(atual?.nome)

  if (!emApp) return <Landing />

  return (
    <div className={'shell' + (menuAberto ? ' menu-aberto' : '')} onClick={(e) => menuAberto && e.target === e.currentTarget && setMenuAberto(false)}>
      <aside className="sidebar" aria-label="Menu principal">
        <Link to={MOSTRAR_APRESENTACAO ? '/' : '/app'} className="brand">
          <span className="brand-logo">
            <ShieldCheck size={20} />
          </span>
          <div>
            Sistema TST<small>Segurança do Trabalho</small>
          </div>
        </Link>
        {MENU.map((g) => (
          <nav key={g.grupo || 'inicio'}>
            {g.grupo && <div className="nav-group">{g.grupo}</div>}
            {g.itens.map((i) => {
              const n = i.contador?.(d) ?? 0
              return (
                <Link key={i.rota} to={i.rota} className={'nav-link' + (ativo === i.rota ? ' ativo' : '')}>
                  {i.icone}
                  {i.nome}
                  {n > 0 && <span className="nav-count" title="Itens vencidos ou atrasados">{n}</span>}
                </Link>
              )
            })}
          </nav>
        ))}
        <div className="sidebar-foot">Dados salvos neste navegador · v1.0</div>
      </aside>
      {menuAberto && <div onClick={() => setMenuAberto(false)} style={{ position: 'fixed', inset: 0, zIndex: 55 }} />}
      <div className="main">
        <header className="topbar">
          <button className="btn btn-icon menu-btn" aria-label="Abrir menu" onClick={() => setMenuAberto(true)}>
            <Menu size={20} />
          </button>
          <select
            className="input"
            style={{ width: 'auto', maxWidth: 'min(320px, 60vw)' }}
            value={d.config.empresaAtiva}
            onChange={(e) => db.configurar({ empresaAtiva: e.target.value })}
            aria-label="Empresa ativa"
          >
            <option value="">Todas as empresas</option>
            {d.empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
          <span className="spacer" />
          <span className="esconde-mobile" style={{ fontSize: 14, color: 'var(--muted)' }}>
            {d.config.tecnico}
          </span>
          <span
            aria-hidden="true"
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontWeight: 700 }}
          >
            {d.config.tecnico.trim().charAt(0).toUpperCase() || 'T'}
          </span>
        </header>
        <main className="content">{conteudo}</main>
      </div>
      <ToastHost />
    </div>
  )
}

function useTitulo(nome?: string) {
  useEffect(() => {
    document.title = nome ? `${nome} · Sistema TST` : 'Sistema TST'
  }, [nome])
}

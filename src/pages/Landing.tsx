import { AlertTriangle, ArrowRight, Calculator, Check, ClipboardCheck, FileSpreadsheet, GraduationCap, HardHat, MessagesSquare, ShieldCheck, Stethoscope } from 'lucide-react'
import { Link } from '../components/ui'

const RECURSOS = [
  { ico: <HardHat size={20} />, t: 'EPIs e ficha NR-6', p: 'Catálogo com validade do CA, estoque mínimo, entregas com baixa automática e ficha de EPI pronta para assinar.' },
  { ico: <GraduationCap size={20} />, t: 'Treinamentos por NR', p: 'NR-10, NR-35, NR-33, CIPA, brigada e outros, com a data da reciclagem calculada sozinha.' },
  { ico: <Stethoscope size={20} />, t: 'ASOs (NR-7)', p: 'Admissional, periódico, retorno e demissional, com alerta antes do próximo exame.' },
  { ico: <ClipboardCheck size={20} />, t: 'Inspeções em campo', p: 'Checklists de NR-10, 12, 18, 23 e 35 pelo celular. Não conformidades viram ações em um clique.' },
  { ico: <AlertTriangle size={20} />, t: 'APR e ocorrências', p: 'Análise de risco com matriz 5×5, registro de acidentes, controle de CAT e dias sem acidentes.' },
  { ico: <MessagesSquare size={20} />, t: 'DDS e plano de ação', p: 'Banco de temas de DDS, registro de participação e plano de ação 5W2H com prazos.' },
  { ico: <Calculator size={20} />, t: 'Calculadoras', p: 'Taxa de frequência e gravidade, dose de ruído, IBUTG e adicionais de insalubridade e periculosidade.' },
  { ico: <FileSpreadsheet size={20} />, t: 'Relatórios', p: 'Exportação em CSV para Excel e impressão em PDF de fichas, APRs e inspeções.' },
]

const PLANOS = [
  { nome: 'Gratuito', preco: 'R$ 0', desc: 'Para conhecer o sistema', itens: ['1 empresa', 'Até 25 colaboradores', 'Todos os módulos', 'Dados no navegador'], destaque: false },
  { nome: 'Profissional', preco: 'R$ 49', desc: 'Para o técnico de uma empresa', itens: ['Empresas ilimitadas', 'Colaboradores ilimitados', 'Sincronização na nuvem*', 'Assinatura digital*'], destaque: true },
  { nome: 'Consultoria', preco: 'R$ 129', desc: 'Para quem atende vários clientes', itens: ['Tudo do Profissional', 'Equipe com vários técnicos*', 'Portal do cliente*', 'Relatórios com sua marca*'], destaque: false },
]

export default function Landing() {
  return (
    <div className="landing">
      <header className="land-nav">
        <div className="brand">
          <span className="brand-logo"><ShieldCheck size={20} /></span>
          <div>
            Sistema TST<small>Segurança do Trabalho</small>
          </div>
        </div>
        <span className="spacer" />
        <a href="#recursos" className="esconde-mobile" onClick={(e) => { e.preventDefault(); document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' }) }}>Recursos</a>
        <a href="#planos" className="esconde-mobile" onClick={(e) => { e.preventDefault(); document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' }) }}>Planos</a>
        <Link to="/app" className="btn btn-primary">Entrar</Link>
      </header>

      <section className="hero">
        <div>
          <span className="selo"><ShieldCheck size={14} /> Feito para o Técnico de Segurança do Trabalho</span>
          <h1>
            A rotina do TST <span>organizada</span> em um só lugar.
          </h1>
          <p className="lead">
            Controle EPIs, treinamentos, ASOs, inspeções, APRs, acidentes e DDS sem planilhas espalhadas. Receba alertas antes de tudo vencer e
            gere fichas e relatórios prontos para imprimir.
          </p>
          <div className="ctas">
            <Link to="/app" className="btn btn-primary">
              Acessar a demonstração <ArrowRight size={16} />
            </Link>
            <a className="btn" href="https://github.com/LorranBRS/sistema-tst" target="_blank" rel="noreferrer">Ver no GitHub</a>
          </div>
          <p className="nota">Sem cadastro: a demonstração já vem com dados de exemplo e salva tudo no seu navegador.</p>
        </div>
        <div className="card mock" aria-hidden="true">
          <div className="card destaque-dias" style={{ padding: 16 }}>
            <div className="num" style={{ fontSize: 38 }}>127</div>
            <div><strong>dias sem acidentes</strong><p>Recorde: 214 dias</p></div>
          </div>
          <div className="linha">
            <div className="card stat"><div className="rotulo"><span className="ico danger"><GraduationCap size={15} /></span>Treinamentos</div><div className="valor">3</div><div className="detalhe">vencidos · 2 a vencer</div></div>
            <div className="card stat"><div className="rotulo"><span className="ico warn"><HardHat size={15} /></span>EPIs</div><div className="valor">4</div><div className="detalhe">com alerta</div></div>
          </div>
          <div className="card">
            <ul className="lista">
              <li><div><div className="titulo">NR-35 Trabalho em altura</div><div className="sub">Treinamento · Rafael Martins</div></div><div className="dir"><span className="badge vencido">Vencido</span></div></li>
              <li><div><div className="titulo">Exame periódico</div><div className="sub">ASO · Fernanda Oliveira</div></div><div className="dir"><span className="badge avencer">A vencer</span></div></li>
              <li><div><div className="titulo">Óculos de proteção incolor</div><div className="sub">CA de EPI · 10346</div></div><div className="dir"><span className="badge avencer">A vencer</span></div></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="secao" id="recursos">
        <h2>Tudo o que o dia a dia do TST pede</h2>
        <p>Módulos pensados a partir das NRs e das rotinas de campo: do almoxarifado de EPI à investigação de acidentes.</p>
        <div className="grid grid-4">
          {RECURSOS.map((r) => (
            <div className="card recurso" key={r.t}>
              <div className="ico">{r.ico}</div>
              <h3>{r.t}</h3>
              <p>{r.p}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="secao" id="planos">
        <h2>Planos</h2>
        <p>Comece grátis. Os planos pagos estão em desenvolvimento — os itens com * fazem parte do roadmap.</p>
        <div className="grid grid-3">
          {PLANOS.map((p) => (
            <div className={'card plano' + (p.destaque ? ' destaque' : '')} key={p.nome}>
              {p.destaque && <span className="badge ok" style={{ alignSelf: 'flex-start' }}>Mais indicado</span>}
              <h3>{p.nome}</h3>
              <div className="preco">{p.preco}<small>/mês</small></div>
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>{p.desc}</div>
              <ul>
                {p.itens.map((i) => (
                  <li key={i}><Check size={16} /> {i}</li>
                ))}
              </ul>
              <Link to="/app" className={'btn' + (p.destaque ? ' btn-primary' : '')}>
                {p.preco === 'R$ 0' ? 'Começar grátis' : 'Testar agora'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="land-foot">
        Sistema TST · Projeto de Lorran Rodrigues · Os prazos e cálculos são de apoio e não substituem a análise do profissional habilitado.
      </footer>
    </div>
  )
}

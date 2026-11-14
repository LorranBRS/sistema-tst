// Aplica a cor principal escolhida (sobrescreve as variáveis --primary* do index.css).
import { CORES } from './catalogos'

export function aplicarCor(id?: string) {
  const ANTIGO = document.getElementById('cor-primaria')
  const cor = CORES.find((c) => c.id === id)
  if (!cor || cor.id === 'verde') {
    ANTIGO?.remove()
    return
  }
  const vars = ([p, s, soft]: [string, string, string]) => `--primary:${p};--primary-strong:${s};--primary-soft:${soft};--ok:${p};--ok-soft:${soft};`
  const css = `:root{${vars(cor.claro)}}
@media (prefers-color-scheme: dark){:root:not([data-theme='light']){${vars(cor.escuro)}}}
:root[data-theme='dark']{${vars(cor.escuro)}}`
  const el = ANTIGO ?? Object.assign(document.createElement('style'), { id: 'cor-primaria' })
  el.textContent = css
  if (!ANTIGO) document.head.appendChild(el)
}

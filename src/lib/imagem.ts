// Lê uma imagem escolhida pelo usuário e reduz o tamanho (para caber no armazenamento do navegador).
export function lerLogo(arquivo: File, lado = 360, formato: 'image/png' | 'image/jpeg' = 'image/png'): Promise<string> {
  return new Promise((ok, falha) => {
    if (!arquivo.type.startsWith('image/')) return falha(new Error('Escolha um arquivo de imagem (PNG, JPG ou SVG).'))
    const leitor = new FileReader()
    leitor.onerror = () => falha(new Error('Não foi possível ler a imagem.'))
    leitor.onload = () => {
      const img = new Image()
      img.onerror = () => falha(new Error('Imagem inválida.'))
      img.onload = () => {
        const escala = Math.min(1, lado / Math.max(img.width || lado, img.height || lado))
        const w = Math.max(1, Math.round((img.width || lado) * escala))
        const h = Math.max(1, Math.round((img.height || lado) * escala))
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const g = c.getContext('2d')!
        if (formato === 'image/jpeg') {
          g.fillStyle = '#fff'
          g.fillRect(0, 0, w, h)
        }
        g.drawImage(img, 0, 0, w, h)
        ok(formato === 'image/jpeg' ? c.toDataURL('image/jpeg', 0.82) : c.toDataURL('image/png'))
      }
      img.src = String(leitor.result)
    }
    leitor.readAsDataURL(arquivo)
  })
}

// Galeria de fotos de um registro: tirar/escolher foto, ver ampliada e remover.
import { useRef, useState } from 'react'
import { Camera, Trash2, X } from 'lucide-react'
import { apagarFoto, salvarFoto, useFoto } from '../lib/fotos'

export function Fotos({ ids = [], onChange, somenteLeitura, tamanho = 76 }: { ids?: string[]; onChange?: (ids: string[]) => void; somenteLeitura?: boolean; tamanho?: number }) {
  const ref = useRef<HTMLInputElement>(null)
  const [ampliada, setAmpliada] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function adicionar(lista: FileList | null) {
    if (!lista?.length || !onChange) return
    setEnviando(true)
    try {
      const novos: string[] = []
      for (const f of Array.from(lista)) novos.push(await salvarFoto(f))
      onChange([...ids, ...novos])
    } catch (e) {
      alert('Não foi possível salvar a foto: ' + (e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  if (somenteLeitura && !ids.length) return null
  return (
    <div className="fotos">
      {ids.map((id) => (
        <Miniatura key={id} id={id} tamanho={tamanho} onAbrir={() => setAmpliada(id)} onRemover={somenteLeitura ? undefined : () => {
          if (!confirm('Remover esta foto?')) return
          onChange?.(ids.filter((x) => x !== id))
          apagarFoto(id).catch(() => {})
        }} />
      ))}
      {!somenteLeitura && (
        <button type="button" className="foto-add nao-imprimir" style={{ width: tamanho, height: tamanho }} onClick={() => ref.current?.click()} disabled={enviando} title="Tirar ou escolher foto">
          <Camera size={20} />
          <span>{enviando ? 'Salvando...' : 'Foto'}</span>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => { adicionar(e.target.files); e.target.value = '' }} />
      {ampliada && <Ampliada id={ampliada} onClose={() => setAmpliada(null)} />}
    </div>
  )
}

function Miniatura({ id, tamanho, onAbrir, onRemover }: { id: string; tamanho: number; onAbrir: () => void; onRemover?: () => void }) {
  const src = useFoto(id)
  return (
    <div className="foto-mini" style={{ width: tamanho, height: tamanho }}>
      {src ? <img src={src} alt="Foto" onClick={onAbrir} /> : <span className="foto-carregando" />}
      {onRemover && (
        <button type="button" className="foto-remover nao-imprimir" aria-label="Remover foto" onClick={onRemover}><Trash2 size={13} /></button>
      )}
    </div>
  )
}

function Ampliada({ id, onClose }: { id: string; onClose: () => void }) {
  const src = useFoto(id)
  return (
    <div className="modal-fundo nao-imprimir" onClick={onClose} style={{ zIndex: 150 }}>
      <button className="btn btn-icon" aria-label="Fechar" style={{ position: 'fixed', top: 16, right: 16, background: '#fff' }} onClick={onClose}><X size={20} /></button>
      {src && <img src={src} alt="Foto ampliada" style={{ maxWidth: '96vw', maxHeight: '90vh', borderRadius: 8 }} />}
    </div>
  )
}

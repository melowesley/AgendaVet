'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/data-store'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ImageIcon, Save, Trash2, ExternalLink, ArrowLeft, Camera, Video, Play, FileImage } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface GaleriaDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

interface MediaRecord {
    id: string
    title: string | null
    url: string
    description: string | null
    date: string
    tags: string[] | null
    type: 'photo' | 'video'
}

export function GaleriaDialog({ open, onOpenChange, onBack, petId, petName }: GaleriaDialogProps) {
    const [loading, setLoading] = useState(false)
    const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo')
    const [records, setRecords] = useState<MediaRecord[]>([])

    const [title, setTitle] = useState('')
    const [mediaUrl, setMediaUrl] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [tags, setTags] = useState('')

    useEffect(() => {
        if (open) loadRecords()
    }, [open, petId])

    const loadRecords = async () => {
        try {
            // Load both photos and videos concurrently
            const [photosResponse, videosResponse] = await Promise.all([
                (supabase.from('pet_photos' as any).select('*').eq('pet_id', petId) as any),
                (supabase.from('pet_videos' as any).select('*').eq('pet_id', petId) as any)
            ])

            const photos = (photosResponse.data || []).map((p: any) => ({
                id: p.id,
                title: p.title,
                url: p.photo_url, // Map DB specific column to generic 'url'
                description: p.description,
                date: p.date,
                tags: p.tags,
                type: 'photo' as const
            }))

            const videos = (videosResponse.data || []).map((v: any) => ({
                id: v.id,
                title: v.title,
                url: v.video_url, // Map DB specific column to generic 'url'
                description: v.description,
                date: v.date,
                tags: v.tags,
                type: 'video' as const
            }))

            const combined = [...photos, ...videos].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            )

            setRecords(combined)
        } catch (error) {
            console.error('Error loading media:', error)
        }
    }

    const handleSave = async () => {
        if (!mediaUrl || !date) {
            toast.error('URL da mídia e data são obrigatórios')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null

            const table = mediaType === 'photo' ? 'pet_photos' : 'pet_videos'
            const payload = {
                pet_id: petId,
                user_id: userData.user?.id,
                title: title || null,
                [mediaType === 'photo' ? 'photo_url' : 'video_url']: mediaUrl,
                description: description || null,
                date,
                tags: tagsArray,
            }

            const { error } = await (supabase.from(table as any).insert([payload] as any) as any)
            if (error) throw error

            toast.success(`${mediaType === 'photo' ? 'Foto' : 'Vídeo'} salvo com sucesso!`)
            resetForm()
            loadRecords()
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar mídia')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setTitle('')
        setMediaUrl('')
        setDescription('')
        setTags('')
        setDate(format(new Date(), 'yyyy-MM-dd'))
    }

    const handleDelete = async (id: string, type: 'photo' | 'video') => {
        try {
            const table = type === 'photo' ? 'pet_photos' : 'pet_videos'
            const { error } = await (supabase.from(table as any).delete().eq('id', id) as any)
            if (error) throw error
            toast.success('Mídia excluída')
            loadRecords()
        } catch (error: any) {
            toast.error(error.message || 'Erro ao excluir arquivo')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0 border-b border-border/50">
                    <div className="flex items-center gap-4 mb-4">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onBack}>
                                <ArrowLeft size={18} />
                            </Button>
                        )}
                        <div className="flex size-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                            <ImageIcon className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Galeria - {petName}</DialogTitle>
                            <DialogDescription>Gerenciamento de fotos e vídeos clínicos</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Add Media Section */}
                    <div className="w-full md:w-[40%] p-6 border-r border-border/30 overflow-y-auto">
                        <Tabs defaultValue="photo" value={mediaType} onValueChange={(v) => setMediaType(v as 'photo' | 'video')} className="w-full">
                            <h3 className="font-semibold text-sm mb-4">Adicionar Nova Mídia</h3>
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="photo" className="flex items-center gap-2">
                                    <Camera size={14} /> Foto
                                </TabsTrigger>
                                <TabsTrigger value="video" className="flex items-center gap-2">
                                    <Video size={14} /> Vídeo
                                </TabsTrigger>
                            </TabsList>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="media-url">URL do Arquivo *</Label>
                                    <Input
                                        id="media-url"
                                        value={mediaUrl}
                                        onChange={(e) => setMediaUrl(e.target.value)}
                                        placeholder={`https://... (Drive, iCloud, ${mediaType === 'video' ? 'YouTube' : 'Imagens'})`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="media-title">Título (Opcional)</Label>
                                        <Input id="media-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Antes da cirurgia" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="media-date">Data *</Label>
                                        <Input id="media-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="media-desc">Descrição</Label>
                                    <Textarea id="media-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes clínicos da mídia..." className="min-h-[80px]" />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="media-tags">Tags (separadas por vírgula)</Label>
                                    <Input id="media-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Ex: pele, alergia, olho direito" />
                                </div>

                                <Button onClick={handleSave} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white mt-4">
                                    <Save className="size-4 mr-2" />
                                    {loading ? 'Salvando...' : `Salvar ${mediaType === 'photo' ? 'Foto' : 'Vídeo'}`}
                                </Button>
                            </div>
                        </Tabs>
                    </div>

                    {/* Gallery View */}
                    <div className="w-full md:w-[60%] bg-muted/10 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-border/30 bg-muted/20 flex items-center justify-between">
                            <h3 className="font-semibold text-sm">Arquivos do Paciente</h3>
                            <Badge variant="outline" className="font-mono text-[10px]">{records.length} itens</Badge>
                        </div>
                        <ScrollArea className="flex-1 p-6">
                            {records.length === 0 ? (
                                <div className="text-center py-20 flex flex-col items-center">
                                    <div className="p-4 rounded-full bg-muted border border-border/50 mb-3">
                                        <FileImage className="size-8 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">Galeria Vazia</p>
                                    <p className="text-xs text-muted-foreground/70 mt-1 max-w-[250px]">Adicione fotos e vídeos clínicos no formulário ao lado.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {records.map((record) => (
                                        <div key={`${record.type}-${record.id}`} className="group relative bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            {/* Preview Area */}
                                            <div className="aspect-[4/3] bg-muted/30 relative flex items-center justify-center overflow-hidden border-b border-border/30">
                                                {record.type === 'photo' ? (
                                                    <img
                                                        src={record.url}
                                                        alt={record.title || 'Foto Clínica'}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f1f5f9" width="100" height="100"/%3E%3Cpath d="M50 40c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm0 16c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z" fill="%2394a3b8"/%3E%3C/svg%3E';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                        <div className="size-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                                                            <Play className="size-6 text-orange-500 ml-1" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Type Badge */}
                                                <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-white text-[10px] flex items-center gap-1 font-medium">
                                                    {record.type === 'photo' ? <Camera size={10} /> : <Video size={10} />}
                                                    {record.type === 'photo' ? 'Foto' : 'Vídeo'}
                                                </div>

                                                {/* Action Overlay */}
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={record.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex size-7 items-center justify-center rounded bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
                                                    >
                                                        <ExternalLink size={12} />
                                                    </a>
                                                    <button
                                                        onClick={() => handleDelete(record.id, record.type)}
                                                        className="flex size-7 items-center justify-center rounded bg-destructive/90 backdrop-blur-sm text-white hover:bg-destructive transition-colors"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Info Area */}
                                            <div className="p-3">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-semibold text-sm truncate pr-2" title={record.title || 'Sem título'}>
                                                        {record.title || 'Mídia sem título'}
                                                    </h4>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mb-1.5">
                                                    {format(new Date(record.date), 'dd/MM/yyyy')}
                                                </p>

                                                {record.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2" title={record.description}>
                                                        {record.description}
                                                    </p>
                                                )}

                                                {record.tags && record.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-auto pt-2">
                                                        {record.tags.map((tag, idx) => (
                                                            <Badge key={idx} variant="secondary" className="text-[9px] bg-muted/50 px-1.5 py-0 h-4">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

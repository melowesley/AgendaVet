'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/data-store'
import { mutate } from 'swr'
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    DollarSign, Save, ArrowLeft, Printer, History, PawPrint,
    Plus, Trash2, CreditCard, Banknote, QrCode, ShoppingCart, Package
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useReactToPrint } from 'react-to-print'
import { usePet, useOwner, useMedicalRecords } from '@/lib/data-store'

interface FinanceiroDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack?: () => void
    petId: string
    petName: string
}

interface Service {
    id: string
    name: string
    price: number
    duration_minutes: number | null
    active: boolean | null
}

interface CartItem {
    id: string
    name: string
    unitPrice: number
    quantity: number
}

const PAYMENT_METHODS = [
    { id: 'pix', label: 'PIX', icon: QrCode, color: 'text-emerald-600' },
    { id: 'credit_card', label: 'Cartão de Crédito', icon: CreditCard, color: 'text-blue-600' },
    { id: 'debit_card', label: 'Cartão de Débito', icon: CreditCard, color: 'text-indigo-600' },
    { id: 'cash', label: 'Dinheiro', icon: Banknote, color: 'text-green-600' },
]

export function FinanceiroDialog({ open, onOpenChange, onBack, petId, petName }: FinanceiroDialogProps) {
    const { pet } = usePet(petId)
    const { owner } = useOwner(pet?.profileId || '')
    const { records: allRecords } = useMedicalRecords(petId)

    const [loading, setLoading] = useState(false)
    const [services, setServices] = useState<Service[]>([])
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [paymentMethod, setPaymentMethod] = useState('pix')
    const [observacoes, setObservacoes] = useState('')
    const [customItemName, setCustomItemName] = useState('')
    const [customItemPrice, setCustomItemPrice] = useState('')

    const printRef = useRef<HTMLDivElement>(null)
    const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Financeiro_${petName}_${format(new Date(), 'dd_MM_yyyy')}` })

    useEffect(() => {
        if (open) {
            loadServices()
            setDate(format(new Date(), 'yyyy-MM-dd'))
            setCartItems([])
            setObservacoes('')
            setPaymentMethod('pix')
            setCustomItemName('')
            setCustomItemPrice('')
        }
    }, [open])

    const loadServices = async () => {
        const { data, error } = await (supabase
            .from('services' as any)
            .select('id, name, price, duration_minutes, active')
            .eq('active', true)
            .order('name') as any)
        if (!error && data) setServices(data)
    }

    const addServiceToCart = (service: Service) => {
        setCartItems(prev => {
            const existing = prev.find(i => i.id === service.id)
            if (existing) {
                return prev.map(i => i.id === service.id ? { ...i, quantity: i.quantity + 1 } : i)
            }
            return [...prev, { id: service.id, name: service.name, unitPrice: service.price, quantity: 1 }]
        })
    }

    const addCustomItem = () => {
        if (!customItemName.trim() || !customItemPrice) return
        const price = parseFloat(customItemPrice)
        if (isNaN(price) || price < 0) return
        setCartItems(prev => [...prev, {
            id: `custom-${Date.now()}`,
            name: customItemName.trim(),
            unitPrice: price,
            quantity: 1
        }])
        setCustomItemName('')
        setCustomItemPrice('')
    }

    const updateQuantity = (id: string, qty: number) => {
        if (qty <= 0) {
            setCartItems(prev => prev.filter(i => i.id !== id))
        } else {
            setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
        }
    }

    const removeItem = (id: string) => setCartItems(prev => prev.filter(i => i.id !== id))

    const total = cartItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0)

    const handleSave = async () => {
        if (cartItems.length === 0) {
            toast.error('Adicione pelo menos um item ao orçamento')
            return
        }

        setLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()

            // Save to pet_services for each item
            const petServicesPayload = cartItems.map(item => ({
                pet_id: petId,
                service_id: item.id.startsWith('custom-') ? null : item.id,
                service_name: item.name,
                price_snapshot: item.unitPrice,
                quantity: item.quantity,
                notes: observacoes || null,
                added_by: userData.user?.id,
            }))

            const { error: servicesError } = await (supabase
                .from('pet_services' as any)
                .insert(petServicesPayload as any) as any)

            if (servicesError) throw servicesError

            // Save summary to medical_records
            const { error: recordError } = await (supabase.from('medical_records' as any).insert([{
                pet_id: petId,
                user_id: userData.user?.id,
                type: 'financeiro',
                title: `Faturamento - ${format(parseISO(date), 'dd/MM/yyyy')}`,
                description: JSON.stringify({
                    items: cartItems,
                    total,
                    paymentMethod,
                    observacoes,
                }),
                date: new Date(date + 'T12:00:00').toISOString(),
                veterinarian: '',
            }] as any) as any)

            if (recordError) throw recordError

            mutate('medical-records')
            toast.success(`Faturamento de R$ ${total.toFixed(2)} registrado!`)
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar faturamento')
        } finally {
            setLoading(false)
        }
    }

    const paymentLabel = PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label || paymentMethod

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-screen sm:max-w-none !max-w-none h-screen max-h-none rounded-none p-0 flex flex-col overflow-hidden border-none text-slate-800">
                <DialogHeader className="p-4 md:p-6 border-b border-border/50 bg-white flex flex-row items-center justify-between shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-100" onClick={onBack}>
                                <ArrowLeft className="size-5" />
                            </Button>
                        )}
                        <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 shadow-inner">
                            <DollarSign className="size-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">
                                Financeiro
                            </DialogTitle>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 font-medium">
                                <span className="flex items-center gap-1"><PawPrint className="size-3.5" /> <span className="font-bold text-slate-700">{petName}</span></span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1 font-bold text-emerald-700 uppercase tracking-tighter text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200">
                                    Orçamento & Cobrança
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6 font-bold text-slate-500">
                            Fechar
                        </Button>
                        <Button onClick={handleSave} disabled={loading} className="h-10 px-6 font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
                            <Save className="size-4 mr-2" />
                            {loading ? 'Salvando...' : 'Confirmar Faturamento'}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex bg-slate-100/50">
                    {/* Left: Service Catalog */}
                    <div className="hidden xl:block w-[320px] bg-slate-50/80 border-r border-border/30 p-6 overflow-y-auto shrink-0 shadow-inner">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 border-l-4 border-emerald-500 pl-4 mb-6">
                            Catálogo de Serviços
                        </h3>
                        {services.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <Package className="size-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Nenhum serviço cadastrado</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {services.map(service => (
                                    <button
                                        key={service.id}
                                        onClick={() => addServiceToCart(service)}
                                        className="w-full flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl text-left hover:border-emerald-400 hover:shadow-md transition-all group"
                                    >
                                        <div>
                                            <p className="text-xs font-black text-slate-800 group-hover:text-emerald-700">{service.name}</p>
                                            {service.duration_minutes && (
                                                <p className="text-[10px] text-slate-400 mt-0.5">{service.duration_minutes} min</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-emerald-700">R$ {service.price.toFixed(2)}</p>
                                            <Plus className="size-3 text-slate-300 group-hover:text-emerald-500 ml-auto mt-0.5" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Form Side */}
                    <div className="w-full xl:w-[500px] p-8 bg-white border-r border-border/30 overflow-y-auto shrink-0 shadow-lg z-10 relative">
                        <div className="space-y-8">
                            <div className="border-l-4 border-slate-900 pl-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 leading-none py-1">
                                    Novo Orçamento / Cobrança
                                </h3>
                            </div>

                            <div className="space-y-6">
                                {/* Date */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data do Faturamento *</Label>
                                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 border-slate-200 rounded-xl font-bold" />
                                </div>

                                {/* Service catalog on mobile */}
                                <div className="xl:hidden">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Adicionar Serviço do Catálogo</Label>
                                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        {services.map(service => (
                                            <button
                                                key={service.id}
                                                onClick={() => addServiceToCart(service)}
                                                className="flex flex-col p-2 bg-white border border-slate-200 rounded-lg text-left hover:border-emerald-400 transition-all text-[10px]"
                                            >
                                                <span className="font-black text-slate-800">{service.name}</span>
                                                <span className="text-emerald-700 font-black mt-1">R$ {service.price.toFixed(2)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom item */}
                                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Adicionar Item Avulso</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={customItemName}
                                            onChange={(e) => setCustomItemName(e.target.value)}
                                            placeholder="Nome do item"
                                            className="h-10 flex-1 border-slate-200 rounded-lg text-sm"
                                            onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                                        />
                                        <Input
                                            type="number"
                                            value={customItemPrice}
                                            onChange={(e) => setCustomItemPrice(e.target.value)}
                                            placeholder="Preço"
                                            className="h-10 w-24 border-slate-200 rounded-lg text-sm font-mono"
                                            onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                                        />
                                        <Button variant="outline" size="sm" onClick={addCustomItem} className="h-10 px-3 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                                            <Plus className="size-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Cart */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <ShoppingCart className="size-3 inline mr-1" /> Itens do Orçamento
                                        </Label>
                                        <Badge variant="outline" className="text-[10px] font-mono">{cartItems.length} itens</Badge>
                                    </div>

                                    {cartItems.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                                            <ShoppingCart className="size-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-xs font-medium">Adicione serviços ou itens avulsos</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {cartItems.map(item => (
                                                <div key={item.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-black text-slate-800 truncate">{item.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-mono">R$ {item.unitPrice.toFixed(2)} / un.</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="size-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">−</button>
                                                        <span className="text-sm font-black w-6 text-center">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="size-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">+</button>
                                                    </div>
                                                    <p className="text-sm font-black text-emerald-700 w-20 text-right">R$ {(item.unitPrice * item.quantity).toFixed(2)}</p>
                                                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 rounded-lg shrink-0">
                                                        <Trash2 className="size-3" />
                                                    </Button>
                                                </div>
                                            ))}

                                            <div className="flex justify-between items-center pt-3 border-t border-slate-200 px-1">
                                                <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Total:</span>
                                                <span className="text-2xl font-black text-emerald-700">R$ {total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Method */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Método de Pagamento</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PAYMENT_METHODS.map(method => {
                                            const PayIcon = method.icon
                                            return (
                                                <button
                                                    key={method.id}
                                                    onClick={() => setPaymentMethod(method.id)}
                                                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${paymentMethod === method.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                                >
                                                    <PayIcon className={`size-4 ${paymentMethod === method.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                                                    <span className={`text-xs font-black ${paymentMethod === method.id ? 'text-emerald-700' : 'text-slate-500'}`}>{method.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Observacoes */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações</Label>
                                    <Textarea
                                        value={observacoes}
                                        onChange={(e) => setObservacoes(e.target.value)}
                                        placeholder="Desconto aplicado, parcelamento, convênio..."
                                        className="min-h-[80px] border-slate-200 rounded-xl font-medium text-sm"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button onClick={handleSave} disabled={loading || cartItems.length === 0} className="flex-1 h-14 text-base font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl rounded-2xl transition-all hover:scale-[1.02] active:scale-95">
                                        <Save className="size-5 mr-2" />
                                        {loading ? 'Salvando...' : 'Confirmar Faturamento'}
                                    </Button>
                                    <Button variant="outline" className="h-14 px-6 border-2 font-bold hover:bg-slate-50 rounded-2xl" onClick={() => handlePrint()}>
                                        <Printer className="size-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview - Orçamento */}
                    <div className="hidden md:flex flex-1 bg-slate-200/50 p-6 lg:p-12 overflow-y-auto justify-center items-start">
                        <div
                            ref={printRef}
                            className="w-full max-w-[650px] min-h-[920px] bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-sm border p-12 flex flex-col text-slate-900 border-emerald-200 border-t-8 border-emerald-500"
                        >
                            <div className="border-b-2 pb-6 mb-8 flex justify-between items-end border-emerald-500">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-emerald-700">Orçamento / Nota de Serviço</h2>
                                    <p className="text-[10px] opacity-70 mt-1 uppercase font-bold text-slate-500">Faturamento de Serviços Veterinários</p>
                                </div>
                                <div className="text-right text-emerald-700">
                                    <DollarSign className="size-10 ml-auto mb-1 opacity-20" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AgendaVet</p>
                                </div>
                            </div>

                            <div className="border border-slate-300 p-6 mb-8 rounded-sm bg-slate-50/50 shadow-inner">
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">PACIENTE</p>
                                        <div className="space-y-0.5 border-t border-slate-200 pt-3 text-[11px] font-medium text-slate-900 uppercase">
                                            <p className="text-sm font-black text-slate-800 mb-1 leading-none">{petName}</p>
                                            <p className="text-slate-600 truncate">{pet?.species === 'dog' ? 'Canina' : pet?.species === 'cat' ? 'Felina' : 'Animal'} | {pet?.breed}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 border-l border-slate-200 pl-8 text-right font-medium">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">TUTOR / DATA</p>
                                        <div className="space-y-0.5 border-t border-slate-200 pt-3 text-[11px]">
                                            <p className="font-black text-slate-800 text-sm uppercase mb-1">{owner?.fullName || 'S/R'}</p>
                                            <p className="font-black uppercase text-[10px] mt-2 inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700">
                                                {date ? format(parseISO(date), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-8 pb-10">
                                {/* Items table */}
                                <section>
                                    <h3 className="text-[11px] font-black uppercase tracking-widest mb-4 text-emerald-700 border-b border-slate-100 pb-2">
                                        Serviços / Itens
                                    </h3>
                                    {cartItems.length === 0 ? (
                                        <p className="text-sm italic text-slate-400">Aguardando adição de itens...</p>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-12 text-[9px] font-black uppercase text-slate-400 pb-1 border-b border-slate-100">
                                                <span className="col-span-6">Descrição</span>
                                                <span className="col-span-2 text-center">Qtd</span>
                                                <span className="col-span-2 text-right">Unit.</span>
                                                <span className="col-span-2 text-right">Total</span>
                                            </div>
                                            {cartItems.map(item => (
                                                <div key={item.id} className="grid grid-cols-12 text-[11px] py-2 border-b border-slate-50">
                                                    <span className="col-span-6 font-bold text-slate-800">{item.name}</span>
                                                    <span className="col-span-2 text-center text-slate-600 font-mono">{item.quantity}</span>
                                                    <span className="col-span-2 text-right text-slate-600 font-mono">R$ {item.unitPrice.toFixed(2)}</span>
                                                    <span className="col-span-2 text-right font-black text-slate-900 font-mono">R$ {(item.unitPrice * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between items-center pt-4 border-t-2 border-emerald-200">
                                                <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Total Geral:</span>
                                                <span className="text-3xl font-black text-emerald-700 font-mono">R$ {total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )}
                                </section>

                                {/* Payment */}
                                <section className="bg-emerald-50 p-5 rounded-sm border border-emerald-100 shadow-inner">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 text-emerald-700">Forma de Pagamento</h3>
                                    <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{paymentLabel}</p>
                                    {observacoes && (
                                        <p className="text-xs text-slate-600 mt-2 italic">{observacoes}</p>
                                    )}
                                </section>
                            </div>

                            <div className="mt-auto pt-12 flex justify-between items-end border-t border-slate-100 italic">
                                <div className="text-[9px] opacity-40 leading-tight max-w-[200px] font-black text-slate-500 uppercase">
                                    DOCUMENTO FINANCEIRO • AGENDAVET • {format(new Date(), 'dd/MM/yyyy HH:mm')}
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-black text-slate-500 uppercase">Assinatura do Responsável</p>
                                    <div className="h-[1px] w-48 bg-slate-300 mt-6 ml-auto"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

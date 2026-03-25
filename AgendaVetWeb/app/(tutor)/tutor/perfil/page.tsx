'use client'

import { useEffect, useState } from 'react'
import { TutorLayout } from '@/components/tutor/tutor-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { User, Phone, Mail, MapPin, Save, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Profile {
  full_name: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  zip_code: string
  cpf: string
}

export default function TutorPerfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    cpf: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/tutor/login'); return }

      setUserId(session.user.id)
      setProfile(p => ({ ...p, email: session.user.email || '' }))

      // Buscar perfil na tabela owners/profiles
      const { data } = await supabase
        .from('owners')
        .select('full_name, phone, address, city, state, zip_code, cpf')
        .eq('user_id', session.user.id)
        .single()

      if (data) {
        setProfile(prev => ({
          ...prev,
          full_name: data.full_name || session.user.user_metadata?.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          cpf: data.cpf || '',
        }))
      } else {
        setProfile(prev => ({
          ...prev,
          full_name: session.user.user_metadata?.full_name || '',
        }))
      }

      setLoading(false)
    }
    init()
  }, [router])

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    const supabase = createClient()

    const payload = {
      user_id: userId,
      full_name: profile.full_name,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      zip_code: profile.zip_code,
      cpf: profile.cpf,
    }

    await supabase.from('owners').upsert(payload, { onConflict: 'user_id' })

    // Atualizar metadados do auth
    await supabase.auth.updateUser({ data: { full_name: profile.full_name } })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const setField = (field: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile(p => ({ ...p, [field]: e.target.value }))

  return (
    <TutorLayout breadcrumbs={[{ label: 'Perfil' }]}>
      <div className="p-4 md:p-6 space-y-5 max-w-2xl">

        <div>
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gerencie suas informações pessoais</p>
        </div>

        {/* Avatar / Inicial */}
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 text-2xl font-bold">
              {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <p className="font-semibold text-lg">{profile.full_name || 'Seu Nome'}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-muted/40 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Dados pessoais */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="size-4 text-emerald-500" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input id="full_name" value={profile.full_name} onChange={setField('full_name')} className="mt-1" placeholder="Seu nome completo" />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input id="cpf" value={profile.cpf} onChange={setField('cpf')} className="mt-1" placeholder="000.000.000-00" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input id="phone" value={profile.phone} onChange={setField('phone')} className="mt-1" placeholder="(00) 00000-0000" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" value={profile.email} disabled className="mt-1 opacity-60 cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground mt-1">O e-mail não pode ser alterado aqui</p>
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="size-4 text-emerald-500" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" value={profile.address} onChange={setField('address')} className="mt-1" placeholder="Rua, número, complemento" />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" value={profile.city} onChange={setField('city')} className="mt-1" placeholder="Sua cidade" />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input id="state" value={profile.state} onChange={setField('state')} className="mt-1" placeholder="SP" maxLength={2} />
                </div>
                <div>
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input id="zip_code" value={profile.zip_code} onChange={setField('zip_code')} className="mt-1" placeholder="00000-000" />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {saved ? (
                <><CheckCircle2 className="size-4 mr-2" />Salvo com sucesso!</>
              ) : saving ? (
                'Salvando...'
              ) : (
                <><Save className="size-4 mr-2" />Salvar Perfil</>
              )}
            </Button>
          </>
        )}
      </div>
    </TutorLayout>
  )
}

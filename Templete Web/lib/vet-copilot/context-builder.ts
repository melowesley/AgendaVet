import { createServiceSupabaseClient } from '@/lib/supabase/service'

export const contextBuilder = {
  async build(
    petId: string,
    clinicId: string,
    userQuery?: string
  ): Promise<string> {
    const supabase = createServiceSupabaseClient()

    const [pet, observations, exams, vaccines, prescriptions, pathologies, weights] =
      await Promise.all([
        supabase
          .from('pets')
          .select('*, profiles:user_id(full_name, phone)')
          .eq('id', petId)
          .single(),
        supabase
          .from('pet_observations')
          .select('*')
          .eq('pet_id', petId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('pet_exams')
          .select('*')
          .eq('pet_id', petId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('pet_vaccines')
          .select('*')
          .eq('pet_id', petId)
          .order('created_at', { ascending: false }),
        supabase
          .from('pet_prescriptions')
          .select('*')
          .eq('pet_id', petId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('pet_pathologies')
          .select('*')
          .eq('pet_id', petId),
        supabase
          .from('pet_weight_records')
          .select('*')
          .eq('pet_id', petId)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

    const alerts = generateClinicalAlerts({
      vaccines: vaccines.data || [],
      prescriptions: prescriptions.data || [],
      weights: weights.data || [],
    })

    let ragContext = ''
    if (userQuery && userQuery.length > 10) {
      ragContext = await this.fetchRAGContext(userQuery, clinicId)
    }

    return formatContext({
      pet: pet.data,
      observations: observations.data || [],
      exams: exams.data || [],
      vaccines: vaccines.data || [],
      prescriptions: prescriptions.data || [],
      pathologies: pathologies.data || [],
      weights: weights.data || [],
      alerts,
      ragContext,
    })
  },

  async fetchRAGContext(query: string, clinicId: string): Promise<string> {
    try {
      const { google } = await import('@ai-sdk/google')
      const { embed } = await import('ai')

      const { embedding } = await embed({
        model: google.textEmbeddingModel('text-embedding-004'),
        value: query,
      })

      const supabase = createServiceSupabaseClient()
      const { data: chunks } = await (supabase as any).rpc('search_rag_chunks', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 3,
        filter_clinic_id: clinicId,
      })

      if (!chunks?.length) return ''

      return `\n## CONHECIMENTO RELEVANTE (RAG)\n${chunks
        .map(
          (c: any) =>
            `**[${c.source_type}] ${c.document_title}** (similaridade: ${(c.similarity * 100).toFixed(0)}%)\n${c.content}`
        )
        .join('\n---\n')}`
    } catch (error) {
      console.warn('[Context Builder] RAG fetch failed:', error)
      return ''
    }
  },
}

function formatContext(data: {
  pet: any
  observations: any[]
  exams: any[]
  vaccines: any[]
  prescriptions: any[]
  pathologies: any[]
  weights: any[]
  alerts: string[]
  ragContext: string
}): string {
  const {
    pet,
    observations,
    exams,
    vaccines,
    prescriptions,
    pathologies,
    alerts,
    ragContext,
  } = data
  if (!pet) return ''

  let ctx = `\n## CONTEXTO DO PACIENTE ATUAL\n`
  ctx += `Paciente: ${pet.name} | Especie: ${pet.type} | Raca: ${pet.breed || 'N/I'}`
  ctx += ` | Idade: ${pet.age || 'N/I'} | Peso: ${pet.weight || 'N/I'} kg\n`

  if (pet.profiles) {
    ctx += `Tutor: ${pet.profiles.full_name || 'N/I'}\n`
  }

  if (pathologies.length) {
    ctx += `\nPatologias: ${pathologies.map((p: any) => p.name).join(', ')}\n`
  }

  if (observations.length) {
    ctx += `\nUltimas observacoes:\n`
    observations.slice(0, 5).forEach((o: any) => {
      ctx += `- ${new Date(o.created_at).toLocaleDateString()}: ${o.observation?.substring(0, 200)}\n`
    })
  }

  if (prescriptions.length) {
    ctx += `\nPrescricoes recentes:\n`
    prescriptions.slice(0, 5).forEach((p: any) => {
      ctx += `- ${p.medication || p.name}: ${p.dosage} (${p.frequency})\n`
    })
  }

  if (exams.length) {
    ctx += `\nExames recentes:\n`
    exams.slice(0, 3).forEach((e: any) => {
      ctx += `- ${e.exam_type || e.name} (${new Date(e.created_at).toLocaleDateString()}): ${e.results?.substring(0, 150) || 'sem resultado'}\n`
    })
  }

  if (vaccines.length) {
    const pending = vaccines.filter(
      (v: any) => v.next_dose_date && new Date(v.next_dose_date) < new Date()
    )
    if (pending.length) {
      ctx += `\nVacinas ATRASADAS: ${pending.map((v: any) => v.vaccine_name || v.name).join(', ')}\n`
    }
  }

  if (alerts.length) {
    ctx += `\nALERTAS CLINICOS:\n`
    alerts.forEach((a: string) => (ctx += `- ${a}\n`))
  }

  if (ragContext) ctx += ragContext

  return ctx
}

function generateClinicalAlerts(data: {
  vaccines: any[]
  prescriptions: any[]
  weights: any[]
}): string[] {
  const alerts: string[] = []
  const today = new Date()

  data.vaccines.forEach((v) => {
    if (v.next_dose_date && new Date(v.next_dose_date) < today) {
      alerts.push(
        `Vacina ${v.vaccine_name || v.name} ATRASADA (prevista: ${v.next_dose_date})`
      )
    }
  })

  const activeMeds = data.prescriptions.filter((p) => {
    const created = new Date(p.created_at)
    const diff = (today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    return diff < 30
  })
  if (activeMeds.length >= 3) {
    alerts.push(
      `${activeMeds.length} medicacoes ativas simultaneamente — verificar interacoes`
    )
  }

  if (data.weights.length >= 2) {
    const latest = parseFloat(data.weights[0].weight)
    const previous = parseFloat(data.weights[1].weight)
    if (latest && previous) {
      const variation = Math.abs((latest - previous) / previous) * 100
      if (variation > 10) {
        alerts.push(
          `Variacao de peso significativa: ${variation.toFixed(1)}% (${previous}kg -> ${latest}kg)`
        )
      }
    }
  }

  return alerts
}

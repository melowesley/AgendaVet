import { createServiceSupabaseClient } from '../../../supabase/service'
import { google } from '@ai-sdk/google'
import { embed } from 'ai'

const CHUNK_SIZE = 800
const CHUNK_OVERLAP = 100

export const ragModule = {
  async ingestDocument(params: {
    clinicId?: string
    title: string
    content: string
    sourceType: 'protocol' | 'literature' | 'drug_reference' | 'clinical_doc'
    sourceUrl?: string
    metadata?: Record<string, any>
  }): Promise<string> {
    const supabase = createServiceSupabaseClient()

    const { data: doc } = await (supabase
      .from('rag_documents') as any)
      .insert({
        clinic_id: params.clinicId || null,
        title: params.title,
        source_type: params.sourceType,
        source_url: params.sourceUrl || null,
        status: 'processing',
        metadata: params.metadata || {},
      })
      .select('id')
      .single()

    if (!doc) throw new Error('Failed to create document')

    try {
      const chunks = chunkText(params.content)

      for (let i = 0; i < chunks.length; i++) {
        const { embedding } = await embed({
          model: google.textEmbeddingModel('text-embedding-004'),
          value: chunks[i],
        })

        await (supabase.from('rag_chunks') as any).insert({
          document_id: doc.id,
          clinic_id: params.clinicId || null,
          content: chunks[i],
          embedding,
          chunk_index: i,
          metadata: { title: params.title, source_type: params.sourceType },
        })
      }

      await (supabase
        .from('rag_documents') as any)
        .update({ status: 'ready', chunk_count: chunks.length })
        .eq('id', doc.id)

      return doc.id
    } catch (error) {
      await (supabase
        .from('rag_documents') as any)
        .update({ status: 'error', metadata: { error: String(error) } })
        .eq('id', doc.id)
      throw error
    }
  },

  async search(
    query: string,
    clinicId?: string,
    opts?: { threshold?: number; limit?: number }
  ) {
    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-004'),
      value: query,
    })

    const supabase = createServiceSupabaseClient()
    const { data } = await (supabase as any).rpc('search_rag_chunks', {
      query_embedding: embedding,
      match_threshold: opts?.threshold || 0.7,
      match_count: opts?.limit || 5,
      filter_clinic_id: clinicId || null,
    })

    return data || []
  },

  async deleteDocument(documentId: string): Promise<void> {
    const supabase = createServiceSupabaseClient()
    await (supabase.from('rag_documents') as any).delete().eq('id', documentId)
  },

  async listDocuments(clinicId?: string) {
    const supabase = createServiceSupabaseClient()
    let query: any = (supabase
      .from('rag_documents') as any)
      .select('id, title, source_type, status, chunk_count, created_at')
      .order('created_at', { ascending: false })

    if (clinicId) {
      query = query.or(`clinic_id.eq.${clinicId},clinic_id.is.null`)
    } else {
      query = query.is('clinic_id', null)
    }

    const { data } = await query
    return data || []
  },
}

function chunkText(text: string): string[] {
  const chunks: string[] = []
  const sentences = text.split(/(?<=[.!?\n])\s+/)
  let current = ''

  for (const sentence of sentences) {
    if ((current + sentence).length > CHUNK_SIZE && current.length > 0) {
      chunks.push(current.trim())
      const overlap = current.slice(-CHUNK_OVERLAP)
      current = overlap + ' ' + sentence
    } else {
      current += (current ? ' ' : '') + sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())

  return chunks
}

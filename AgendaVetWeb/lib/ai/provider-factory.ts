/**
 * Unified AI Provider Factory
 *
 * Single source of truth for all AI model instantiation.
 * All API routes and tools should use this factory instead of
 * initializing providers directly.
 *
 * Wraps the vet-copilot AI Gateway to ensure consistent configuration
 * across the entire application.
 */

export { MODEL_CATALOG, aiGateway } from '@/lib/vet-copilot/ai-gateway'

/**
 * Convenience re-export so callers don't need to reach into vet-copilot internals.
 * Import this in API routes:
 *
 * import { aiGateway } from '@/lib/ai/provider-factory'
 * const { model } = await aiGateway.selectModelWithRetry(modelKey)
 */

import { contextBuilder as _contextBuilder } from '../vet-copilot/context-builder'

export const contextBuilder = {
  async build(petId: string, clinicId?: string, userQuery?: string): Promise<string> {
    return _contextBuilder.build(petId, clinicId || '', userQuery)
  },
}

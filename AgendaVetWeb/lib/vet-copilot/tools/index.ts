import { readTools } from './read-tools'
import { calculateTools } from './calculate-tools'
import { searchTools } from './search-tools'
import { writeTools } from './write-tools'

export const allTools = {
  ...readTools,
  ...calculateTools,
  ...searchTools,
  ...writeTools,
}

export const readOnlyTools = {
  ...readTools,
  ...calculateTools,
  ...searchTools,
}

export { readTools, calculateTools, searchTools, writeTools }

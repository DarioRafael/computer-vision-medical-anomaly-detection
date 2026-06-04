// Re-exports del cliente del modelo.

export { predecirRadiografia, ModeloError } from './client'
export { detectarPatologias } from './deteccion'
export { segmentarPulmones } from './segmentacion'
export { analizarIntegrado } from './analisis-integrado'
export type { FastAPIPredictResponse, FastAPIDetectResponse, FastAPIDeteccionCaja, FastAPISegmentResponse, FastAPIIntegradoResponse } from './tipos'

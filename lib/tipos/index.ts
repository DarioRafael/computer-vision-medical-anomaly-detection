// Re-exporta todos los tipos de dominio.
// Añade la línea de documento al index existente.

export type { ResultadoAnalisis, InformeAnalisis, Severidad, PatologiaRelevante } from './resultado'
export type { ResultadoDeteccion, CajaDeteccion } from './resultado'
export type { ResultadoSegmentacion } from './resultado'
export type {
    ResultadoIntegrado, VeredictoIntegrado, PatologiaProbable, HallazgoLocalizado,
} from './resultado'
export type { Estudio, EstudioNuevo } from './estudio'
export type { Paciente } from './paciente'
export type { Usuario } from './usuario'
export type { DocumentoExportado, TipoDocumento } from './documento'
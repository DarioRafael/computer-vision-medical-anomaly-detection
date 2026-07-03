// Tipos del contrato con el backend FastAPI.
// Estas shapes coinciden exactamente con lo que devuelve el endpoint /predict.

/**
 * Respuesta cruda de FastAPI /predict.
 * No lo consumas desde la UI directamente — usa `aInforme()` para
 * convertirlo en un `InformeAnalisis` tipado con porcentajes.
 */
export interface FastAPIPredictResponse {
    readonly cancer_probability: number
    readonly cancer_result: string
    readonly pathologies: Readonly<Record<string, number>>
    readonly gradcam_image?: string
    /** Grad-CAM por clase (multilabel): { etiqueta_es: base64 }. */
    readonly gradcams_por_clase?: Readonly<Record<string, string>>
}

/**
 * Una caja del sistema de detección (endpoint /deteccion/detectar).
 * Shape cruda de FastAPI — snake_case. `xyxy` está en PÍXELES de la imagen
 * que se subió: [x1, y1, x2, y2].
 */
export interface FastAPIDeteccionCaja {
    readonly clase: string
    readonly clase_es: string
    readonly conf: number
    readonly xyxy: readonly [number, number, number, number]
}

/**
 * Respuesta cruda de FastAPI /deteccion/detectar (pipeline de 2 etapas:
 * filtro binario sano/anormal + detector YOLO). No la consumas directo desde
 * la UI — `detectarPatologias()` la normaliza a `ResultadoDeteccion`.
 */
export interface FastAPIDetectResponse {
    readonly es_anormal: boolean
    readonly prob_filtro: number
    readonly detecciones: readonly FastAPIDeteccionCaja[]
    readonly n_hallazgos: number
    readonly resumen: string
    readonly tiempo_procesamiento_ms: number
}

/**
 * Respuesta cruda de FastAPI /segmentacion/segmentar (U-Net de campos pulmonares).
 * `mascara_png` es un PNG RGBA en base64 (sin prefijo data:) escalado al tamaño
 * original, listo para superponer sobre la radiografía.
 */
export interface FastAPISegmentResponse {
    readonly mascara_png: string
    readonly ancho: number
    readonly alto: number
    readonly area_pulmon_pct: number
    readonly resumen: string
    readonly tiempo_procesamiento_ms: number
}

// ── ANÁLISIS INTEGRADO (/analisis-integrado/analizar) ──

export interface FastAPIVeredicto {
    readonly es_anormal: boolean
    readonly probabilidad: number
    readonly nivel: string  // "bajo" | "moderado" | "alto"
}

export interface FastAPIPatologiaProbable {
    readonly clase: string
    readonly clase_es: string
    readonly prob: number
}

export interface FastAPIHallazgoLocalizado {
    readonly clase: string
    readonly clase_es: string
    readonly conf: number
    readonly xyxy: readonly [number, number, number, number]
    readonly ubicacion: string
    readonly coherencia: string  // "ubicación esperada" | "ubicación atípica" | "no evaluable"
}

/** Coherencia atención del clasificador (Grad-CAM) ↔ cajas del detector. */
export interface FastAPICoherencia {
    readonly disponible: boolean
    readonly score_global: number
    readonly pct_calor_en_cajas: number
    readonly n_cajas: number
    readonly n_concuerdan: number
}

/**
 * Respuesta cruda de FastAPI /analisis-integrado/analizar: reporte unificado
 * que teje clasificación + multilabel + detección + segmentación.
 */
export interface FastAPIIntegradoResponse {
    readonly veredicto: FastAPIVeredicto
    readonly patologias_probables: readonly FastAPIPatologiaProbable[]
    readonly hallazgos_localizados: readonly FastAPIHallazgoLocalizado[]
    readonly contexto_anatomico: { readonly area_pulmon_pct: number }
    readonly resumen_texto: string
    readonly mascara_png: string
    readonly avisos: readonly string[]
    readonly tiempo_procesamiento_ms: number
    readonly coherencia?: FastAPICoherencia | null
}

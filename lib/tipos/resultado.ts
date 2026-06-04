// Resultado de un análisis del modelo de visión.
// Estos tipos son el "contrato" con el backend FastAPI — si el API cambia,
// los ajustes se hacen aquí y TypeScript propaga los errores al resto.

/**
 * Entrada del diccionario de patologías detectadas por el modelo.
 * El modelo devuelve probabilidades (0..1) para cada patología conocida.
 */
export type PatologiasDetectadas = Readonly<Record<string, number>>

/**
 * Resultado crudo devuelto por FastAPI tras analizar una radiografía.
 * No contiene lógica de negocio — es el DTO directo.
 */
export interface ResultadoAnalisis {
    /** Probabilidad 0..1 de hallazgo compatible con carcinoma. */
    readonly probabilidadCarcinoma: number
    /** Etiqueta textual devuelta por el modelo (ej: "Masa (posible tumor)"). */
    readonly etiquetaCarcinoma: string
    /** Probabilidades por patología conocida. */
    readonly patologias: PatologiasDetectadas
    /** Imagen Grad-CAM en base64 (sin prefijo data:), si el modelo la devolvió. */
    readonly gradcamBase64?: string
}

/**
 * Resultado normalizado para consumir desde la UI, enriquecido con
 * valores derivados (porcentajes redondeados, severidad, etc.).
 */
export interface InformeAnalisis extends ResultadoAnalisis {
    /** Porcentaje entero 0..100 para mostrar en tarjetas. */
    readonly porcentajeCarcinoma: number
    /** Patologías relevantes (por encima del umbral) ordenadas desc. */
    readonly patologiasRelevantes: readonly PatologiaRelevante[]
    /** Severidad cualitativa calculada en base a los umbrales. */
    readonly severidad: Severidad
}

export interface PatologiaRelevante {
    readonly nombre: string
    readonly probabilidad: number
    readonly porcentaje: number
}

/**
 * Severidad derivada del resultado. No sustituye el juicio médico; es solo
 * una etiqueta para colorear UI y priorizar revisión.
 */
export type Severidad = 'baja' | 'media' | 'alta'

// ── Sistema de DETECCIÓN (pipeline de 2 etapas: filtro + YOLO) ──
// Es un modelo DISTINTO del clasificador: detecta y localiza patologías con
// cajas (bounding boxes), no calcula la probabilidad de carcinoma.

/**
 * Caja de detección normalizada para la UI.
 * `xyxy` está en PÍXELES de la imagen analizada: [x1, y1, x2, y2].
 */
export interface CajaDeteccion {
    /** Nombre de la clase (inglés, tal cual del modelo). */
    readonly clase: string
    /** Nombre de la clase en español, para mostrar al usuario. */
    readonly claseEs: string
    /** Confianza 0..1 de la detección. */
    readonly confianza: number
    /** Coordenadas [x1, y1, x2, y2] en píxeles de la imagen original. */
    readonly xyxy: readonly [number, number, number, number]
}

/**
 * Resultado normalizado del sistema de detección de 2 etapas.
 * Si `esAnormal` es false, el filtro descartó la imagen y `cajas` va vacío.
 */
export interface ResultadoDeteccion {
    readonly esAnormal: boolean
    /** Probabilidad 0..1 del filtro binario sano/anormal. */
    readonly probFiltro: number
    readonly cajas: readonly CajaDeteccion[]
    readonly numHallazgos: number
    /** Resumen textual que devuelve el backend (ej: "ANORMAL (prob 0.87) -> 1 hallazgo(s)"). */
    readonly resumen: string
    readonly tiempoMs: number
}

// ── Sistema de SEGMENTACIÓN (U-Net de campos pulmonares) ──
// Otro modelo independiente: delinea los pulmones (anatomía), no lesiones.

/**
 * Resultado normalizado de la segmentación de campos pulmonares.
 * `mascaraPng` es un PNG RGBA en base64 (sin prefijo data:) ya escalado al
 * tamaño de la imagen original, para superponerlo directamente.
 */
export interface ResultadoSegmentacion {
    /** PNG RGBA en base64 (sin prefijo `data:`). Vacío si no hubo máscara. */
    readonly mascaraPng: string
    /** Ancho/alto de la imagen original (px). */
    readonly ancho: number
    readonly alto: number
    /** Porcentaje del área de la imagen ocupada por pulmón. */
    readonly areaPulmonPct: number
    readonly resumen: string
    readonly tiempoMs: number
}

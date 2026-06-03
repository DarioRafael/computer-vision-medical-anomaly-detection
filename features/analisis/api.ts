// Cliente del endpoint /api/analyze.
// Envía una imagen al backend y recibe el informe de análisis.

import type { InformeAnalisis, ResultadoDeteccion } from '@/lib/tipos'

export interface RespuestaAnalisis {
    readonly informe: InformeAnalisis
    readonly gradcamBase64?: string
}

/**
 * Envía una imagen al endpoint de análisis y devuelve el informe procesado.
 */
export async function analizarImagen(
    archivo: File,
): Promise<RespuestaAnalisis> {
    const formData = new FormData()
    formData.append('file', archivo)

    const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
    })

    if (!res.ok) {
        const texto = await res.text().catch(() => 'Error desconocido')
        throw new Error(`Error ${res.status}: ${texto}`)
    }

    return (await res.json()) as RespuestaAnalisis
}

/**
 * Envía una imagen al endpoint de DETECCIÓN y devuelve las cajas detectadas.
 * Independiente de `analizarImagen`: usa el sistema de detección de 2 etapas.
 */
export async function detectarImagen(
    archivo: Blob,
    nombreArchivo = 'radiografia.png',
): Promise<ResultadoDeteccion> {
    const formData = new FormData()
    formData.append('file', archivo, nombreArchivo)

    const res = await fetch('/api/detect', {
        method: 'POST',
        body: formData,
    })

    if (!res.ok) {
        const texto = await res.text().catch(() => 'Error desconocido')
        throw new Error(`Error ${res.status}: ${texto}`)
    }

    return (await res.json()) as ResultadoDeteccion
}

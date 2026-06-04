// Cliente tipado del sistema de SEGMENTACIÓN de FastAPI (/segmentacion/segmentar).
// Espejo de deteccion.ts: misma URL base y misma clase de error.

import type { ResultadoSegmentacion } from '@/lib/tipos'
import type { FastAPISegmentResponse } from './tipos'
import { ModeloError } from './client'

const FASTAPI_URL = process.env.FASTAPI_URL ?? 'http://localhost:8000'

/**
 * Llama al endpoint `/segmentacion/segmentar` de FastAPI con una imagen y
 * devuelve el resultado ya normalizado al tipo `ResultadoSegmentacion`.
 */
export async function segmentarPulmones(
    imagen: Blob,
    nombreArchivo: string,
): Promise<ResultadoSegmentacion> {
    const formData = new FormData()
    formData.append('file', imagen, nombreArchivo)

    let res: Response
    try {
        res = await fetch(`${FASTAPI_URL}/segmentacion/segmentar`, { method: 'POST', body: formData })
    } catch (err) {
        throw new ModeloError(
            'sin_conexion',
            `No se pudo conectar con FastAPI en ${FASTAPI_URL}: ${String(err)}`,
        )
    }

    if (!res.ok) {
        const texto = await res.text().catch(() => '(sin cuerpo)')
        throw new ModeloError('error_remoto', `FastAPI respondió ${res.status}: ${texto}`)
    }

    let data: FastAPISegmentResponse
    try {
        data = (await res.json()) as FastAPISegmentResponse
    } catch {
        throw new ModeloError('respuesta_invalida', 'FastAPI devolvió JSON inválido.')
    }

    // Validación mínima de shape — si el contrato cambia queremos un error claro.
    if (typeof data.mascara_png !== 'string') {
        throw new ModeloError('respuesta_invalida', 'Respuesta de segmentación sin campos esperados.')
    }

    return {
        mascaraPng: data.mascara_png,
        ancho: typeof data.ancho === 'number' ? data.ancho : 0,
        alto: typeof data.alto === 'number' ? data.alto : 0,
        areaPulmonPct: typeof data.area_pulmon_pct === 'number' ? data.area_pulmon_pct : 0,
        resumen: data.resumen ?? '',
        tiempoMs: typeof data.tiempo_procesamiento_ms === 'number' ? data.tiempo_procesamiento_ms : 0,
    }
}

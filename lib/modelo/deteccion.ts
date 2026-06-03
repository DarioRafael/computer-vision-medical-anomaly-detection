// Cliente tipado del sistema de DETECCIÓN de FastAPI (/deteccion/detectar).
// Espejo de client.ts pero para el pipeline de 2 etapas (filtro + YOLO).
// Reusa la misma URL base y la misma clase de error que el clasificador.

import type { ResultadoDeteccion } from '@/lib/tipos'
import type { FastAPIDetectResponse } from './tipos'
import { ModeloError } from './client'

const FASTAPI_URL = process.env.FASTAPI_URL ?? 'http://localhost:8000'

/**
 * Llama al endpoint `/deteccion/detectar` de FastAPI con una imagen y devuelve
 * el resultado ya normalizado al tipo `ResultadoDeteccion` del dominio.
 */
export async function detectarPatologias(
    imagen: Blob,
    nombreArchivo: string,
): Promise<ResultadoDeteccion> {
    const formData = new FormData()
    formData.append('file', imagen, nombreArchivo)

    let res: Response
    try {
        res = await fetch(`${FASTAPI_URL}/deteccion/detectar`, { method: 'POST', body: formData })
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

    let data: FastAPIDetectResponse
    try {
        data = (await res.json()) as FastAPIDetectResponse
    } catch {
        throw new ModeloError('respuesta_invalida', 'FastAPI devolvió JSON inválido.')
    }

    // Validación mínima de shape — si el contrato cambia queremos un error claro.
    if (typeof data.es_anormal !== 'boolean' || !Array.isArray(data.detecciones)) {
        throw new ModeloError('respuesta_invalida', 'Respuesta de detección sin campos esperados.')
    }

    return {
        esAnormal: data.es_anormal,
        probFiltro: typeof data.prob_filtro === 'number' ? data.prob_filtro : 0,
        numHallazgos: typeof data.n_hallazgos === 'number' ? data.n_hallazgos : data.detecciones.length,
        resumen: data.resumen ?? '',
        tiempoMs: typeof data.tiempo_procesamiento_ms === 'number' ? data.tiempo_procesamiento_ms : 0,
        cajas: data.detecciones.map((d) => ({
            clase: d.clase,
            claseEs: d.clase_es ?? d.clase,
            confianza: d.conf,
            xyxy: d.xyxy,
        })),
    }
}

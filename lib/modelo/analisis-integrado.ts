// Cliente tipado del ANÁLISIS INTEGRADO de FastAPI (/analisis-integrado/analizar).
// Espejo de deteccion.ts / segmentacion.ts: misma URL base y misma clase de error.

import type { ResultadoIntegrado } from '@/lib/tipos'
import type { FastAPIIntegradoResponse } from './tipos'
import { ModeloError } from './client'

const FASTAPI_URL = process.env.FASTAPI_URL ?? 'http://localhost:8000'

/**
 * Llama a `/analisis-integrado/analizar` con una imagen y devuelve el reporte
 * unificado normalizado al tipo `ResultadoIntegrado` del dominio.
 */
export async function analizarIntegrado(
    imagen: Blob,
    nombreArchivo: string,
): Promise<ResultadoIntegrado> {
    const formData = new FormData()
    formData.append('file', imagen, nombreArchivo)

    let res: Response
    try {
        res = await fetch(`${FASTAPI_URL}/analisis-integrado/analizar`, { method: 'POST', body: formData })
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

    let data: FastAPIIntegradoResponse
    try {
        data = (await res.json()) as FastAPIIntegradoResponse
    } catch {
        throw new ModeloError('respuesta_invalida', 'FastAPI devolvió JSON inválido.')
    }

    if (!data.veredicto || typeof data.resumen_texto !== 'string') {
        throw new ModeloError('respuesta_invalida', 'Respuesta integrada sin campos esperados.')
    }

    return {
        veredicto: {
            esAnormal: !!data.veredicto.es_anormal,
            probabilidad: typeof data.veredicto.probabilidad === 'number' ? data.veredicto.probabilidad : 0,
            nivel: data.veredicto.nivel ?? 'bajo',
        },
        patologiasProbables: (data.patologias_probables ?? []).map((p) => ({
            clase: p.clase,
            claseEs: p.clase_es ?? p.clase,
            prob: p.prob,
        })),
        hallazgosLocalizados: (data.hallazgos_localizados ?? []).map((h) => ({
            clase: h.clase,
            claseEs: h.clase_es ?? h.clase,
            confianza: h.conf,
            xyxy: h.xyxy,
            ubicacion: h.ubicacion ?? '',
            coherencia: h.coherencia ?? '',
        })),
        areaPulmonPct: data.contexto_anatomico?.area_pulmon_pct ?? 0,
        resumenTexto: data.resumen_texto ?? '',
        mascaraPng: data.mascara_png ?? '',
        avisos: data.avisos ?? [],
        tiempoMs: typeof data.tiempo_procesamiento_ms === 'number' ? data.tiempo_procesamiento_ms : 0,
    }
}

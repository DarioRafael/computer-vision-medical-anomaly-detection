'use client'

// Hook que ejecuta la SEGMENTACIÓN de pulmones sobre la misma imagen analizada.
// Igual que use-deteccion: se dispara al montar, no bloquea el informe y maneja
// su propio estado (cargando / listo / error).

import { useState, useEffect } from 'react'
import { segmentarImagen } from '../api'
import type { ResultadoSegmentacion } from '@/lib/tipos'

export type EstadoSegmentacion =
    | { estado: 'cargando' }
    | { estado: 'listo'; datos: ResultadoSegmentacion }
    | { estado: 'error'; mensaje: string }

/** Convierte un data URL (data:image/...;base64,...) a Blob para reenviarlo. */
async function dataUrlABlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl)
    return await res.blob()
}

/**
 * Ejecuta la segmentación para `imagenDataUrl`. Devuelve el estado reactivo.
 * Cancela actualizaciones si la imagen cambia o el componente se desmonta.
 */
export function useSegmentacion(imagenDataUrl: string, nombreArchivo = 'radiografia.png'): EstadoSegmentacion {
    const [estado, setEstado] = useState<EstadoSegmentacion>({ estado: 'cargando' })

    useEffect(() => {
        let cancelado = false
        // El estado inicial ya es 'cargando' y el informe re-monta este componente
        // en cada análisis/estudio, así que no hace falta resetear de forma síncrona.

        void (async () => {
            try {
                if (!imagenDataUrl) {
                    throw new Error('No hay imagen disponible para este estudio.')
                }
                const blob = await dataUrlABlob(imagenDataUrl)
                const datos = await segmentarImagen(blob, nombreArchivo)
                if (!cancelado) setEstado({ estado: 'listo', datos })
            } catch (err) {
                if (!cancelado) {
                    setEstado({
                        estado: 'error',
                        mensaje: err instanceof Error ? err.message : 'Error al ejecutar la segmentación.',
                    })
                }
            }
        })()

        return () => {
            cancelado = true
        }
    }, [imagenDataUrl, nombreArchivo])

    return estado
}

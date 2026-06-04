'use client'

// Hook del ANÁLISIS INTEGRADO. A diferencia de detección/segmentación (que se
// disparan al montar), este es LAZY: corre los 4 modelos en el backend, así que
// solo se lanza cuando `habilitado` pasa a true (al abrir la pestaña Integrado).
// Una vez lanzado, persiste el resultado aunque cambies de pestaña.

import { useState, useEffect } from 'react'
import { analizarIntegrado } from '../api'
import type { ResultadoIntegrado } from '@/lib/tipos'

export type EstadoIntegrado =
    | { estado: 'inactivo' }
    | { estado: 'cargando' }
    | { estado: 'listo'; datos: ResultadoIntegrado }
    | { estado: 'error'; mensaje: string }

/** Convierte un data URL (data:image/...;base64,...) a Blob para reenviarlo. */
async function dataUrlABlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl)
    return await res.blob()
}

export function useAnalisisIntegrado(
    imagenDataUrl: string,
    habilitado: boolean,
    nombreArchivo = 'radiografia.png',
): EstadoIntegrado {
    const [estado, setEstado] = useState<EstadoIntegrado>({ estado: 'inactivo' })

    useEffect(() => {
        if (!habilitado) return
        let cancelado = false

        void (async () => {
            setEstado({ estado: 'cargando' })
            try {
                if (!imagenDataUrl) {
                    throw new Error('No hay imagen disponible para este estudio.')
                }
                const blob = await dataUrlABlob(imagenDataUrl)
                const datos = await analizarIntegrado(blob, nombreArchivo)
                if (!cancelado) setEstado({ estado: 'listo', datos })
            } catch (err) {
                if (!cancelado) {
                    setEstado({
                        estado: 'error',
                        mensaje: err instanceof Error ? err.message : 'Error al ejecutar el análisis integrado.',
                    })
                }
            }
        })()

        return () => {
            cancelado = true
        }
    }, [imagenDataUrl, habilitado, nombreArchivo])

    return estado
}

'use client'

// Hook que ejecuta el sistema de DETECCIÓN sobre la misma imagen analizada.
// Se dispara automáticamente al montar (cuando ya hay un informe) y mantiene
// su propio estado (cargando / listo / error) para NO bloquear ni romper el
// flujo del clasificador: el informe se muestra aunque la detección falle.

import { useState, useEffect } from 'react'
import { detectarImagen } from '../api'
import type { ResultadoDeteccion } from '@/lib/tipos'

export type EstadoDeteccion =
    | { estado: 'cargando' }
    | { estado: 'listo'; datos: ResultadoDeteccion }
    | { estado: 'error'; mensaje: string }

/** Convierte un data URL (data:image/...;base64,...) a Blob para reenviarlo. */
async function dataUrlABlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl)
    return await res.blob()
}

/**
 * Ejecuta la detección para `imagenDataUrl`. Devuelve el estado reactivo.
 * Cancela actualizaciones si la imagen cambia o el componente se desmonta.
 */
export function useDeteccion(imagenDataUrl: string, nombreArchivo = 'radiografia.png'): EstadoDeteccion {
    const [estado, setEstado] = useState<EstadoDeteccion>({ estado: 'cargando' })

    useEffect(() => {
        let cancelado = false
        // No reseteamos a 'cargando' de forma síncrona aquí (provocaría setState
        // síncrono en el efecto): el estado inicial ya es 'cargando' y el informe
        // re-monta este componente en cada análisis/estudio, así que siempre
        // arranca en ese estado.

        void (async () => {
            try {
                if (!imagenDataUrl) {
                    // Los estudios guardados muy antiguos pueden perder su imagen
                    // si el navegador liberó espacio (cuota de localStorage).
                    throw new Error('No hay imagen disponible para este estudio.')
                }
                const blob = await dataUrlABlob(imagenDataUrl)
                const datos = await detectarImagen(blob, nombreArchivo)
                if (!cancelado) setEstado({ estado: 'listo', datos })
            } catch (err) {
                if (!cancelado) {
                    setEstado({
                        estado: 'error',
                        mensaje: err instanceof Error ? err.message : 'Error al ejecutar la detección.',
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

'use client'

// Visor de imagen a pantalla completa con zoom y desplazamiento (lightbox).
// Se abre al hacer clic en la radiografía o en el botón "Ampliar".
//  - Rueda del ratón o botones +/- para acercar/alejar.
//  - Arrastrar para mover cuando está ampliada.
//  - Esc o clic en el fondo para cerrar.

import { useEffect, useRef, useState } from 'react'

interface ImagenZoomProps {
    readonly src: string
    readonly alt?: string
    readonly onClose: () => void
}

function BotonControl({ onClick, titulo, children }: { onClick: () => void; titulo: string; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            title={titulo}
            aria-label={titulo}
            style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'rgba(20,30,42,0.85)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#e8f0f7', cursor: 'pointer', fontSize: 16, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
        >
            {children}
        </button>
    )
}

export function ImagenZoom({ src, alt = 'Radiografía', onClose }: ImagenZoomProps) {
    const [escala, setEscala] = useState(1)
    const [pos, setPos] = useState({ x: 0, y: 0 })
    const arrastre = useRef<{ x: number; y: number } | null>(null)
    const [arrastrando, setArrastrando] = useState(false)

    // Cerrar con Esc y bloquear el scroll del fondo mientras está abierto.
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            window.removeEventListener('keydown', onKey)
            document.body.style.overflow = prev
        }
    }, [onClose])

    function ajustarZoom(delta: number) {
        setEscala((s) => {
            const nueva = Math.min(6, Math.max(1, +(s + delta).toFixed(2)))
            if (nueva === 1) setPos({ x: 0, y: 0 })
            return nueva
        })
    }

    function restablecer() {
        setEscala(1)
        setPos({ x: 0, y: 0 })
    }

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(3,7,14,0.93)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
            }}
        >
            {/* Controles */}
            <div
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 8, zIndex: 2 }}
            >
                <BotonControl onClick={() => ajustarZoom(-0.5)} titulo="Alejar">−</BotonControl>
                <span style={{
                    minWidth: 52, height: 34, padding: '0 8px', borderRadius: 8,
                    background: 'rgba(20,30,42,0.85)', border: '1px solid rgba(255,255,255,0.15)',
                    color: '#e8f0f7', fontFamily: 'var(--mono)', fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {Math.round(escala * 100)}%
                </span>
                <BotonControl onClick={() => ajustarZoom(0.5)} titulo="Acercar">+</BotonControl>
                <BotonControl onClick={restablecer} titulo="Restablecer">⟳</BotonControl>
                <BotonControl onClick={onClose} titulo="Cerrar">✕</BotonControl>
            </div>

            <span style={{
                position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(255,255,255,0.5)',
            }}>
                Rueda para zoom · arrastra para mover · Esc para cerrar
            </span>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                draggable={false}
                onClick={(e) => e.stopPropagation()}
                onWheel={(e) => ajustarZoom(e.deltaY < 0 ? 0.35 : -0.35)}
                onMouseDown={(e) => {
                    if (escala <= 1) return
                    arrastre.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
                    setArrastrando(true)
                }}
                onMouseMove={(e) => {
                    if (arrastre.current) setPos({ x: e.clientX - arrastre.current.x, y: e.clientY - arrastre.current.y })
                }}
                onMouseUp={() => { arrastre.current = null; setArrastrando(false) }}
                onMouseLeave={() => { arrastre.current = null; setArrastrando(false) }}
                style={{
                    maxWidth: '92vw', maxHeight: '90vh',
                    transform: `translate(${pos.x}px, ${pos.y}px) scale(${escala})`,
                    transition: arrastrando ? 'none' : 'transform 0.12s ease',
                    cursor: escala > 1 ? (arrastrando ? 'grabbing' : 'grab') : 'zoom-in',
                    userSelect: 'none', borderRadius: 8,
                    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                }}
            />
        </div>
    )
}

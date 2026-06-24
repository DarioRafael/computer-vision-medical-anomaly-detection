'use client'

// Vista del sistema de DETECCIÓN: dibuja las cajas (bounding boxes) sobre la
// radiografía original. Es una vista SEPARADA del Grad-CAM a propósito —
// son dos modelos distintos y no deben mezclarse en la misma imagen.
//
// Escalado de las cajas: `xyxy` viene en píxeles de la imagen original. La
// imagen se renderiza con `width: 100%` (tamaño variable), así que convertimos
// cada coordenada a PORCENTAJE de las dimensiones naturales. El porcentaje se
// reescala solo con el tamaño renderizado → las cajas siempre caen en su sitio,
// sin necesidad de medir píxeles en pantalla ni escuchar resizes.

import { useState } from 'react'
import type { EstadoDeteccion } from '../hooks/use-deteccion'
import { colorEspecialista } from '../especialistas'

interface DeteccionVistaProps {
    readonly estado: EstadoDeteccion
    readonly imagenDataUrl: string
}

const captionStyle: React.CSSProperties = {
    fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)',
    marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase',
}

export function DeteccionVista({ estado, imagenDataUrl }: DeteccionVistaProps) {
    // Dimensiones naturales de la imagen, para escalar las cajas a porcentajes.
    const [dims, setDims] = useState<{ w: number; h: number } | null>(null)

    const cajas = estado.estado === 'listo' ? estado.datos.cajas : []
    const hayCajas = cajas.length > 0
    const sinHallazgos = estado.estado === 'listo' && (!estado.datos.esAnormal || !hayCajas)

    return (
        <div>
            <style>{`@keyframes pulmia-det-spin { to { transform: rotate(360deg); } }`}</style>

            <div style={captionStyle}>
                Detección — localización de hallazgos (modelo detector)
            </div>

            {/* Lienzo: imagen + capa de cajas */}
            <div style={{
                position: 'relative', width: '100%',
                borderRadius: 12, overflow: 'hidden',
                border: '1px solid var(--border)', background: 'var(--bg-2)',
                lineHeight: 0,
            }}>
                <img
                    src={imagenDataUrl}
                    alt="Radiografía con detecciones"
                    onLoad={(e) => {
                        const img = e.currentTarget
                        setDims({ w: img.naturalWidth, h: img.naturalHeight })
                    }}
                    style={{
                        width: '100%', height: 'auto', display: 'block',
                        // Atenuamos un poco la imagen mientras carga la detección.
                        filter: estado.estado === 'cargando' ? 'brightness(0.55) saturate(0.6)' : 'none',
                        transition: 'filter 0.3s ease',
                    }}
                />

                {/* Capa de cajas (solo cuando hay resultado y conocemos las dims) */}
                {estado.estado === 'listo' && dims && hayCajas && cajas.map((caja, i) => {
                    const [x1, y1, x2, y2] = caja.xyxy
                    const leftPct = (x1 / dims.w) * 100
                    const topPct = (y1 / dims.h) * 100
                    const widthPct = ((x2 - x1) / dims.w) * 100
                    const heightPct = ((y2 - y1) / dims.h) * 100
                    // Color por origen: especialista (propio) o detector general (teal actual).
                    const colorEsp = colorEspecialista(caja.clase)
                    return (
                        <div
                            key={`${caja.clase}-${i}`}
                            style={{
                                position: 'absolute',
                                left: `${leftPct}%`, top: `${topPct}%`,
                                width: `${widthPct}%`, height: `${heightPct}%`,
                                border: `2px solid ${colorEsp ?? 'var(--accent)'}`,
                                borderRadius: 3,
                                background: colorEsp ? 'transparent' : 'rgba(20,184,166,0.10)',
                                boxShadow: colorEsp
                                    ? '0 0 0 1px rgba(0,0,0,0.4)'
                                    : '0 0 0 1px rgba(0,0,0,0.35), 0 0 10px rgba(20,184,166,0.35)',
                                pointerEvents: 'none',
                            }}
                        >
                            {/* Marcador numerado (no texto): evita que las etiquetas
                                se encimen cuando hay cajas juntas. El nombre y la
                                confianza van en la leyenda de abajo, con el mismo número. */}
                            <span style={{
                                position: 'absolute', top: 0, left: 0,
                                minWidth: 16, height: 16, padding: '0 4px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: colorEsp ?? 'var(--accent)', color: '#fff',
                                fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, lineHeight: 1,
                                borderRadius: '3px 0 4px 0',
                                boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
                            }}>
                                {i + 1}
                            </span>
                        </div>
                    )
                })}

                {/* Overlay: cargando */}
                {estado.estado === 'cargando' && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 12,
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            border: '3px solid rgba(255,255,255,0.18)',
                            borderTopColor: 'var(--accent)',
                            animation: 'pulmia-det-spin 0.8s linear infinite',
                        }} />
                        <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>
                            Ejecutando detector…
                        </div>
                    </div>
                )}

                {/* Overlay: sin hallazgos */}
                {sinHallazgos && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '8px 16px', borderRadius: 20,
                            background: 'rgba(15,23,42,0.72)', backdropFilter: 'blur(2px)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            color: '#fff', fontSize: 13, fontWeight: 500, lineHeight: 1,
                        }}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="6.5" stroke="#fff" strokeWidth="1.4" />
                                <path d="M5.2 8.2l1.9 1.9 3.7-3.9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Sin hallazgos detectables
                        </div>
                    </div>
                )}
            </div>

            {/* Leyenda: lista de hallazgos numerados (clase_es + confianza).
                El texto vive aquí, no sobre las cajas, para que nunca se solape. */}
            {estado.estado === 'listo' && hayCajas && (
                <div style={{ marginTop: 10 }}>
                    <div style={{ ...captionStyle, marginBottom: 8 }}>
                        Hallazgos localizados ({cajas.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {cajas.map((caja, i) => {
                            const colorEsp = colorEspecialista(caja.clase)
                            return (
                            <div
                                key={`leyenda-${caja.clase}-${i}`}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    padding: '5px 11px 5px 5px', borderRadius: 8,
                                    background: 'var(--bg-3)', border: '1px solid var(--border)',
                                }}
                            >
                                <span style={{
                                    minWidth: 18, height: 18, padding: '0 4px',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    background: colorEsp ?? 'var(--accent)', color: '#fff',
                                    fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, lineHeight: 1,
                                    borderRadius: 5,
                                }}>
                                    {i + 1}
                                </span>
                                <span style={{ fontSize: 13, color: 'var(--t0)' }}>
                                    {caja.claseEs}
                                </span>
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t1)' }}>
                                    {caja.confianza.toFixed(2)}
                                </span>
                                {colorEsp && (
                                    <span style={{
                                        fontFamily: 'var(--mono)', fontSize: 9, lineHeight: 1,
                                        letterSpacing: '0.04em', textTransform: 'uppercase',
                                        color: colorEsp, border: `1px solid ${colorEsp}`,
                                        borderRadius: 6, padding: '2px 5px',
                                    }}>
                                        especialista
                                    </span>
                                )}
                            </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Pie discreto: error / resumen + prob_filtro */}
            {estado.estado === 'error' ? (
                <div role="alert" style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    marginTop: 8, padding: '8px 12px', borderRadius: 8,
                    background: 'var(--err-bg)', border: '1px solid var(--err)',
                }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="8" cy="8" r="7" stroke="var(--err)" strokeWidth="1.4" />
                        <path d="M8 5v3.5" stroke="var(--err)" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="8" cy="11.5" r="0.8" fill="var(--err)" />
                    </svg>
                    <span style={{ fontSize: 12, color: 'var(--err)', lineHeight: 1.5 }}>
                        No se pudo ejecutar la detección. {estado.mensaje}
                    </span>
                </div>
            ) : estado.estado === 'listo' ? (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                    marginTop: 8,
                }}>
                    <span style={{
                        fontFamily: 'var(--mono)', fontSize: 10,
                        color: hayCajas ? 'var(--accent)' : 'var(--t2)',
                        padding: '2px 8px', borderRadius: 10,
                        border: '1px solid var(--border)', background: 'var(--bg-3)',
                    }}>
                        Filtro: {estado.datos.probFiltro.toFixed(2)}
                    </span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)' }}>
                        {estado.datos.resumen}
                    </span>
                </div>
            ) : null}
        </div>
    )
}

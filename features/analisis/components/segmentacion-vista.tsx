'use client'

// Vista de la SEGMENTACIÓN: superpone la máscara de los campos pulmonares sobre
// la radiografía original. La máscara es un PNG RGBA (relleno semitransparente +
// contorno) que el backend ya devuelve ESCALADO al tamaño original; por eso aquí
// solo se apila encima de la imagen a width:100% y encaja sin desfases (mismo
// aspecto), igual de robusto que el escalado en % de las cajas de detección.

import { useState } from 'react'
import type { EstadoSegmentacion } from '../hooks/use-segmentacion'

interface SegmentacionVistaProps {
    readonly estado: EstadoSegmentacion
    readonly imagenDataUrl: string
}

const captionStyle: React.CSSProperties = {
    fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)',
    marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase',
}

export function SegmentacionVista({ estado, imagenDataUrl }: SegmentacionVistaProps) {
    const datos = estado.estado === 'listo' ? estado.datos : null
    const hayMascara = !!datos && !!datos.mascaraPng && datos.areaPulmonPct > 0
    const sinPulmon = estado.estado === 'listo' && !hayMascara

    // Opacidad del overlay (1 = como lo entrega el modelo). Permite atenuarlo
    // para comparar el contorno del pulmón con la anatomía de la radiografía.
    const [opacidad, setOpacidad] = useState(1)

    return (
        <div>
            <style>{`@keyframes pulmia-seg-spin { to { transform: rotate(360deg); } }`}</style>

            <div style={captionStyle}>
                Segmentación — campos pulmonares (modelo U-Net)
            </div>

            {/* Lienzo: radiografía + máscara superpuesta */}
            <div style={{
                position: 'relative', width: '100%',
                borderRadius: 12, overflow: 'hidden',
                border: '1px solid var(--border)', background: 'var(--bg-2)',
                lineHeight: 0,
            }}>
                <img
                    src={imagenDataUrl}
                    alt="Radiografía"
                    style={{
                        width: '100%', height: 'auto', display: 'block',
                        filter: estado.estado === 'cargando' ? 'brightness(0.55) saturate(0.6)' : 'none',
                        transition: 'filter 0.3s ease',
                    }}
                />

                {/* Máscara superpuesta (mismo aspecto que la imagen -> alineada) */}
                {hayMascara && datos && (
                    <img
                        src={`data:image/png;base64,${datos.mascaraPng}`}
                        alt="Máscara de campos pulmonares"
                        style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%', display: 'block',
                            pointerEvents: 'none',
                            opacity: opacidad,
                            transition: 'opacity 0.15s ease',
                        }}
                    />
                )}

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
                            animation: 'pulmia-seg-spin 0.8s linear infinite',
                        }} />
                        <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>
                            Segmentando pulmones…
                        </div>
                    </div>
                )}

                {/* Overlay: sin campos pulmonares */}
                {sinPulmon && (
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
                            No se detectaron campos pulmonares
                        </div>
                    </div>
                )}
            </div>

            {/* Control de opacidad del overlay (solo si hay máscara) */}
            {hayMascara && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                    <span style={{
                        fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)',
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                    }}>
                        Opacidad
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(opacidad * 100)}
                        onChange={(e) => setOpacidad(Number(e.target.value) / 100)}
                        aria-label="Opacidad de la máscara de segmentación"
                        style={{ flex: 1, maxWidth: 180, accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <span style={{
                        fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t1)',
                        minWidth: 34, textAlign: 'right',
                    }}>
                        {Math.round(opacidad * 100)}%
                    </span>
                </div>
            )}

            {/* Pie discreto: error / área pulmonar + resumen */}
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
                        No se pudo ejecutar la segmentación. {estado.mensaje}
                    </span>
                </div>
            ) : estado.estado === 'listo' ? (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                    marginTop: 8,
                }}>
                    {/* Leyenda de color del overlay */}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--t2)' }}>
                        <span style={{
                            width: 12, height: 12, borderRadius: 3,
                            background: 'rgba(20,184,166,0.35)', border: '1.5px solid var(--accent)',
                            display: 'inline-block',
                        }} />
                        Región pulmonar
                    </span>
                    {hayMascara && datos && (
                        <span style={{
                            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)',
                            padding: '2px 8px', borderRadius: 10,
                            border: '1px solid var(--border)', background: 'var(--bg-3)',
                        }}>
                            Área pulmonar: {datos.areaPulmonPct.toFixed(1)}%
                        </span>
                    )}
                    {datos && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)' }}>
                            {datos.resumen}
                        </span>
                    )}
                </div>
            ) : null}
        </div>
    )
}

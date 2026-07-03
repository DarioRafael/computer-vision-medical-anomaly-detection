'use client'

// Vista del ANÁLISIS INTEGRADO: teje las 4 perspectivas en un mini-informe.
//  - Imagen ÚNICA combinada: radiografía + máscara del pulmón (tenue) + cajas
//    del detector (numeradas, coloreadas según coherencia anatómica).
//  - Reporte: veredicto (color por nivel), patologías probables, hallazgos
//    localizados con ubicación + coherencia, área pulmonar y narrativa.
//
// Escalado: las cajas se posicionan en % de las dimensiones naturales (igual que
// la pestaña Detección) y la máscara se superpone a width:100% (igual que
// Segmentación); ambas comparten el mismo aspecto que la radiografía -> alineadas.

import { useState } from 'react'
import type { EstadoIntegrado } from '../hooks/use-analisis-integrado'
import type { HallazgoLocalizado } from '@/lib/tipos'
import { esEspecialista, colorEspecialista } from '../especialistas'

interface IntegradoVistaProps {
    readonly estado: EstadoIntegrado
    readonly imagenDataUrl: string
}

const captionStyle: React.CSSProperties = {
    fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)',
    marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase',
}

const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)',
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8,
}

// Color del veredicto según nivel.
function colorNivel(nivel: string): { color: string; bg: string; border: string } {
    if (nivel === 'alto') return { color: '#A32D2D', bg: '#FCEBEB', border: '#F7C1C1' }
    if (nivel === 'moderado') return { color: '#854F0B', bg: '#FAEEDA', border: '#FAC775' }
    return { color: '#3B6D11', bg: '#EAF3DE', border: '#C0DD97' } // bajo
}

function esAtipica(coherencia: string): boolean {
    return coherencia === 'ubicación atípica'
}

// Color de la caja según coherencia (atípica = ámbar para llamar la atención).
const COLOR_CAJA = 'var(--accent)'
const COLOR_CAJA_ATIPICA = '#EF9F27'

export function IntegradoVista({ estado, imagenDataUrl }: IntegradoVistaProps) {
    const [dims, setDims] = useState<{ w: number; h: number } | null>(null)

    const cargando = estado.estado === 'cargando' || estado.estado === 'inactivo'
    const datos = estado.estado === 'listo' ? estado.datos : null
    const hallazgos = datos?.hallazgosLocalizados ?? []

    // Especialistas presentes entre los hallazgos (para los swatches de la leyenda).
    const especialistasPresentes = Array.from(
        new Map(
            hallazgos.filter((h) => esEspecialista(h.clase)).map((h) => [h.clase, h.claseEs]),
        ).entries(),
    ).map(([clase, claseEs]) => ({ clase, claseEs }))

    return (
        <div>
            <style>{`@keyframes pulmia-int-spin { to { transform: rotate(360deg); } }`}</style>

            <div style={captionStyle}>
                Análisis integrado — evidencia convergente de 4 modelos
            </div>

            {/* Tablero: imagen (izquierda) + reporte (derecha); apila en pantallas estrechas */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: '1.5 1 340px', minWidth: 300 }}>

            {/* ── Imagen combinada: radiografía + máscara tenue + cajas ── */}
            <div style={{
                position: 'relative', width: '100%',
                borderRadius: 12, overflow: 'hidden',
                border: '1px solid var(--border)', background: 'var(--bg-2)',
                lineHeight: 0,
            }}>
                <img
                    src={imagenDataUrl}
                    alt="Radiografía (análisis integrado)"
                    onLoad={(e) => setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                    style={{
                        width: '100%', height: 'auto', display: 'block',
                        filter: cargando ? 'brightness(0.55) saturate(0.6)' : 'none',
                        transition: 'filter 0.3s ease',
                    }}
                />

                {/* Máscara del pulmón (tenue, debajo de las cajas) */}
                {datos && datos.mascaraPng && (
                    <img
                        src={`data:image/png;base64,${datos.mascaraPng}`}
                        alt="Máscara de pulmones"
                        style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%', display: 'block',
                            opacity: 0.4, pointerEvents: 'none',
                        }}
                    />
                )}

                {/* Cajas del detector (encima de la máscara) */}
                {datos && dims && hallazgos.map((h, i) => {
                    const [x1, y1, x2, y2] = h.xyxy
                    // Especialista -> color propio; general -> teal/ámbar según coherencia (igual que antes).
                    const color = colorEspecialista(h.clase) ?? (esAtipica(h.coherencia) ? COLOR_CAJA_ATIPICA : COLOR_CAJA)
                    return (
                        <div
                            key={`${h.clase}-${i}`}
                            style={{
                                position: 'absolute',
                                left: `${(x1 / dims.w) * 100}%`,
                                top: `${(y1 / dims.h) * 100}%`,
                                width: `${((x2 - x1) / dims.w) * 100}%`,
                                height: `${((y2 - y1) / dims.h) * 100}%`,
                                border: `2px solid ${color}`,
                                borderRadius: 3,
                                boxShadow: '0 0 0 1px rgba(0,0,0,0.35)',
                                pointerEvents: 'none',
                            }}
                        >
                            <span style={{
                                position: 'absolute', top: 0, left: 0,
                                minWidth: 16, height: 16, padding: '0 4px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: color, color: '#fff',
                                fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, lineHeight: 1,
                                borderRadius: '3px 0 4px 0',
                            }}>
                                {i + 1}
                            </span>
                        </div>
                    )
                })}

                {/* Overlay: cargando (4 modelos) */}
                {cargando && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 12,
                    }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: '50%',
                            border: '3px solid rgba(255,255,255,0.18)',
                            borderTopColor: 'var(--accent)',
                            animation: 'pulmia-int-spin 0.85s linear infinite',
                        }} />
                        <div style={{ fontSize: 13, color: '#fff', fontWeight: 500, textAlign: 'center', padding: '0 20px' }}>
                            Ejecutando análisis integrado…
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                                combinando 4 modelos
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Leyenda de la imagen combinada */}
            {datos && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--t2)' }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(20,184,166,0.35)', border: '1.5px solid var(--accent)' }} />
                        Pulmón
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--t2)' }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, border: `2px solid ${COLOR_CAJA}` }} />
                        Hallazgo
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--t2)' }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, border: `2px solid ${COLOR_CAJA_ATIPICA}` }} />
                        Ubicación atípica
                    </span>
                    {/* Swatches de especialistas presentes (data-driven por clase) */}
                    {especialistasPresentes.map((e) => (
                        <span key={e.clase} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--t2)' }}>
                            <span style={{ width: 12, height: 12, borderRadius: 3, border: `2px solid ${colorEspecialista(e.clase)}` }} />
                            {e.claseEs} (especialista)
                        </span>
                    ))}
                </div>
            )}

            </div>{/* fin columna visual */}

            <div style={{ flex: '1 1 280px', minWidth: 260 }}>{/* columna reporte */}

            {/* ── Error ── */}
            {estado.estado === 'error' && (
                <div role="alert" style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    marginTop: 10, padding: '10px 12px', borderRadius: 8,
                    background: 'var(--err-bg)', border: '1px solid var(--err)',
                }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="8" cy="8" r="7" stroke="var(--err)" strokeWidth="1.4" />
                        <path d="M8 5v3.5" stroke="var(--err)" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="8" cy="11.5" r="0.8" fill="var(--err)" />
                    </svg>
                    <span style={{ fontSize: 12, color: 'var(--err)', lineHeight: 1.5 }}>
                        No se pudo generar el análisis integrado. {estado.mensaje}
                    </span>
                </div>
            )}

            {/* ── Reporte tejido ── */}
            {datos && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* Veredicto */}
                    <VeredictoCard
                        esAnormal={datos.veredicto.esAnormal}
                        probabilidad={datos.veredicto.probabilidad}
                        nivel={datos.veredicto.nivel}
                    />

                    {/* Patologías probables */}
                    {datos.patologiasProbables.length > 0 && (
                        <div>
                            <div style={labelStyle}>Patologías probables (multilabel)</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {datos.patologiasProbables.map((p) => (
                                    <span key={p.clase} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '5px 11px', borderRadius: 8,
                                        background: 'var(--bg-3)', border: '1px solid var(--border)',
                                        fontSize: 13, color: 'var(--t0)',
                                    }}>
                                        {p.claseEs}
                                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>
                                            {Math.round(p.prob * 100)}%
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hallazgos localizados */}
                    {hallazgos.length > 0 && (
                        <div>
                            <div style={labelStyle}>Hallazgos localizados ({hallazgos.length})</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {hallazgos.map((h, i) => (
                                    <FilaHallazgo key={`${h.clase}-${i}`} num={i + 1} h={h} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Área pulmonar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{
                            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)',
                            padding: '3px 10px', borderRadius: 10,
                            border: '1px solid var(--border)', background: 'var(--bg-3)',
                        }}>
                            Área pulmonar: {datos.areaPulmonPct.toFixed(1)}%
                        </span>
                    </div>

                    {/* Coherencia atención del clasificador ↔ detección (evidencia convergente) */}
                    {datos.coherencia && (
                        <div style={{
                            padding: '10px 12px', borderRadius: 10,
                            background: 'var(--bg-2)', border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                        }}>
                            <span style={{
                                fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)',
                                letterSpacing: '0.06em', textTransform: 'uppercase',
                            }}>
                                Coherencia atención↔detección
                            </span>
                            <span style={{
                                fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700,
                                color: datos.coherencia.scoreGlobal >= 0.5 ? 'var(--accent)' : '#EF9F27',
                            }}>
                                {Math.round(datos.coherencia.scoreGlobal * 100)}%
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--t2)' }}>
                                el foco del clasificador coincide con {datos.coherencia.nConcuerdan}/{datos.coherencia.nCajas} hallazgo(s)
                            </span>
                        </div>
                    )}

                    {/* Resumen narrativo (colapsable para no ocupar tanto espacio) */}
                    <details style={{
                        padding: '12px 16px', borderRadius: 12,
                        background: 'var(--bg-2)', border: '1px solid var(--border)',
                    }}>
                        <summary style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer', listStyle: 'revert' }}>
                            Informe radiológico asistido
                        </summary>
                        <p style={{
                            fontSize: 13, color: 'var(--t1)', lineHeight: 1.65, margin: '10px 0 0',
                            whiteSpace: 'pre-line',  // respeta los saltos de línea entre secciones
                        }}>
                            {datos.resumenTexto}
                        </p>
                    </details>

                    {/* Avisos de fallos parciales */}
                    {datos.avisos.length > 0 && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: 8,
                            padding: '10px 12px', borderRadius: 8,
                            background: 'var(--warn-bg)', border: '1px solid var(--warn)',
                        }}>
                            <span style={{ color: 'var(--warn)', fontSize: 13, flexShrink: 0 }}>⚠</span>
                            <span style={{ fontSize: 12, color: 'var(--warn)', lineHeight: 1.5 }}>
                                Algunos modelos no se pudieron calcular: {datos.avisos.join('; ')}.
                            </span>
                        </div>
                    )}
                </div>
            )}

            </div>{/* fin columna reporte */}
            </div>{/* fin tablero */}
        </div>
    )
}

// ── Sub-componentes ──

function VeredictoCard({ esAnormal, probabilidad, nivel }: { esAnormal: boolean; probabilidad: number; nivel: string }) {
    const c = colorNivel(nivel)
    return (
        <div style={{
            padding: '14px 16px', borderRadius: 12,
            background: c.bg, border: `1px solid ${c.border}`,
        }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: c.color }}>
                    {esAnormal ? 'Anormal' : 'Sin anormalidad clara'}
                </span>
                <span style={{ fontSize: 13, color: c.color, opacity: 0.9 }}>
                    probabilidad {Math.round(probabilidad * 100)}% · nivel {nivel}
                </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 6 }}>
                Veredicto del clasificador binario (apoyo diagnóstico, no sustituye el criterio médico).
            </div>
        </div>
    )
}

function FilaHallazgo({ num, h }: { num: number; h: HallazgoLocalizado }) {
    const atipica = esAtipica(h.coherencia)
    const colorEsp = colorEspecialista(h.clase)
    const colorNum = colorEsp ?? (atipica ? COLOR_CAJA_ATIPICA : COLOR_CAJA)
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            padding: '8px 10px', borderRadius: 8,
            background: 'var(--bg-2)', border: '1px solid var(--border)',
        }}>
            <span style={{
                minWidth: 18, height: 18, padding: '0 4px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: colorNum, color: '#fff',
                fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, borderRadius: 5,
            }}>
                {num}
            </span>
            <span style={{ fontSize: 13, color: 'var(--t0)', fontWeight: 500 }}>{h.claseEs}</span>
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
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t1)' }}>
                {h.confianza.toFixed(2)}
            </span>
            <span style={{ fontSize: 12, color: 'var(--t2)' }}>· {h.ubicacion}</span>
            <span style={{
                marginLeft: 'auto',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 500,
                padding: '2px 8px', borderRadius: 10,
                color: atipica ? '#854F0B' : '#3B6D11',
                background: atipica ? '#FAEEDA' : '#EAF3DE',
                border: `1px solid ${atipica ? '#FAC775' : '#C0DD97'}`,
            }}>
                {atipica ? '⚠' : '✓'} {h.coherencia}
            </span>
        </div>
    )
}

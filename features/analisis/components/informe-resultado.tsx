'use client'

// Vista del informe de un análisis recién completado.
// Muestra: disclaimer médico, imagen original, Grad-CAM con leyenda,
// probabilidad de carcinoma con riesgo contextualizado, interpretación
// del modelo, patologías agrupadas por severidad y acciones con contexto.

import { useState } from 'react'
import type { InformeAnalisis } from '@/lib/tipos'
import { MedicalDisclaimer } from '@/components/medical/medical-disclaimer'
import { useDeteccion } from '../hooks/use-deteccion'
import { DeteccionVista } from './deteccion-vista'
import { useSegmentacion } from '../hooks/use-segmentacion'
import { SegmentacionVista } from './segmentacion-vista'
import { useAnalisisIntegrado } from '../hooks/use-analisis-integrado'
import { IntegradoVista } from './integrado-vista'

interface InformeResultadoProps {
    readonly informe: InformeAnalisis
    readonly imagenDataUrl: string
    readonly gradcamBase64?: string
    readonly onGuardar: () => void
    readonly onNuevo: () => void
}

// Etiqueta de riesgo contextualizada según porcentaje, sin usar "severidad" cruda.
function etiquetaRiesgo(pct: number): { texto: string; color: string; bg: string; border: string } {
    if (pct >= 75) return { texto: 'Riesgo alto (modelo IA)', color: '#A32D2D', bg: '#FCEBEB', border: '#F7C1C1' }
    if (pct >= 50) return { texto: 'Riesgo moderado–alto (modelo IA)', color: '#854F0B', bg: '#FAEEDA', border: '#FAC775' }
    if (pct >= 30) return { texto: 'Riesgo moderado (modelo IA)', color: '#3B6D11', bg: '#EAF3DE', border: '#C0DD97' }
    return { texto: 'Riesgo bajo (modelo IA)', color: '#185FA5', bg: '#E6F1FB', border: '#B5D4F4' }
}

// Color de barra según porcentaje de la patología detectada.
function colorBarra(pct: number): string {
    if (pct >= 85) return '#E24B4A'
    if (pct >= 65) return '#EF9F27'
    return '#185FA5'
}

const estiloLabel: React.CSSProperties = {
    fontFamily: 'var(--mono)',
    fontSize: 10,
    color: 'var(--t2)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 10,
}

const estiloCard: React.CSSProperties = {
    padding: '18px 20px',
    borderRadius: 14,
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
}

export function InformeResultado({ informe, imagenDataUrl, gradcamBase64, onGuardar, onNuevo }: InformeResultadoProps) {
    const pct = informe.porcentajeCarcinoma
    const riesgo = etiquetaRiesgo(pct)

    // Separar patologías en principales (>=65%) y secundarias (30–64%)
    const principales = informe.patologiasRelevantes.filter(p => p.porcentaje >= 65)
    const secundarias = informe.patologiasRelevantes.filter(p => p.porcentaje < 65)

    return (
        <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
        }}>

            {/* ── Fila principal: columna izquierda + columna derecha ── */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                {/* ── COLUMNA IZQUIERDA: Resultado + Imágenes ── */}
                <div style={{ flex: '1 1 480px', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* ── 1. Resultado principal ── */}
                    <div style={estiloCard}>
                        <div style={estiloLabel}>Resultado del análisis</div>

                        {/* Disclaimer médico inline — siempre visible, antes del número */}
                        <div style={{ marginBottom: 16 }}>
                            <MedicalDisclaimer variante="inline" />
                        </div>

                        {/* Número principal */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                            <span style={{ fontSize: 40, fontWeight: 700, color: 'var(--t0)', lineHeight: 1 }}>
                                {pct}%
                            </span>
                            <span style={{ fontSize: 14, color: 'var(--t1)' }}>
                                probabilidad estimada de carcinoma
                            </span>
                        </div>

                        {/* Badge de riesgo contextualizado */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 500,
                                background: riesgo.bg,
                                color: riesgo.color,
                                border: `1px solid ${riesgo.border}`,
                            }}>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M5 1.5L8.5 8H1.5L5 1.5Z" stroke={riesgo.color} strokeWidth="1.2" fill="none" />
                                </svg>
                                {riesgo.texto}
                            </span>
                            <span
                                style={{
                                    fontSize: 11,
                                    color: 'var(--t2)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    cursor: 'help',
                                    borderBottom: '1px dotted var(--border-h)',
                                }}
                                title="Umbral óptimo calibrado por el método de Youden's J. Por encima de 50% el modelo clasifica el caso como positivo. Calibrado con Temperature Scaling (T=1.44) para que el porcentaje refleje confianza real."
                            >
                                Umbral de detección del modelo: 50%
                                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
                                    <path d="M8 7.5V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                    <circle cx="8" cy="5.2" r="0.85" fill="currentColor" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    {/* ── 2. Imágenes (pestañas: Original / Grad-CAM / Detección) ── */}
                    <AreaImagenes imagenDataUrl={imagenDataUrl} gradcamBase64={gradcamBase64} />

                </div>{/* fin columna izquierda */}

                {/* ── COLUMNA DERECHA: Interpretación + Condiciones ── */}
                <div style={{ flex: '1 1 340px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* ── 3. Interpretación del modelo ── */}
                    <div style={estiloCard}>
                        <div style={estiloLabel}>Interpretación del modelo</div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: riesgo.color,
                                marginTop: 5, flexShrink: 0,
                            }} />
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t0)', marginBottom: 4 }}>
                                    Detección positiva por el modelo
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.65 }}>
                                    {informe.etiquetaCarcinoma}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── 4. Condiciones detectadas ── */}
                    {informe.patologiasRelevantes.length > 0 && (
                        <div style={estiloCard}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ ...estiloLabel, marginBottom: 0 }}>Condiciones detectadas</div>
                                <span style={{ fontSize: 11, color: 'var(--t2)' }}>Solo condiciones &gt;30%</span>
                            </div>

                            {/* Hallazgos principales */}
                            {principales.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        padding: '2px 10px',
                                        borderRadius: 10,
                                        fontSize: 11,
                                        background: '#FCEBEB',
                                        color: '#A32D2D',
                                        marginBottom: 10,
                                    }}>
                                        Hallazgos principales
                                    </div>
                                    <FilaPatologias patologias={principales} />
                                </div>
                            )}

                            {/* Hallazgos secundarios */}
                            {secundarias.length > 0 && (
                                <div style={{
                                    borderTop: principales.length > 0 ? '1px solid var(--border)' : 'none',
                                    paddingTop: principales.length > 0 ? 14 : 0,
                                }}>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        padding: '2px 10px',
                                        borderRadius: 10,
                                        fontSize: 11,
                                        background: 'var(--bg-3)',
                                        color: 'var(--t1)',
                                        marginBottom: 10,
                                    }}>
                                        Hallazgos secundarios
                                    </div>
                                    <FilaPatologias patologias={secundarias} />
                                </div>
                            )}
                        </div>
                    )}

                </div>{/* fin columna derecha */}

            </div>{/* fin fila principal */}

            {/* ── 5. Acciones ── centradas debajo de ambas columnas */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                flexWrap: 'wrap',
                paddingBottom: 24,
            }}>
                <button
                    onClick={onGuardar}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '10px 22px',
                        borderRadius: 10,
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-accent)',
                        transition: 'all var(--ts)',
                    }}
                >
                    <IconoGuardar />
                    Guardar estudio
                </button>

                <button
                    onClick={onNuevo}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '10px 22px',
                        borderRadius: 10,
                        background: 'var(--bg-3)',
                        color: 'var(--t0)',
                        border: '1px solid var(--border)',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all var(--ts)',
                    }}
                >
                    <IconoNuevo />
                    Nuevo análisis
                </button>

                <span style={{ fontSize: 11, color: 'var(--t2)' }}>
                    El estudio no se guarda automáticamente
                </span>
            </div>
        </div>
    )
}

// ── Sub-componentes internos ──

// Área de imágenes con pestañas: Original / Grad-CAM / Detección.
// El Grad-CAM se conserva IDÉNTICO (mismo markup y leyenda), solo movido a su
// pestaña. La detección es una vista APARTE: con pestañas nunca coinciden en
// pantalla el heatmap del clasificador y las cajas del detector.
function AreaImagenes({ imagenDataUrl, gradcamBase64 }: { imagenDataUrl: string; gradcamBase64?: string }) {
    type TabId = 'original' | 'gradcam' | 'deteccion' | 'segmentacion' | 'integrado'
    const [tab, setTab] = useState<TabId>('original')

    // Detección y segmentación se disparan automáticamente al montar el informe
    // (en paralelo, sin bloquear): al abrir la pestaña normalmente ya están listas.
    const deteccion = useDeteccion(imagenDataUrl)
    const segmentacion = useSegmentacion(imagenDataUrl)

    // El análisis integrado corre los 4 modelos -> es LAZY: solo se lanza cuando
    // el usuario abre su pestaña (latch que queda en true).
    const [integradoSolicitado, setIntegradoSolicitado] = useState(false)
    const integrado = useAnalisisIntegrado(imagenDataUrl, integradoSolicitado)

    const tabs: { id: TabId; label: string }[] = [
        { id: 'original', label: 'Original' },
        ...(gradcamBase64 ? [{ id: 'gradcam' as TabId, label: 'Grad-CAM' }] : []),
        { id: 'deteccion', label: 'Detección' },
        { id: 'segmentacion', label: 'Segmentación' },
        { id: 'integrado', label: 'Integrado' },
    ]

    function seleccionarTab(id: TabId) {
        if (id === 'integrado') setIntegradoSolicitado(true)  // dispara el análisis integrado
        setTab(id)
    }

    return (
        <div>
            <style>{`@keyframes pulmia-det-spin { to { transform: rotate(360deg); } }`}</style>

            {/* Barra de pestañas */}
            <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
                {tabs.map((t) => {
                    const activa = tab === t.id
                    return (
                        <button
                            key={t.id}
                            onClick={() => seleccionarTab(t.id)}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '8px 14px', border: 'none', background: 'transparent',
                                cursor: 'pointer',
                                fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.04em',
                                fontWeight: activa ? 600 : 500,
                                color: activa ? 'var(--accent)' : 'var(--t2)',
                                borderBottom: `2px solid ${activa ? 'var(--accent)' : 'transparent'}`,
                                marginBottom: -1, transition: 'color var(--ts), border-color var(--ts)',
                            }}
                        >
                            {t.label}
                            {t.id === 'deteccion' && <IndicadorDeteccion estado={deteccion} />}
                            {t.id === 'segmentacion' && <IndicadorSegmentacion estado={segmentacion} />}
                            {t.id === 'integrado' && <IndicadorIntegrado estado={integrado} />}
                        </button>
                    )
                })}
            </div>

            {/* Panel: Original */}
            {tab === 'original' && (
                <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Radiografía original
                    </div>
                    <img
                        src={imagenDataUrl}
                        alt="Radiografía original"
                        style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)', display: 'block' }}
                    />
                </div>
            )}

            {/* Panel: Grad-CAM (markup idéntico al anterior, solo movido a su pestaña) */}
            {tab === 'gradcam' && gradcamBase64 && (
                <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Grad-CAM — zona de atención del modelo
                    </div>
                    <img
                        src={`data:image/png;base64,${gradcamBase64}`}
                        alt="Mapa de calor Grad-CAM con zonas de alta relevancia en rojo"
                        style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)', display: 'block' }}
                    />
                    {/* Leyenda del heatmap */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--t2)' }}>Baja</span>
                        <div style={{
                            flex: 1,
                            height: 7,
                            borderRadius: 4,
                            background: 'linear-gradient(to right, #3b4bc8, #29c5a0, #f5c518, #e24b4a)',
                        }} />
                        <span style={{ fontSize: 11, color: 'var(--t2)' }}>Alta relevancia</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.5 }}>
                        Las zonas rojas indican mayor relevancia para el modelo al clasificar la imagen.
                    </div>
                </div>
            )}

            {/* Panel: Detección */}
            {tab === 'deteccion' && (
                <DeteccionVista estado={deteccion} imagenDataUrl={imagenDataUrl} />
            )}

            {/* Panel: Segmentación */}
            {tab === 'segmentacion' && (
                <SegmentacionVista estado={segmentacion} imagenDataUrl={imagenDataUrl} />
            )}

            {/* Panel: Análisis Integrado */}
            {tab === 'integrado' && (
                <IntegradoVista estado={integrado} imagenDataUrl={imagenDataUrl} />
            )}
        </div>
    )
}

// Indicador pequeño dentro de la pestaña "Detección": spinner mientras carga,
// y un conteo de hallazgos cuando termina.
function IndicadorDeteccion({ estado }: { estado: ReturnType<typeof useDeteccion> }) {
    if (estado.estado === 'cargando') {
        return (
            <span style={{
                width: 10, height: 10, borderRadius: '50%', display: 'inline-block',
                border: '1.5px solid var(--border)', borderTopColor: 'var(--accent)',
                animation: 'pulmia-det-spin 0.8s linear infinite',
            }} />
        )
    }
    if (estado.estado === 'listo' && estado.datos.cajas.length > 0) {
        return (
            <span style={{
                minWidth: 16, height: 16, padding: '0 5px', borderRadius: 8,
                background: 'var(--accent)', color: '#fff', display: 'inline-block',
                fontSize: 10, fontWeight: 700, lineHeight: '16px', textAlign: 'center',
            }}>
                {estado.datos.cajas.length}
            </span>
        )
    }
    return null
}

// Indicador de la pestaña "Segmentación": spinner mientras carga, y un check
// pequeño cuando la máscara está lista.
function IndicadorSegmentacion({ estado }: { estado: ReturnType<typeof useSegmentacion> }) {
    if (estado.estado === 'cargando') {
        return (
            <span style={{
                width: 10, height: 10, borderRadius: '50%', display: 'inline-block',
                border: '1.5px solid var(--border)', borderTopColor: 'var(--accent)',
                animation: 'pulmia-det-spin 0.8s linear infinite',
            }} />
        )
    }
    if (estado.estado === 'listo' && estado.datos.areaPulmonPct > 0) {
        return (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="8" cy="8" r="6.5" stroke="var(--accent)" strokeWidth="1.4" />
                <path d="M5.2 8.2l1.9 1.9 3.7-3.9" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    }
    return null
}

// Indicador de la pestaña "Integrado": spinner mientras corre (4 modelos),
// y nº de hallazgos cuando termina.
function IndicadorIntegrado({ estado }: { estado: ReturnType<typeof useAnalisisIntegrado> }) {
    if (estado.estado === 'cargando') {
        return (
            <span style={{
                width: 10, height: 10, borderRadius: '50%', display: 'inline-block',
                border: '1.5px solid var(--border)', borderTopColor: 'var(--accent)',
                animation: 'pulmia-det-spin 0.8s linear infinite',
            }} />
        )
    }
    if (estado.estado === 'listo') {
        return (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="8" cy="8" r="6.5" stroke="var(--accent)" strokeWidth="1.4" />
                <path d="M5.2 8.2l1.9 1.9 3.7-3.9" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    }
    return null
}

interface PatologiaItem {
    nombre: string
    porcentaje: number
}

function FilaPatologias({ patologias }: { patologias: PatologiaItem[] }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {patologias.map((p) => (
                <div key={p.nombre} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--t0)', minWidth: 150 }}>
                        {p.nombre}
                    </span>
                    <div style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        background: 'var(--bg-3)',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            width: `${p.porcentaje}%`,
                            height: '100%',
                            borderRadius: 3,
                            background: colorBarra(p.porcentaje),
                            transition: 'width 0.4s ease',
                        }} />
                    </div>
                    <span style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 11,
                        color: 'var(--t1)',
                        minWidth: 34,
                        textAlign: 'right',
                    }}>
                        {p.porcentaje}%
                    </span>
                </div>
            ))}
        </div>
    )
}

function IconoGuardar() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1 10v1.5A1.5 1.5 0 002.5 13h9A1.5 1.5 0 0013 11.5V10" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    )
}

function IconoNuevo() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="var(--t1)" strokeWidth="1.2" />
            <path d="M7 4.5V7l1.5 1.5" stroke="var(--t1)" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    )
}
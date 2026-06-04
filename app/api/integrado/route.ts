// POST /api/integrado
// Recibe una imagen (multipart/form-data) y la envía al ANÁLISIS INTEGRADO de
// FastAPI (/analisis-integrado/analizar). Devuelve el reporte unificado.
//
// Aditivo: NO toca /api/analyze, /api/detect ni /api/segment.

import { NextRequest, NextResponse } from 'next/server'
import { analizarIntegrado, ModeloError } from '@/lib/modelo'

export async function POST(req: NextRequest) {
    let formData: FormData
    try {
        formData = await req.formData()
    } catch {
        return NextResponse.json({ error: 'Se esperaba multipart/form-data.' }, { status: 400 })
    }

    const file = formData.get('file')
    if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: 'Se requiere un archivo "file".' }, { status: 400 })
    }

    const nombreArchivo = file instanceof File ? file.name : 'radiografia.png'

    try {
        const resultado = await analizarIntegrado(file, nombreArchivo)
        return NextResponse.json(resultado)
    } catch (err) {
        if (err instanceof ModeloError) {
            return NextResponse.json(
                { error: err.message },
                { status: err.codigo === 'sin_conexion' ? 502 : 500 },
            )
        }
        return NextResponse.json(
            { error: `Error inesperado: ${String(err)}` },
            { status: 500 },
        )
    }
}

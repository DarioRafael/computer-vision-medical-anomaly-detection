// POST /api/segment
// Recibe una imagen (multipart/form-data) y la envía al sistema de SEGMENTACIÓN
// de FastAPI (/segmentacion/segmentar). Devuelve la máscara de pulmones.
//
// Aditivo: NO toca /api/analyze (clasificadores + Grad-CAM) ni /api/detect.

import { NextRequest, NextResponse } from 'next/server'
import { segmentarPulmones, ModeloError } from '@/lib/modelo'

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
        const resultado = await segmentarPulmones(file, nombreArchivo)
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

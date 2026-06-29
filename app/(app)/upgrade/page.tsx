'use client'

// La sección de planes/premium fue retirada: la app no tiene niveles de pago.
// Esta ruta solo redirige a "Analizar" para no dejar un enlace roto.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UpgradePage() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/analizar')
    }, [router])
    return null
}

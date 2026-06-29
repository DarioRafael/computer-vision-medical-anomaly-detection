import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PlanProvider } from '@/components/plan'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Pulmia — Detección de Anomalías Médicas con IA',
  description: 'Herramienta de apoyo clínico para análisis de radiografías de tórax mediante visión artificial',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // En Fase 1 el plan está hardcodeado a 'free' porque todavía no hay auth.
  // En Fase 4 (Supabase Auth) se resolverá leyendo la sesión del usuario.
  return (
      <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap"
            rel="stylesheet"
        />
      </head>
      {/* suppressHydrationWarning: algunas extensiones del navegador (p. ej. Bitdefender,
          que inyecta bis_register / __processed_*) modifican el <body> antes de que React
          hidrate. Esto evita el falso error de hidratación que provocan. */}
      <body className={inter.variable} suppressHydrationWarning>
        <PlanProvider plan="free">{children}</PlanProvider>
      </body>
      </html>
  )
}
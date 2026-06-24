// Identifica y colorea las cajas de los modelos ESPECIALISTAS para distinguirlas
// de las 14 clases del detector general. Es data-driven: se basa en el nombre de
// clase CANÓNICO que envía el backend (campo `clase`), no en posiciones fijas.

// Color propio por especialista. Si añades otro especialista en el backend,
// basta con registrar aquí su clase canónica.
const COLORES_ESPECIALISTA: Record<string, string> = {
    Tuberculosis: '#A855F7', // violeta
    Pneumonia: '#EC4899',    // rosa/magenta
}

/** ¿La clase proviene de un modelo especialista (no del detector general)? */
export function esEspecialista(clase: string): boolean {
    return clase in COLORES_ESPECIALISTA
}

/** Color propio del especialista, o null si la clase es del detector general. */
export function colorEspecialista(clase: string): string | null {
    return COLORES_ESPECIALISTA[clase] ?? null
}

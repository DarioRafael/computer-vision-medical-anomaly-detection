# Desarrollo de una aplicación para la detección de anomalías médicas usando visión artificial

> Aplicación de apoyo clínico basada en visión artificial para el análisis de radiografías de tórax: clasifica patologías, localiza hallazgos mediante un detector de objetos y explica las decisiones del modelo con mapas de activación.

---

## Descripción

Este proyecto es una aplicación que analiza radiografías de tórax y entrega tres tipos de apoyo al profesional de salud: una estimación de probabilidad de hallazgos, la localización de anomalías mediante cuadros delimitadores sobre la imagen, y un mapa visual de las zonas en las que el modelo basó su decisión. El sistema está concebido como una herramienta de segunda opinión, no como sustituto del criterio médico.

La aplicación expone su funcionalidad a través de una API y una interfaz web, de modo que una misma radiografía puede analizarse y visualizarse con sus resultados de forma interactiva.

---

## Funcionalidades

La aplicación integra tres capacidades de visión artificial sobre radiografías de tórax:

**Clasificación.** Modelos basados en EfficientNet estiman la probabilidad de presencia de hallazgos y de múltiples patologías torácicas a nivel de imagen, devolviendo porcentajes de confianza por condición.

**Detección.** Un sistema de dos etapas localiza anomalías dentro de la radiografía. La primera etapa es un filtro binario que decide si la imagen presenta hallazgos o está limpia; solo cuando hay sospecha, la segunda etapa (un detector de objetos) dibuja cuadros delimitadores sobre las regiones afectadas, cada uno con su clase y nivel de confianza. Este enfoque reduce de forma drástica los falsos positivos en radiografías sin hallazgos.

**Explicabilidad.** Mapas de activación tipo Grad-CAM muestran, sobre la propia radiografía, las zonas que más influyeron en la decisión del clasificador, aportando transparencia a la predicción.

---

## Salidas del sistema

Ante una radiografía de tórax como entrada, la aplicación produce:

- Probabilidad estimada de hallazgos y de patologías individuales
- Localización de anomalías mediante cuadros delimitadores, con clase y confianza por hallazgo
- Mapa de activación (Grad-CAM) de las zonas de atención del modelo
- Resumen estructurado del análisis

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js, React, Tailwind CSS, TypeScript |
| Backend | Python, FastAPI |
| Clasificación | PyTorch, timm (EfficientNet) |
| Detección | Sistema de dos etapas: filtro binario (EfficientNet) + detector de objetos (YOLO / Ultralytics) |
| Explicabilidad | Grad-CAM |
| Formato de imagen | PNG |

---

## Arquitectura del sistema

```
Usuario
   |
   v
Frontend (Next.js + React)
   |  carga la radiografía / muestra resultados (clasificación, detección, Grad-CAM)
   v
API (FastAPI, Python)
   |  preprocesa la imagen y orquesta los modelos
   v
+------------------------+   +-------------------------------+   +-----------------+
|   Clasificadores       |   |   Detección (2 etapas)        |   |   Grad-CAM      |
|   EfficientNet         |   |   filtro binario -> detector  |   |   explicabilidad|
|   probabilidad/clases  |   |   cuadros + clase + confianza |   |   zonas atención|
+------------------------+   +-------------------------------+   +-----------------+
   |
   v
Respuesta: probabilidad + cuadros delimitadores + mapa de activación + resumen
```

---

## Sistema de detección en dos etapas

La detección sigue un enfoque de dos etapas para equilibrar sensibilidad y precisión:

1. **Etapa A — Filtro binario.** Un clasificador EfficientNet decide si la radiografía es normal o presenta hallazgos. Si la considera normal, el análisis de detección termina ahí y no se generan cuadros.
2. **Etapa B — Detector de objetos.** Solo cuando el filtro indica sospecha, un detector localiza las anomalías y dibuja un cuadro delimitador por hallazgo, con su clase y confianza.

Este diseño evita que el detector genere cuadros espurios en radiografías limpias, que son la mayoría en un escenario real de tamizaje.

---

## Patologías consideradas en la detección

El detector contempla 14 categorías de hallazgos torácicos: ensanchamiento aórtico, atelectasia, calcificación, cardiomegalia, consolidación, enfermedad pulmonar intersticial (ILD), infiltración, opacidad pulmonar, nódulo/masa, otras lesiones, derrame pleural, engrosamiento pleural, neumotórax y fibrosis pulmonar.

---

## Datos

Los modelos se entrenan con conjuntos de datos públicos de radiografía de tórax de reconocida validez científica.

### NIH Chest X-ray Dataset
Base para el reconocimiento general de patrones torácicos y la clasificación de patologías.

- 112,120 radiografías frontales de tórax
- 30,805 pacientes únicos
- 14 patologías etiquetadas a nivel de imagen
- Formato PNG en escala de grises

Fuente: [NIH Clinical Center](https://huggingface.co/datasets/alkzar90/NIH-Chest-X-ray-dataset)

### VinDr-CXR
Base para el entrenamiento del detector de anomalías, por contar con anotaciones de localización (cuadros delimitadores) realizadas por radiólogos.

- 15,000 radiografías de tórax anotadas
- Cuadros delimitadores por múltiples radiólogos para 14 categorías de hallazgos
- Anotaciones de localización fusionadas por consenso para el entrenamiento

Fuente: [VinDr-CXR / PhysioNet](https://physionet.org/content/vindr-cxr/)

---

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/DarioRafael/Sistema-de-IA-para-Detecci-n-de-Carcinoma-Pulmonar.git
cd Sistema-de-IA-para-Detecci-n-de-Carcinoma-Pulmonar

# Instalar dependencias del frontend
npm install

# Correr el frontend en desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:3000`.

Para el backend (API de inferencia), instalar las dependencias de Python y levantar el servidor:

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

La API estará disponible en `http://localhost:8000` y su documentación interactiva en `http://localhost:8000/docs`.

---

## Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo del frontend
npm run build    # Compilar para producción
npm run start    # Iniciar servidor de producción
npm run lint     # Revisión de código
```

---

## Autor

Darío Rafael García Bárcenas

---

## Estado del proyecto

Repositorio en desarrollo activo. La arquitectura, los datos y los enfoques técnicos pueden cambiar conforme avancen el entrenamiento y la validación de los modelos.

---

> Esta aplicación es una herramienta de apoyo clínico. No constituye un diagnóstico médico. El criterio del profesional de salud es siempre determinante.
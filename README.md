# Portfolio Fotográfico - Ibon Latorre

Este proyecto es un portfolio web estático diseñado para mostrar trabajos de fotografía y diseño gráfico de **Ibon Latorre**.
Incluye un sistema automatizado para la gestión de las galerías de fotos, optimización de imágenes y generación de miniaturas.

## 🚀 Características

- **Diseño Responsivo**: Adaptado a móviles y escritorio.
- **Galería Dinámica**: Carga de imágenes optimizada con soporte para "Lazy Loading".
- **Filtrado**: Organización por categorías (Eventos, Deportes, etc.), años y meses.
- **Lightbox**: Visualizador de imágenes a pantalla completa con navegación táctil (swipe).
- **Automatización**: Script en Python (`auto-gallery.py`) para procesar nuevas fotos automáticamente.

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla).
- **Automatización**: Python 3.
- **Librerías Python**: `Pillow` (procesamiento de imágenes).
- **Fuentes**: Google Fonts (Cormorant Garamond, Inter).

## 📂 Estructura del Proyecto

El sistema se basa en una estructura de carpetas específica para funcionar correctamente:

- `index.html`: Página de inicio / Landing page.
- `photography.html`: Página principal de la galería fotográfica.
- `style.css`: Estilos globales.
- `gallery.js`: Lógica del frontend para renderizar la galería y filtros.
- `auto-gallery.py`: Script principal para procesar imágenes.
- `links/`: **IMPORTANTE**. Aquí se deben colocar las carpetas con las fotos originales.
    - El script detecta eventos y categorías basándose en el nombre de la carpeta.
- `thumbs/`: (Generado automáticamente) Miniaturas de las fotos.
- `optimized/`: (Generado automáticamente) Versiones optimizadas para web.
- `json/`: (Generado automáticamente) Archivos de datos con la información de las fotos.

## ⚙️ Instalación y Requisitos

Para utilizar el sistema de automatización, necesitas tener instalado **Python 3** y la librería **Pillow**.

1.  **Instalar Python**: Descárgalo desde [python.org](https://www.python.org/).
2.  **Instalar dependencias**:
    ```bash
    pip install Pillow
    ```

## 📸 Cómo Añadir Nuevas Fotos

El flujo de trabajo para actualizar el portfolio es el siguiente:

1.  Crea una nueva carpeta dentro del directorio `links/`.
    - *Ejemplo*: `links/partido-futbol-2026`
2.  Coloca las fotos originales (alta calidad) dentro de esa carpeta.
3.  Ejecuta el script de automatización:
    ```bash
    python auto-gallery.py
        # O en Windows simplemente haz doble clic si está configurado, o usa:
    py auto-gallery.py
    ```
4.  El script generará automáticamente:
    - Miniaturas en `thumbs/`.
    - Imágenes optimizadas en `optimized/`.
    - Archivos JSON actualizados en `json/`.
5.  ¡Listo! Abre `photography.html` para ver los cambios.

## 📝 Notas Adicionales

- El script `auto-gallery.py` detecta si las imágenes ya han sido procesadas para no repetir el trabajo.
- Puedes personalizar los tamaños de las imágenes editando las variables `width` en las funciones `create_thumbnail` y `create_optimized` dentro del script de Python.

---
&copy; 2026 Ibon Latorre

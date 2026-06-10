# Buscador Documental Académico (DocSearch)

Este es un sistema de búsqueda documental académico de alta velocidad diseñado para catalogar libros y realizar consultas inteligentes utilizando un **Índice Invertido** local sobre una base de datos **SQLite**.

El proyecto incluye un motor backend en Node.js (Express) y una interfaz de usuario premium desarrollada en React, Tailwind CSS y Lucide Icons.

---

## 🚀 Características Principales

1.  **Registro de Libros**: Permite guardar títulos, autores y el contenido completo del documento en la base de datos.
2.  **Procesamiento por Lotes (Batch)**:
    *   **Paso 1 - Extracción**: Tokenización del contenido de los libros.
    *   **Paso 2 - Normalización**: Limpieza de caracteres, eliminación de acentos/tildes y filtrado de *stop words* (palabras vacías en español).
    *   **Paso 3 - Frecuencias**: Cálculo de la frecuencia de aparición y mapeo de posiciones de cada término por documento.
    *   **Paso 4 - Índice Invertido**: Generación y actualización del índice invertido final.
3.  **Buscador Académico**: Recupera instantáneamente los libros relevantes mediante consultas directas sobre el índice invertido. Emplea una fórmula de puntuación académica que evalúa la representatividad y frecuencia del término para ordenar los resultados de forma óptima.
4.  **Optimización**: Ejecución de comandos `VACUUM` y `ANALYZE` en la base de datos SQLite para liberar espacio físico en disco y actualizar las estadísticas de consulta.
5.  **Notificaciones en Tiempo Real (Nuevo)**: Sistema de notificaciones que reporta el éxito de los registros, optimizaciones y finalizaciones de procesos batch. Posee contador de alertas no leídas y se puede marcar como leído o vaciar.
6.  **Historial de Búsquedas (Nuevo)**: Panel interactivo que recuerda tus consultas pasadas y la cantidad de resultados obtenidos. Hacer clic sobre una búsqueda del historial la re-ejecuta automáticamente.

---

## 🛠️ Requisitos Previos

*   [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).
*   [npm](https://www.npmjs.com/) (viene instalado junto con Node.js).

---

## 💻 Ejecución en Local

Sigue estos pasos para levantar el proyecto en tu entorno local:

1.  **Instala las dependencias**:
    ```bash
    npm install
    ```

2.  **Inicia el servidor de desarrollo**:
    ```bash
    npm run dev
    ```

3.  **Abre el proyecto**:
    Navega a [http://localhost:3000](http://localhost:3000) en tu navegador web.

---

## 🗄️ Estructura de Datos (Tablas SQLite)

*   `LIBRO`: Almacena el catálogo de documentos.
*   `TERMINO`: Tabla de términos únicos normalizados.
*   `INDICE_INVERTIDO`: Mapeo n-a-n relacionando términos con libros, frecuencias y posiciones exactas.
*   `NOTIFICATION`: Registro histórico de notificaciones internas del sistema.
*   `HISTORIAL_BUSQUEDA`: Historial de términos buscados por los investigadores.

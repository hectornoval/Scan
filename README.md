# Scan to Bibliography

Herramienta web para generar citas bibliográficas en formato latinoamericano a partir de códigos ISBN.

## Características

- Búsqueda de libros por ISBN
- **Escaneo con cámara** (entrada manual también disponible)
- Formato de cita latinoamericano/ibérico
- Copia al portapapeles con un clic
- Diseño responsive

## Uso

**Opción 1: Entrada Manual**
1. Ingresa el ISBN del libro (con o sin guiones)
2. Haz clic en "Buscar"
3. Copia la cita generada

**Opción 2: Escanear con Cámara**
1. Haz clic en "Activar Cámara para Escanear"
2. Permite el acceso a la cámara
3. Posiciona el código de barras frente a la cámara
4. El ISBN se detectará automáticamente (requiere librería adicional)

## Mejora del Escaneo de Códigos de Barras

Para habilitar el escaneo automático real, agrega QuaggaJS al `index.html`:
```html
<!-- Agregar antes de </body> -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js"></script>
```

Y actualiza la función `detectBarcodeSimple` en `app.js` con:
```javascript
async function detectBarcodeSimple(imageData) {
    return new Promise((resolve) => {
        Quagga.decodeSingle({
            decoder: { readers: ["ean_reader"] },
            locate: true,
            src: imageData
        }, function(result) {
            if (result && result.codeResult) {
                resolve(result.codeResult.code);
            } else {
                resolve(null);
            }
        });
    });
}
```

## Demo

Visita: [tu-usuario.github.io/scan-to-bibliography](https://tu-usuario.github.io/scan-to-bibliography)

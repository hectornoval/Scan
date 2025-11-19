# Scan to Bibliography

Herramienta web para generar citas bibliográficas en formato latinoamericano a partir de códigos ISBN.

## Características

- **Escaneo automático con cámara** - Detección real de códigos de barras ISBN
-  Entrada manual de ISBN como alternativa
-  Formato de cita latinoamericano/ibérico
-  Marco visual con feedback en tiempo real
-  Copia al portapapeles con un clic

## Uso

**Opción 1: Escanear con Cámara (Recomendado)**
1. Haz clic en "Activar Cámara para Escanear"
2. Permite el acceso a la cámara cuando se solicite
3. Coloca el código de barras del libro dentro del marco rectangular
4. ¡El ISBN se detectará automáticamente y buscará el libro!

**Opción 2: Entrada Manual**
1. Escribe o pega el ISBN del libro (con o sin guiones)
2. Haz clic en "Buscar"
3. Copia la cita generada

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

https://hectornoval.github.io/biblio/

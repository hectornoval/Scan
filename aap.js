let currentBookData = null;
let stream = null;
let scanning = false;

document.getElementById('searchBtn').addEventListener('click', searchBook);
document.getElementById('isbnInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBook();
});
document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
document.getElementById('cameraBtn').addEventListener('click', startCamera);
document.getElementById('closeCameraBtn').addEventListener('click', stopCamera);

async function startCamera() {
    try {
        hideError();
        hideResult();
        
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        
        const video = document.getElementById('video');
        video.srcObject = stream;
        
        document.getElementById('cameraBtn').classList.add('hidden');
        document.getElementById('videoContainer').classList.remove('hidden');
        
        scanning = true;
        scanBarcode();
        
    } catch (error) {
        console.error('Camera error:', error);
        showError('No se pudo acceder a la cámara. Verifica los permisos o usa la entrada manual.');
    }
}

function stopCamera() {
    scanning = false;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    document.getElementById('cameraBtn').classList.remove('hidden');
    document.getElementById('videoContainer').classList.add('hidden');
}

async function scanBarcode() {
    if (!scanning) return;
    
    const video = document.getElementById('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (canvas.width > 0 && canvas.height > 0) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Try to detect barcode using simple pattern detection
        // Note: For production, you'd want to use a library like QuaggaJS or ZXing
        const code = await detectBarcodeSimple(imageData);
        
        if (code) {
            stopCamera();
            document.getElementById('isbnInput').value = code;
            await searchBook();
            return;
        }
    }
    
    if (scanning) {
        setTimeout(() => scanBarcode(), 500);
    }
}

async function detectBarcodeSimple(imageData) {
    // This is a simplified placeholder
    // In production, integrate a proper barcode library like:
    // - QuaggaJS: https://github.com/serratus/quaggaJS
    // - ZXing: https://github.com/zxing-js/library
    
    // For now, return null (manual entry required)
    // To add real scanning, include one of these libraries
    return null;
}

async function searchBook() {
    const isbn = document.getElementById('isbnInput').value.trim();
    if (!isbn) return;

    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    showLoading(true);
    hideError();
    hideResult();

    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`);
        
        if (!response.ok) {
            throw new Error('Error al consultar la API');
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const book = data.items[0].volumeInfo;
            currentBookData = {
                authors: book.authors || ['Autor desconocido'],
                year: book.publishedDate ? book.publishedDate.substring(0, 4) : 's.f.',
                title: book.title || 'Sin título',
                subtitle: book.subtitle || '',
                publisher: book.publisher || 'Editorial desconocida',
                city: extractCity(book)
            };
            displayResult();
        } else {
            showError(`No se encontró información para el ISBN: ${cleanISBN}`);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al buscar el libro. Verifica tu conexión a internet.');
    } finally {
        showLoading(false);
    }
}

function extractCity(book) {
    // Try to extract city from various fields
    if (book.publisher && book.publisher.includes(':')) {
        const parts = book.publisher.split(':');
        return parts[0].trim();
    }
    return 's.l.'; // sin lugar
}

function formatCitation() {
    if (!currentBookData) return '';
    
    const authors = currentBookData.authors.map(author => {
        const parts = author.split(' ');
        if (parts.length > 1) {
            const lastName = parts[parts.length - 1];
            const firstNames = parts.slice(0, -1).join(' ');
            return `${lastName.toUpperCase()}, ${firstNames}`;
        }
        return author.toUpperCase();
    }).join('; ');

    const fullTitle = currentBookData.subtitle 
        ? `${currentBookData.title}: ${currentBookData.subtitle}`
        : currentBookData.title;

    return `${authors}. (${currentBookData.year}). <em>${fullTitle}</em>. ${currentBookData.city}: ${currentBookData.publisher}.`;
}

function displayResult() {
    const citation = formatCitation();
    document.getElementById('citation').innerHTML = citation;
    
    const details = `
        <p><span class="font-medium">Autor(es):</span> ${currentBookData.authors.join(', ')}</p>
        <p><span class="font-medium">Título:</span> ${currentBookData.title}</p>
        ${currentBookData.subtitle ? `<p><span class="font-medium">Subtítulo:</span> ${currentBookData.subtitle}</p>` : ''}
        <p><span class="font-medium">Editorial:</span> ${currentBookData.publisher}</p>
        <p><span class="font-medium">Año:</span> ${currentBookData.year}</p>
        <p><span class="font-medium">Ciudad:</span> ${currentBookData.city}</p>
    `;
    document.getElementById('bookDetails').innerHTML = details;
    
    showResult();
}

function copyToClipboard() {
    const citation = formatCitation().replace(/<em>/g, '').replace(/<\/em>/g, '');
    navigator.clipboard.writeText(citation);
    
    const btn = document.getElementById('copyBtn');
    const span = btn.querySelector('span');
    btn.classList.add('copied');
    span.textContent = '¡Copiado!';
    setTimeout(() => {
        btn.classList.remove('copied');
        span.textContent = 'Copiar Cita';
    }, 2000);
}

function showLoading(show) {
    document.getElementById('loading').classList.toggle('hidden', !show);
    document.getElementById('searchBtn').disabled = show;
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.querySelector('p').textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

function showResult() {
    document.getElementById('result').classList.remove('hidden');
}

function hideResult() {
    document.getElementById('result').classList.add('hidden');
}

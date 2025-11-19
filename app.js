let currentBookData = null;
let html5QrCode = null;
let bookHistory = [];

// Load history from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});

document.getElementById('searchBtn').addEventListener('click', searchBook);
document.getElementById('isbnInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBook();
});
document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
document.getElementById('saveToHistoryBtn').addEventListener('click', saveToHistory);
document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
document.getElementById('cameraBtn').addEventListener('click', startCamera);
document.getElementById('closeCameraBtn').addEventListener('click', stopCamera);
document.getElementById('manualEntryBtn').addEventListener('click', stopCamera);

// History Management Functions
function loadHistory() {
    const saved = localStorage.getItem('bookHistory');
    if (saved) {
        bookHistory = JSON.parse(saved);
        updateHistoryDisplay();
    }
}

function saveHistory() {
    localStorage.setItem('bookHistory', JSON.stringify(bookHistory));
    updateHistoryDisplay();
}

function saveToHistory() {
    if (!currentBookData) return;
    
    const entry = {
        ...currentBookData,
        isbn: document.getElementById('isbnInput').value.trim(),
        timestamp: new Date().toISOString(),
        citation: formatCitation().replace(/<em>/g, '').replace(/<\/em>/g, '')
    };
    
    // Check if book already exists in history (by ISBN)
    const existingIndex = bookHistory.findIndex(item => item.isbn === entry.isbn);
    
    if (existingIndex !== -1) {
        // Update existing entry
        bookHistory[existingIndex] = entry;
        showNotification('Libro actualizado en el historial', 'success');
    } else {
        // Add new entry at the beginning
        bookHistory.unshift(entry);
        showNotification('Libro guardado en el historial', 'success');
    }
    
    saveHistory();
}

function clearHistory() {
    if (confirm('¿Estás seguro de que quieres eliminar todo el historial?')) {
        bookHistory = [];
        localStorage.removeItem('bookHistory');
        updateHistoryDisplay();
        showNotification('Historial eliminado', 'info');
    }
}

function deleteHistoryItem(isbn) {
    bookHistory = bookHistory.filter(item => item.isbn !== isbn);
    saveHistory();
    showNotification('Libro eliminado del historial', 'info');
}

function loadFromHistory(isbn) {
    const book = bookHistory.find(item => item.isbn === isbn);
    if (book) {
        currentBookData = book;
        document.getElementById('isbnInput').value = book.isbn;
        displayResult();
        window.scrollTo({ top: document.getElementById('result').offsetTop - 20, behavior: 'smooth' });
    }
}

function updateHistoryDisplay() {
    const historySection = document.getElementById('historySection');
    const historyList = document.getElementById('historyList');
    const historyCount = document.getElementById('historyCount');
    
    historyCount.textContent = bookHistory.length;
    
    if (bookHistory.length === 0) {
        historySection.classList.add('hidden');
        return;
    }
    
    historySection.classList.remove('hidden');
    
    historyList.innerHTML = bookHistory.map(book => `
        <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div class="flex justify-between items-start gap-4">
                <div class="flex-1 cursor-pointer" onclick="loadFromHistory('${book.isbn}')">
                    <h3 class="font-semibold text-gray-900 mb-1">${book.title}</h3>
                    <p class="text-sm text-gray-600 mb-2">${book.authors.join(', ')} (${book.year})</p>
                    <p class="text-xs text-gray-500">ISBN: ${book.isbn}</p>
                    <p class="text-xs text-gray-400 mt-1">Guardado: ${formatDate(book.timestamp)}</p>
                </div>
                <div class="flex gap-2">
                    <button
                        onclick="copyHistoryCitation('${book.isbn}')"
                        class="p-2 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition-colors"
                        title="Copiar cita"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                    </button>
                    <button
                        onclick="deleteHistoryItem('${book.isbn}')"
                        class="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                        title="Eliminar"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function copyHistoryCitation(isbn) {
    const book = bookHistory.find(item => item.isbn === isbn);
    if (book && book.citation) {
        navigator.clipboard.writeText(book.citation);
        showNotification('Cita copiada al portapapeles', 'success');
    }
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(message, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };
    
    const notification = document.createElement('div');
    notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Camera Functions
async function startCamera() {
    try {
        hideError();
        hideResult();
        
        document.getElementById('cameraBtn').classList.add('hidden');
        document.getElementById('videoContainer').classList.remove('hidden');
        
        html5QrCode = new Html5Qrcode("reader");
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.777778,
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E
            ],
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
            },
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true
        };
        
        await html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanError
        );
        
    } catch (error) {
        console.error('Camera error:', error);
        showError('No se pudo acceder a la cámara. Verifica los permisos en la configuración de tu navegador.');
        document.getElementById('cameraBtn').classList.remove('hidden');
        document.getElementById('videoContainer').classList.add('hidden');
    }
}

async function stopCamera() {
    if (html5QrCode) {
        try {
            await html5QrCode.stop();
            html5QrCode.clear();
        } catch (error) {
            console.error('Error stopping camera:', error);
        }
        html5QrCode = null;
    }
    document.getElementById('cameraBtn').classList.remove('hidden');
    document.getElementById('videoContainer').classList.add('hidden');
}

function onScanSuccess(decodedText, decodedResult) {
    console.log('Barcode detected:', decodedText, decodedResult);
    
    // Clean the barcode
    let cleanCode = decodedText.replace(/[-\s]/g, '');
    
    // Remove any non-numeric characters
    cleanCode = cleanCode.replace(/\D/g, '');
    
    console.log('Cleaned code:', cleanCode);
    
    // Check if it looks like a valid ISBN (10 or 13 digits)
    if (cleanCode.length >= 10 && cleanCode.length <= 13) {
        showNotification('¡ISBN detectado! ' + cleanCode, 'success');
        
        stopCamera();
        document.getElementById('isbnInput').value = cleanCode;
        
        setTimeout(() => {
            searchBook();
        }, 500);
    } else {
        console.log('Invalid ISBN length:', cleanCode.length);
    }
}

function onScanError(errorMessage) {
    // Scanning errors are normal when no barcode is in view
}

// Search and Display Functions
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
    return 's.l.';
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

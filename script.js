// Configuración segura - Sin clave API expuesta
const API_BASE_URL = '/api'; // Usar nuestro backend proxy

// Lista expandida de símbolos de acciones populares para el juego
const STOCK_SYMBOLS = [
    // Tecnología
    'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX',
    'AMD', 'CRM', 'ADBE', 'ORCL', 'INTC', 'CSCO', 'IBM', 'QCOM',
    'UBER', 'LYFT', 'SNAP', 'TWTR', 'SPOT', 'RBLX', 'COIN', 'SQ',
    'PYPL', 'SHOP', 'ZOOM', 'DOCU', 'OKTA', 'CRWD', 'SNOW', 'PLTR',

    // Finanzas
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'V', 'MA', 'BRK.B',
    'USB', 'PNC', 'TFC', 'COF', 'SCHW', 'BLK', 'SPGI', 'ICE', 'CME',

    // Salud y Farmacéuticas
    'JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'ABT', 'CVS', 'DHR',
    'BMY', 'AMGN', 'GILD', 'BIIB', 'VRTX', 'REGN', 'ISRG', 'ZTS',

    // Consumo
    'AMZN', 'WMT', 'HD', 'MCD', 'DIS', 'NKE', 'SBUX', 'TGT', 'LOW',
    'COST', 'KO', 'PEP', 'PG', 'WBA', 'CVS', 'F', 'GM', 'TSLA',

    // Energía y Materiales
    'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PSX', 'VLO', 'KMI', 'OKE',
    'FCX', 'NEM', 'GOLD', 'CLF', 'AA', 'X', 'MT', 'VALE',

    // Telecomunicaciones y Medios
    'T', 'VZ', 'TMUS', 'CMCSA', 'CHTR', 'DIS', 'NFLX', 'PARA', 'WBD',

    // Industrial
    'BA', 'CAT', 'GE', 'LMT', 'RTX', 'HON', 'UPS', 'FDX', 'UBER',
    'DE', 'MMM', 'WM', 'EMR', 'ETN', 'ITW', 'PH', 'CMI',

    // Bienes Raíces
    'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'EXR', 'AVB', 'EQR', 'MAA',

    // Internacional Populares
    'BABA', 'JD', 'PDD', 'BIDU', 'NIO', 'LI', 'XPEV', 'TSM', 'ASML',
    'SAP', 'SONY', 'TM', 'HMC', 'NVS', 'ROCHE', 'NESN', 'UL', 'BP'
];

// Modalidades de juego
const GAME_MODES = {
    PREDICT_PRICE: 'predict_price',    // Modalidad original: predecir precio futuro
    GUESS_STOCK: 'guess_stock'         // Nueva modalidad: adivinar qué stock es
};

// Estado del juego
let gameState = {
    currentRound: 0,
    totalRounds: 10,
    scores: [],
    currentStock: null,
    gameStocks: [],
    totalScore: 0,
    perfectRounds: 0,
    selectedPrice: null,
    historicalChart: null,
    gameMode: GAME_MODES.PREDICT_PRICE, // Modalidad por defecto
    stockRevealed: false, // Para controlar cuándo revelar el nombre del stock
    selectedMode: null, // Para almacenar la selección de modalidad
    gameStartTime: null
};

// Referencias DOM
const screens = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    roundResult: document.getElementById('round-result-screen'),
    finalResults: document.getElementById('final-results-screen')
};

const elements = {
    startBtn: document.getElementById('start-game'),
    currentRound: document.getElementById('current-round'),
    progressFill: document.getElementById('progress-fill'),
    stockSymbol: document.getElementById('stock-symbol'),
    stockName: document.getElementById('stock-name'),
    resultSymbol: document.getElementById('result-symbol'),
    resultName: document.getElementById('result-name'),
    historicalDate: document.getElementById('historical-date'),
    historicalPrice: document.getElementById('historical-price'),
    peRatio: document.getElementById('pe-ratio'),
    marketCap: document.getElementById('market-cap'),
    high52w: document.getElementById('high-52w'),
    low52w: document.getElementById('low-52w'),
    volume: document.getElementById('volume'),
    guessInput: document.getElementById('guess-input'),
    submitGuess: document.getElementById('submit-guess'),
    nextRound: document.getElementById('next-round'),
    playAgain: document.getElementById('play-again'),
    resultIcon: document.getElementById('result-icon'),
    resultTitle: document.getElementById('result-title'),
    resultSubtitle: document.getElementById('result-subtitle'),
    yourGuess: document.getElementById('your-guess'),
    actualPrice: document.getElementById('actual-price'),
    roundScore: document.getElementById('round-score'),
    accuracyText: document.getElementById('accuracy-text'),
    averageScore: document.getElementById('average-score'),
    perfectRounds: document.getElementById('perfect-rounds'),
    gameDate: document.getElementById('game-date'),
    percentile: document.getElementById('percentile')
};

// Cache para datos de acciones para evitar múltiples llamadas a la API
const stockDataCache = new Map();

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
    initializeGame();
});

function initializeGame() {
    console.log('Inicializando juego...'); // Debug

    // Verificar que todos los elementos DOM existen
    const missingElements = [];
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            missingElements.push(key);
        }
    }

    if (missingElements.length > 0) {
        console.error('Elementos DOM faltantes:', missingElements);
    }

    // Verificar que todas las pantallas existen
    const missingScreens = [];
    for (const [key, screen] of Object.entries(screens)) {
        if (!screen) {
            missingScreens.push(key);
        }
    }

    if (missingScreens.length > 0) {
        console.error('Pantallas DOM faltantes:', missingScreens);
    }

    // Asegurar que solo la pantalla de inicio esté visible
    showScreen('start');

    // Event listeners
    elements.startBtn.addEventListener('click', startGame);
    elements.submitGuess.addEventListener('click', submitGuess);
    elements.nextRound.addEventListener('click', nextRound);
    elements.playAgain.addEventListener('click', restartGame);

    // Manejo de selección de modalidad
    setupModeSelection();

    // Enter para enviar predicción
    elements.guessInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            submitGuess();
        }
    });

    // Listener para input manual - manejar ambas modalidades
    elements.guessInput.addEventListener('input', function (e) {
        updateSubmitButton();
    });

    // Configurar fecha actual
    elements.gameDate.textContent = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    console.log('Juego inicializado correctamente'); // Debug
}

function setupModeSelection() {
    let selectedMode = 'predict_price';
    const modeCards = document.querySelectorAll('.mode-card');

    modeCards.forEach(card => {
        card.addEventListener('click', function () {
            // Remover active de todas las tarjetas
            modeCards.forEach(c => c.classList.remove('active'));

            // Añadir active a la seleccionada
            this.classList.add('active');

            // Guardar selección
            selectedMode = this.dataset.mode;
            console.log('Modalidad seleccionada:', selectedMode);
        });
    });

    // Guardar referencia para usar en startGame
    gameState.selectedMode = selectedMode;

    // Actualizar cuando cambie la selección
    document.addEventListener('click', function (e) {
        if (e.target.closest('.mode-card')) {
            gameState.selectedMode = e.target.closest('.mode-card').dataset.mode;
        }
    });
}

async function startGame() {
    try {
        // Registrar tiempo de inicio del juego
        gameState.gameStartTime = new Date().toISOString();
        
        // Mostrar loading
        elements.startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando datos...';
        elements.startBtn.disabled = true;

        // Determinar modalidad de juego basada en la selección
        const selectedMode = gameState.selectedMode;

        if (selectedMode === 'predict_price') {
            gameState.gameMode = GAME_MODES.PREDICT_PRICE;
        } else if (selectedMode === 'guess_stock') {
            gameState.gameMode = GAME_MODES.GUESS_STOCK;
        } else {
            // Modalidad mixta - alternar o aleatorio
            if (Math.random() < 0.7) {
                gameState.gameMode = GAME_MODES.PREDICT_PRICE;
            } else {
                gameState.gameMode = GAME_MODES.GUESS_STOCK;
            }
        }

        console.log(`Iniciando juego en modalidad: ${gameState.gameMode}`);

        // Seleccionar acciones aleatorias - usar mayor variedad
        const shuffledSymbols = shuffleArray([...STOCK_SYMBOLS]);
        const selectedSymbols = shuffledSymbols.slice(0, gameState.totalRounds);

        // Precargar datos para todas las acciones seleccionadas
        gameState.gameStocks = [];
        let loadedCount = 0;

        for (const symbol of selectedSymbols) {
            try {
                elements.startBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Cargando... (${loadedCount + 1}/${selectedSymbols.length})`;

                const stockData = await fetchStockData(symbol);
                if (stockData) {
                    gameState.gameStocks.push(stockData);
                    loadedCount++;
                } else {
                    // Si falla, usar datos de respaldo
                    gameState.gameStocks.push(createFallbackStockData(symbol, gameState.gameMode));
                    loadedCount++;
                }
            } catch (error) {
                console.warn(`Error cargando datos para ${symbol}:`, error);
                gameState.gameStocks.push(createFallbackStockData(symbol, gameState.gameMode));
                loadedCount++;
            }
        }

        // Asegurar que tenemos exactamente 10 acciones
        while (gameState.gameStocks.length < gameState.totalRounds) {
            const randomSymbol = STOCK_SYMBOLS[Math.floor(Math.random() * STOCK_SYMBOLS.length)];
            gameState.gameStocks.push(createFallbackStockData(randomSymbol, gameState.gameMode));
        }

        // Si hay más de 10, tomar solo las primeras 10
        gameState.gameStocks = gameState.gameStocks.slice(0, gameState.totalRounds);

        // Inicializar estado del juego
        gameState.currentRound = 0;
        gameState.scores = [];
        gameState.totalScore = 0;
        gameState.perfectRounds = 0;
        gameState.selectedPrice = null;
        gameState.stockRevealed = false;

        console.log(`Datos cargados para ${gameState.gameStocks.length} acciones`);

        showScreen('game');
        loadNextRound();

    } catch (error) {
        console.error('Error iniciando el juego:', error);
        alert('Error cargando los datos. Por favor, intenta de nuevo.');
        elements.startBtn.innerHTML = '<i class="fas fa-play"></i> Comenzar Juego';
        elements.startBtn.disabled = false;
    }
}

async function fetchStockData(symbol) {
    // Verificar cache primero
    if (stockDataCache.has(symbol)) {
        console.log(`🗃️ USANDO CACHE para ${symbol} - NO se llama a overview`);
        return stockDataCache.get(symbol);
    }

    console.log(`📡 FETCHING DATA para ${symbol} - SÍ se llamará a overview`);

    try {
        // Llamar a nuestro backend proxy en lugar de la API externa
        const timeSeriesResponse = await fetch(`${API_BASE_URL}/stock/${symbol}/timeseries`);

        if (!timeSeriesResponse.ok) {
            const errorData = await timeSeriesResponse.json();
            throw new Error(errorData.error || `HTTP error! status: ${timeSeriesResponse.status}`);
        }

        const data = await timeSeriesResponse.json();

        const timeSeries = data['Monthly Time Series'];
        const metaData = data['Meta Data'];

        if (!timeSeries || !metaData) {
            throw new Error('Datos no válidos recibidos de la API');
        }

        // Convertir datos a formato utilizable y ordenar por fecha
        const dates = Object.keys(timeSeries).sort((a, b) => new Date(a) - new Date(b));
        const historicalData = dates.map(date => ({
            date: date,
            price: parseFloat(timeSeries[date]['4. close']),
            volume: parseInt(timeSeries[date]['5. volume'])
        }));

        // Calcular fecha de hace exactamente un año
        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);

        // Formatear como YYYY-MM para comparar con datos mensuales
        const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0].substring(0, 7); // YYYY-MM

        console.log(`Buscando datos de hace un año: ${oneYearAgoStr}`); // Debug

        // Encontrar el dato más cercano a hace exactamente un año
        let historicalPoint = null;
        let minDiff = Infinity;

        for (const dataPoint of historicalData) {
            const dataDate = dataPoint.date.substring(0, 7); // YYYY-MM
            const diff = Math.abs(new Date(dataDate + '-01') - new Date(oneYearAgoStr + '-01'));

            console.log(`Comparando ${dataDate} con ${oneYearAgoStr}, diff: ${diff} días`); // Debug

            if (diff < minDiff) {
                minDiff = diff;
                historicalPoint = dataPoint;
            }
        }

        // Si no encontramos un punto cercano (diferencia > 3 meses), usar datos más antiguos
        if (!historicalPoint || minDiff > (90 * 24 * 60 * 60 * 1000)) { // 90 días
            // Usar el dato más antiguo disponible si no hay datos de hace un año
            historicalPoint = historicalData[0];
            console.log(`Usando dato más antiguo disponible: ${historicalPoint.date}`); // Debug
        } else {
            console.log(`Usando dato histórico: ${historicalPoint.date}`); // Debug
        }

        const currentPoint = historicalData[historicalData.length - 1];

        // Obtener datos fundamentales de nuestro backend
        let companyData = {};
        try {
            const overviewResponse = await fetch(`${API_BASE_URL}/stock/${symbol}/overview`);
            if (overviewResponse.ok) {
                companyData = await overviewResponse.json();
            }
        } catch (error) {
            console.warn('No se pudieron obtener datos fundamentales:', error);
        }

        const stockData = {
            symbol: symbol,
            name: companyData.Name || `${symbol} Corporation`,
            historicalPrice: historicalPoint.price,
            currentPrice: currentPoint.price,
            historicalDate: new Date(historicalPoint.date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            peRatio: companyData.PERatio || 'N/A',
            marketCap: formatMarketCap(companyData.MarketCapitalization),
            high52w: parseFloat(companyData['52WeekHigh']) || currentPoint.price * 1.2,
            low52w: parseFloat(companyData['52WeekLow']) || currentPoint.price * 0.8,
            volume: formatVolume(historicalPoint.volume),
            historicalData: historicalData.slice(-24) // Últimos 24 meses para la gráfica
        };

        stockDataCache.set(symbol, stockData);
        return stockData;

    } catch (error) {
        console.error(`Error obteniendo datos para ${symbol}:`, error);
        return null;
    }
}

function createFallbackStockData(symbol, gameMode = GAME_MODES.PREDICT_PRICE) {
    // Datos de ejemplo en caso de fallo de API
    const basePrice = 50 + Math.random() * 200;
    const growth = 0.8 + Math.random() * 0.4; // Entre -20% y +20%

    // Calcular fechas apropiadas según el modo
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    let historicalPrice, currentPrice, historicalDate;

    if (gameMode === GAME_MODES.PREDICT_PRICE) {
        // En modo predict_price: el precio "histórico" es de hace un año, el "actual" es el objetivo
        historicalPrice = basePrice;
        currentPrice = basePrice * growth;
        historicalDate = oneYearAgo.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else {
        // En modo guess_stock: ambos precios son actuales (no necesitamos histórico real)
        historicalPrice = basePrice * growth; // precio actual
        currentPrice = basePrice * growth;    // mismo precio actual
        historicalDate = today.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    console.log(`Generando datos fallback para ${symbol} en modo ${gameMode}`); // Debug
    console.log(`Precio histórico: $${historicalPrice.toFixed(2)}, Precio actual: $${currentPrice.toFixed(2)}`); // Debug

    return {
        symbol: symbol,
        name: `${symbol} Corporation`,
        historicalPrice: historicalPrice,
        currentPrice: currentPrice,
        historicalDate: historicalDate,
        peRatio: (15 + Math.random() * 20).toFixed(1),
        marketCap: formatMarketCap(Math.random() * 1000000000000),
        high52w: currentPrice * (1.1 + Math.random() * 0.3),
        low52w: currentPrice * (0.7 + Math.random() * 0.2),
        volume: formatVolume(Math.random() * 100000000),
        historicalData: generateFallbackHistoricalData(historicalPrice, currentPrice, gameMode)
    };
}

function generateFallbackHistoricalData(startPrice, endPrice, gameMode = GAME_MODES.PREDICT_PRICE) {
    const data = [];
    const months = 24;
    const priceStep = (endPrice - startPrice) / months;

    for (let i = 0; i < months; i++) {
        const date = new Date();
        
        if (gameMode === GAME_MODES.PREDICT_PRICE) {
            // En modo predict_price: generar fechas hacia atrás desde hace un año
            date.setMonth(date.getMonth() - (12 + (months - i)));
        } else {
            // En modo guess_stock: generar fechas hacia atrás desde hoy
            date.setMonth(date.getMonth() - (months - i));
        }

        const basePrice = startPrice + (priceStep * i);
        const noise = basePrice * (Math.random() - 0.5) * 0.1; // ±5% ruido

        data.push({
            date: date.toISOString().split('T')[0],
            price: Math.max(0.01, basePrice + noise),
            volume: Math.floor(Math.random() * 100000000)
        });
    }

    console.log(`Datos históricos generados desde ${data[0].date} hasta ${data[data.length - 1].date} para modo ${gameMode}`); // Debug

    return data;
}

function formatMarketCap(value) {
    if (!value || isNaN(value)) return 'N/A';

    const num = parseFloat(value);
    if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    return `$${num.toFixed(0)}`;
}

function formatVolume(value) {
    if (!value || isNaN(value)) return 'N/A';

    const num = parseFloat(value);
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
}

function loadNextRound() {
    console.log(`Cargando ronda ${gameState.currentRound + 1}...`); // Debug

    gameState.currentRound++;

    // Verificar que tenemos datos para esta ronda
    if (!gameState.gameStocks || gameState.currentRound > gameState.gameStocks.length) {
        console.error('Error: No hay datos para esta ronda');
        alert('Error cargando la ronda. El juego se reiniciará.');
        restartGame();
        return;
    }

    gameState.currentStock = gameState.gameStocks[gameState.currentRound - 1];
    gameState.selectedPrice = null;
    gameState.stockRevealed = false; // Resetear revelación del stock

    console.log(`Cargando datos para: ${gameState.currentStock.symbol}`); // Debug
    console.log(`Modalidad actual: ${gameState.gameMode}`); // Debug

    // Actualizar UI
    elements.currentRound.textContent = gameState.currentRound;
    elements.progressFill.style.width = `${(gameState.currentRound / gameState.totalRounds) * 100}%`;

    // Mostrar información según el modo
    if (gameState.gameMode === GAME_MODES.PREDICT_PRICE) {
        elements.stockSymbol.textContent = 'Descubre el precio actual';
        elements.stockName.textContent = '¿Cuál es el precio actual?';

        // En modo predicción: mostrar datos HISTÓRICOS (hace un año)
        elements.historicalDate.textContent = gameState.currentStock.historicalDate;
        elements.historicalPrice.textContent = `$${gameState.currentStock.historicalPrice.toFixed(2)}`;
        
        // Actualizar etiqueta del precio
        const priceLabel = document.querySelector('.indicator .indicator-label');
        if (priceLabel) {
            priceLabel.textContent = 'Precio (hace 1 año)';
        }
        
        // Actualizar UI para modo predicción de precio
        updateUIForPriceMode();
    } else {
        // En modo guess_stock mostrar el símbolo pero NO el nombre real
        elements.stockSymbol.textContent = 'Descubre la empresa';
        elements.stockName.textContent = '¿Qué empresa es?'; // NO mostrar el nombre real

        // En modo descubrir empresa: mostrar datos ACTUALES
        const today = new Date();
        elements.historicalDate.textContent = today.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        elements.historicalPrice.textContent = `$${gameState.currentStock.currentPrice.toFixed(2)}`;
        
        // Actualizar etiqueta del precio
        const priceLabel = document.querySelector('.indicator .indicator-label');
        if (priceLabel) {
            priceLabel.textContent = 'Precio actual';
        }
        
        // Actualizar UI para modo adivinanza de empresa
        updateUIForStockMode();
    }

    // Mostrar indicadores (siempre actuales)
    elements.peRatio.textContent = gameState.currentStock.peRatio;
    elements.marketCap.textContent = gameState.currentStock.marketCap;
    elements.high52w.textContent = `$${gameState.currentStock.high52w.toFixed(2)}`;
    elements.low52w.textContent = `$${gameState.currentStock.low52w.toFixed(2)}`;
    elements.volume.textContent = gameState.currentStock.volume;

    // Limpiar input y actualizar UI
    elements.guessInput.value = '';
    updateSubmitButton();

    // Crear gráfica histórica interactiva EN AMBOS MODOS
    try {
        createHistoricalChart();
        console.log('Gráfica histórica creada exitosamente'); // Debug
    } catch (chartError) {
        console.error('Error creando gráfica histórica:', chartError);
    }

    // Focus en input
    elements.guessInput.focus();

    console.log(`Ronda ${gameState.currentRound} cargada exitosamente`); // Debug
}

function updateUIForPriceMode() {
    // Cambiar el título de la sección de predicción
    const guessSection = document.querySelector('.guess-section h3');
    if (guessSection) {
        guessSection.textContent = '¿Cuál crees que es el precio actual?';
    }

    // Mostrar símbolo de moneda
    const currency = document.querySelector('.currency');
    if (currency) {
        currency.style.display = 'block';
    }

    // Configurar input para números
    elements.guessInput.type = 'number';
    elements.guessInput.placeholder = '0.00';
    elements.guessInput.step = '0.01';
    elements.guessInput.min = '0';

    // Remover lista de empresas si existe
    removeCompanySearchList();

    // Añadir slider de precio
    addPriceSlider();
}

function addPriceSlider() {
    // Remover slider existente si lo hay
    removePriceSlider();

    if (!gameState.currentStock) return;

    // Calcular rango del slider basado en datos históricos
    const historicalPrices = gameState.currentStock.historicalData.map(d => d.price);
    const minPrice = Math.min(...historicalPrices);
    const maxPrice = Math.max(...historicalPrices);
    const priceRange = maxPrice - minPrice;

    // Expandir el rango un poco para dar más opciones
    const sliderMin = Math.max(0.01, minPrice - priceRange * 0.3);
    const sliderMax = maxPrice + priceRange * 0.3;

    // Crear contenedor del slider
    const sliderContainer = document.createElement('div');
    sliderContainer.id = 'price-slider-container';
    sliderContainer.className = 'price-slider-container';

    sliderContainer.innerHTML = `
        <div class="slider-section">
            <h4>🎯 Slider de Precio</h4>
            <p class="slider-hint">Arrastra para seleccionar el precio que crees que es correcto</p>
            <div class="slider-wrapper">
                <div class="slider-labels">
                    <span class="slider-min">$${sliderMin.toFixed(0)}</span>
                    <span class="slider-current" id="slider-current-price">$${((sliderMin + sliderMax) / 2).toFixed(2)}</span>
                    <span class="slider-max">$${sliderMax.toFixed(0)}</span>
                </div>
                <input type="range" 
                       id="price-slider" 
                       class="price-slider"
                       min="${sliderMin}" 
                       max="${sliderMax}" 
                       step="0.01" 
                       value="${(sliderMin + sliderMax) / 2}">
                <div class="slider-markers">
                    <div class="marker historical" style="left: ${((gameState.currentStock.historicalPrice - sliderMin) / (sliderMax - sliderMin)) * 100}%">
                        <span>Precio hace 1 año<br>$${gameState.currentStock.historicalPrice.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Insertar después del input
    const guessSection = document.querySelector('.guess-section');
    const inputGroup = guessSection.querySelector('.input-group');
    inputGroup.insertAdjacentElement('afterend', sliderContainer);

    // Agregar funcionalidad al slider
    const slider = document.getElementById('price-slider');
    const currentPriceDisplay = document.getElementById('slider-current-price');

    slider.addEventListener('input', function () {
        const selectedPrice = parseFloat(this.value);
        currentPriceDisplay.textContent = `$${selectedPrice.toFixed(2)}`;

        // Actualizar el input principal
        elements.guessInput.value = selectedPrice.toFixed(2);
        gameState.selectedPrice = selectedPrice;
        updateSubmitButton();
    });

    // Sincronizar slider con input manual
    elements.guessInput.addEventListener('input', function () {
        const inputValue = parseFloat(this.value);
        if (!isNaN(inputValue) && inputValue >= sliderMin && inputValue <= sliderMax) {
            slider.value = inputValue;
            currentPriceDisplay.textContent = `$${inputValue.toFixed(2)}`;
        }
    });
}

function removePriceSlider() {
    const existingSlider = document.getElementById('price-slider-container');
    if (existingSlider) {
        existingSlider.remove();
    }
}

function updateUIForStockMode() {
    // Cambiar el título de la sección de predicción
    const guessSection = document.querySelector('.guess-section h3');
    if (guessSection) {
        guessSection.textContent = '¿Qué empresa es?';
    }

    // Ocultar símbolo de moneda
    const currency = document.querySelector('.currency');
    if (currency) {
        currency.style.display = 'none';
    }

    // Configurar input para texto
    elements.guessInput.type = 'text';
    elements.guessInput.placeholder = 'Busca una empresa...';
    elements.guessInput.removeAttribute('step');
    elements.guessInput.removeAttribute('min');

    // Remover slider de precio si existe
    removePriceSlider();

    // Añadir lista de empresas
    addCompanySearchList();
}

function addCompanySearchList() {
    // Remover lista existente si la hay
    removeCompanySearchList();

    // Crear contenedor de la lista
    const listContainer = document.createElement('div');
    listContainer.id = 'company-list-container';
    listContainer.className = 'company-search-container';

    // Crear lista con TODAS las empresas del juego
    const allCompanies = STOCK_SYMBOLS.map(symbol => {
        // Obtener nombre real si está disponible en caché
        const cachedStock = stockDataCache.get(symbol);
        let name = `${symbol} Corporation`; // Nombre por defecto

        // Nombres conocidos para símbolos comunes
        const knownNames = {
            'AAPL': 'Apple Inc.',
            'GOOGL': 'Alphabet Inc. (Google)',
            'MSFT': 'Microsoft Corporation',
            'TSLA': 'Tesla Inc.',
            'AMZN': 'Amazon.com Inc.',
            'META': 'Meta Platforms Inc. (Facebook)',
            'NVDA': 'NVIDIA Corporation',
            'NFLX': 'Netflix Inc.',
            'JPM': 'JPMorgan Chase & Co.',
            'BAC': 'Bank of America Corporation',
            'WMT': 'Walmart Inc.',
            'JNJ': 'Johnson & Johnson',
            'V': 'Visa Inc.',
            'MA': 'Mastercard Incorporated',
            'HD': 'The Home Depot Inc.',
            'PG': 'Procter & Gamble Company',
            'DIS': 'The Walt Disney Company',
            'MCD': 'McDonald\'s Corporation',
            'KO': 'The Coca-Cola Company',
            'PEP': 'PepsiCo Inc.',
            'INTC': 'Intel Corporation',
            'CSCO': 'Cisco Systems Inc.',
            'IBM': 'International Business Machines',
            'QCOM': 'QUALCOMM Incorporated',
            'UBER': 'Uber Technologies Inc.',
            'LYFT': 'Lyft Inc.',
            'SNAP': 'Snap Inc.',
            'SPOT': 'Spotify Technology S.A.',
            'RBLX': 'Roblox Corporation',
            'COIN': 'Coinbase Global Inc.',
            'SQ': 'Block Inc. (Square)',
            'PYPL': 'PayPal Holdings Inc.',
            'SHOP': 'Shopify Inc.',
            'ZOOM': 'Zoom Video Communications',
            'DOCU': 'DocuSign Inc.',
            'OKTA': 'Okta Inc.',
            'CRWD': 'CrowdStrike Holdings Inc.',
            'SNOW': 'Snowflake Inc.',
            'PLTR': 'Palantir Technologies Inc.',
            'WFC': 'Wells Fargo & Company',
            'GS': 'The Goldman Sachs Group Inc.',
            'MS': 'Morgan Stanley',
            'C': 'Citigroup Inc.',
            'AXP': 'American Express Company',
            'USB': 'U.S. Bancorp',
            'PNC': 'The PNC Financial Services Group',
            'TFC': 'Truist Financial Corporation',
            'COF': 'Capital One Financial Corporation',
            'SCHW': 'The Charles Schwab Corporation',
            'BLK': 'BlackRock Inc.',
            'SPGI': 'S&P Global Inc.',
            'ICE': 'Intercontinental Exchange Inc.',
            'CME': 'CME Group Inc.',
            'PFE': 'Pfizer Inc.',
            'UNH': 'UnitedHealth Group Incorporated',
            'ABBV': 'AbbVie Inc.',
            'MRK': 'Merck & Co. Inc.',
            'TMO': 'Thermo Fisher Scientific Inc.',
            'ABT': 'Abbott Laboratories',
            'CVS': 'CVS Health Corporation',
            'DHR': 'Danaher Corporation',
            'BMY': 'Bristol Myers Squibb Company',
            'AMGN': 'Amgen Inc.',
            'GILD': 'Gilead Sciences Inc.',
            'BIIB': 'Biogen Inc.',
            'VRTX': 'Vertex Pharmaceuticals Incorporated',
            'REGN': 'Regeneron Pharmaceuticals Inc.',
            'ISRG': 'Intuitive Surgical Inc.',
            'ZTS': 'Zoetis Inc.',
            'NKE': 'NIKE Inc.',
            'SBUX': 'Starbucks Corporation',
            'TGT': 'Target Corporation',
            'LOW': 'Lowe\'s Companies Inc.',
            'COST': 'Costco Wholesale Corporation',
            'WBA': 'Walgreens Boots Alliance Inc.',
            'F': 'Ford Motor Company',
            'GM': 'General Motors Company',
            'XOM': 'Exxon Mobil Corporation',
            'CVX': 'Chevron Corporation',
            'COP': 'ConocoPhillips',
            'SLB': 'Schlumberger Limited',
            'EOG': 'EOG Resources Inc.',
            'PSX': 'Phillips 66',
            'VLO': 'Valero Energy Corporation',
            'KMI': 'Kinder Morgan Inc.',
            'OKE': 'ONEOK Inc.',
            'FCX': 'Freeport-McMoRan Inc.',
            'NEM': 'Newmont Corporation',
            'GOLD': 'Barrick Gold Corporation',
            'CLF': 'Cleveland-Cliffs Inc.',
            'AA': 'Alcoa Corporation',
            'X': 'United States Steel Corporation',
            'MT': 'ArcelorMittal',
            'VALE': 'Vale S.A.',
            'T': 'AT&T Inc.',
            'VZ': 'Verizon Communications Inc.',
            'TMUS': 'T-Mobile US Inc.',
            'CMCSA': 'Comcast Corporation',
            'CHTR': 'Charter Communications Inc.',
            'PARA': 'Paramount Global',
            'WBD': 'Warner Bros. Discovery Inc.',
            'BA': 'The Boeing Company',
            'CAT': 'Caterpillar Inc.',
            'GE': 'General Electric Company',
            'LMT': 'Lockheed Martin Corporation',
            'RTX': 'RTX Corporation',
            'HON': 'Honeywell International Inc.',
            'UPS': 'United Parcel Service Inc.',
            'FDX': 'FedEx Corporation',
            'DE': 'Deere & Company',
            'MMM': '3M Company',
            'WM': 'Waste Management Inc.',
            'EMR': 'Emerson Electric Co.',
            'ETN': 'Eaton Corporation plc',
            'ITW': 'Illinois Tool Works Inc.',
            'PH': 'Parker-Hannifin Corporation',
            'CMI': 'Cummins Inc.',
            'AMT': 'American Tower Corporation',
            'PLD': 'Prologis Inc.',
            'CCI': 'Crown Castle Inc.',
            'EQIX': 'Equinix Inc.',
            'PSA': 'Public Storage',
            'EXR': 'Extended Stay America Inc.',
            'AVB': 'AvalonBay Communities Inc.',
            'EQR': 'Equity Residential',
            'MAA': 'Mid-America Apartment Communities',
            'BABA': 'Alibaba Group Holding Limited',
            'JD': 'JD.com Inc.',
            'PDD': 'PDD Holdings Inc.',
            'BIDU': 'Baidu Inc.',
            'NIO': 'NIO Inc.',
            'LI': 'Li Auto Inc.',
            'XPEV': 'XPeng Inc.',
            'TSM': 'Taiwan Semiconductor Manufacturing',
            'ASML': 'ASML Holding N.V.',
            'SAP': 'SAP SE',
            'SONY': 'Sony Group Corporation',
            'TM': 'Toyota Motor Corporation',
            'HMC': 'Honda Motor Co. Ltd.',
            'NVS': 'Novartis AG',
            'UL': 'Unilever PLC',
            'BP': 'BP p.l.c.'
        };

        if (cachedStock && cachedStock.name) {
            name = cachedStock.name;
        } else if (knownNames[symbol]) {
            name = knownNames[symbol];
        }

        return { symbol, name };
    });

    const searchList = document.createElement('div');
    searchList.id = 'company-search-list';
    searchList.className = 'company-search-list';

    // Añadir todas las empresas a la lista
    allCompanies.forEach(company => {
        const item = document.createElement('div');
        item.className = 'company-item';
        item.innerHTML = `
            <span class="company-symbol">${company.symbol}</span>
            <span class="company-name">${company.name}</span>
        `;

        item.addEventListener('click', () => {
            elements.guessInput.value = company.name;
            updateSubmitButton();
            searchList.style.display = 'none';
        });

        searchList.appendChild(item);
    });
    
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.textContent = 'No se encontraron empresas';
    noResults.style.display = 'none'; // Ocultar por defecto
    searchList.appendChild(noResults);

    listContainer.innerHTML = `
        <p class="search-hint">💡 Busca entre todas las ${allCompanies.length} empresas del juego</p>
    `;
    listContainer.appendChild(searchList);

    // Insertar después del input
    const guessSection = document.querySelector('.guess-section');
    const inputGroup = guessSection.querySelector('.input-group');
    inputGroup.insertAdjacentElement('afterend', listContainer);

    console.log(`Lista de empresas creada con ${allCompanies.length} empresas`); // Debug

    // Agregar funcionalidad de búsqueda mejorada
    elements.guessInput.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        const items = searchList.querySelectorAll('.company-item');
        let visibleCount = 0;

        console.log(`Buscando: "${query}"`); // Debug

        if (query.length >= 1) {
            searchList.style.display = 'block';
            items.forEach(item => {
                const symbol = item.querySelector('.company-symbol').textContent.toLowerCase();
                const name = item.querySelector('.company-name').textContent.toLowerCase();

                if (symbol.includes(query) || name.includes(query)) {
                    item.style.display = 'flex';
                    visibleCount++;
                } else {
                    item.style.display = 'none';
                }
            });

            console.log(`${visibleCount} empresas encontradas`); // Debug

            // Mostrar cuántos resultados hay
            if (visibleCount === 0) {
                noResults.style.display = 'block';
            } else {
                noResults.style.display = 'none';
            }
        } else {
            searchList.style.display = 'none';
        }
    });

    // Ocultar lista al hacer clic fuera
    document.addEventListener('click', function (e) {
        if (!listContainer.contains(e.target) && e.target !== elements.guessInput) {
            searchList.style.display = 'none';
        }
    });
}

function removeCompanySearchList() {
    const existingContainer = document.getElementById('company-list-container');
    if (existingContainer) {
        existingContainer.remove();
    }
}

function hideHistoricalChart() {
    const chartSection = document.querySelector('.chart-section');
    if (chartSection) {
        chartSection.style.display = 'none';
    }
}

function updateSubmitButton() {
    if (gameState.gameMode === GAME_MODES.PREDICT_PRICE) {
        const value = parseFloat(elements.guessInput.value);
        if (!isNaN(value) && value > 0) {
            gameState.selectedPrice = value;
            elements.submitGuess.textContent = 'Confirmar Predicción';
            elements.submitGuess.disabled = false;
        } else {
            elements.submitGuess.textContent = 'Selecciona en la gráfica o escribe el precio';
            elements.submitGuess.disabled = true;
        }
    } else {
        const value = elements.guessInput.value.trim();
        if (value.length >= 2) {
            elements.submitGuess.textContent = 'Confirmar Empresa';
            elements.submitGuess.disabled = false;
        } else {
            elements.submitGuess.textContent = 'Escribe el nombre de la empresa';
            elements.submitGuess.disabled = true;
        }
    }
}

function createHistoricalChart() {
    // Buscar o crear el contenedor de la gráfica
    let chartSection = document.querySelector('.chart-section');
    if (!chartSection) {
        const chartContainer = document.querySelector('.indicators-grid');
        chartContainer.insertAdjacentHTML('afterend', `
            <div class="chart-section">
                <h4 id="chart-title">Evolución Histórica de Precio</h4>
                <p id="chart-instruction" class="chart-instruction">Analiza la evolución histórica</p>
                <div class="chart-wrapper">
                    <canvas id="historical-chart" width="800" height="400"></canvas>
                </div>
            </div>
        `);

        // Añadir estilos para la nueva sección si no existen
        if (!document.querySelector('#chart-styles')) {
            const style = document.createElement('style');
            style.id = 'chart-styles';
            style.textContent = `
                .chart-section {
                    margin-top: 30px;
                    padding-top: 30px;
                    border-top: 2px solid #f3f4f6;
                    display: block;
                }
                .chart-section h4 {
                    font-size: 1.25rem;
                    color: #1f2937;
                    margin-bottom: 8px;
                    font-weight: 600;
                }
                .chart-instruction {
                    color: #6b7280;
                    margin-bottom: 20px;
                    font-size: 0.875rem;
                }
                .chart-wrapper {
                    position: relative;
                    height: 400px;
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }
                #historical-chart {
                    cursor: crosshair;
                }
            `;
            document.head.appendChild(style);
        }
    } else {
        // Mostrar la sección si estaba oculta
        chartSection.style.display = 'block';
    }

    // Actualizar título e instrucciones según el modo
    const chartTitle = document.getElementById('chart-title');
    const chartInstruction = document.getElementById('chart-instruction');
    
    if (gameState.gameMode === GAME_MODES.PREDICT_PRICE) {
        chartTitle.textContent = 'Evolución Histórica de Precio';
        chartInstruction.textContent = 'Haz clic en la gráfica donde crees que está el precio actual (extremo derecho)';
    } else {
        chartTitle.textContent = 'Evolución Histórica de la Empresa';
        chartInstruction.textContent = 'Observa la evolución del precio para ayudarte a identificar la empresa';
    }

    // Destruir gráfica anterior si existe
    if (gameState.historicalChart) {
        gameState.historicalChart.destroy();
        gameState.historicalChart = null;
    }

    const chartCanvas = document.getElementById('historical-chart');
    if (!chartCanvas) {
        console.error('No se pudo encontrar el canvas de la gráfica');
        return;
    }

    const chartCtx = chartCanvas.getContext('2d');

    const data = gameState.currentStock.historicalData;
    const labels = data.map(d => new Date(d.date).toLocaleDateString('es-ES', {
        year: '2-digit',
        month: 'short'
    }));
    const prices = data.map(d => d.price);

    // Añadir punto futuro para el clic solo en modo predicción
    const futureLabels = gameState.gameMode === GAME_MODES.PREDICT_PRICE ? [...labels, 'Ahora'] : labels;

    gameState.historicalChart = new Chart(chartCtx, {
        type: 'line',
        data: {
            labels: futureLabels,
            datasets: [{
                label: 'Precio ($)',
                data: prices, // Solo datos históricos, no el futuro
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: prices.map(() => '#4f46e5'),
                pointBorderColor: prices.map(() => '#ffffff'),
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'nearest'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    filter: function (tooltipItem) {
                        // No mostrar tooltip para el último punto si no hay dato
                        return tooltipItem.dataIndex < prices.length;
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Periodo',
                        color: '#6b7280'
                    },
                    grid: {
                        color: '#f3f4f6'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Precio ($)',
                        color: '#6b7280'
                    },
                    grid: {
                        color: '#f3f4f6'
                    }
                }
            },
            onClick: (event, activeElements) => {
                console.log('Click detectado en gráfica'); // Debug

                if (gameState.gameMode !== GAME_MODES.PREDICT_PRICE) {
                    console.log('No en modo predict_price, ignorando click');
                    return;
                }

                const rect = chartCanvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                console.log(`Click en canvas: x=${x}, y=${y}`); // Debug

                // Obtener posición relativa al área de datos
                const chartArea = gameState.historicalChart.chartArea;

                if (x >= chartArea.left && x <= chartArea.right && y >= chartArea.top && y <= chartArea.bottom) {
                    // Calcular el valor Y basado en la posición del clic
                    const yScale = gameState.historicalChart.scales.y;
                    const selectedPrice = yScale.getValueForPixel(y);

                    console.log(`Precio calculado: $${selectedPrice}`); // Debug

                    if (selectedPrice > 0) {
                        gameState.selectedPrice = Math.max(0.01, Math.round(selectedPrice * 100) / 100);
                        elements.guessInput.value = gameState.selectedPrice.toFixed(2);
                        updateSubmitButton();

                        console.log(`Precio seleccionado: $${gameState.selectedPrice}`); // Debug

                        // Actualizar gráfica con selección
                        updateChartWithSelection(gameState.selectedPrice);

                        // Feedback visual
                        chartCanvas.style.cursor = 'pointer';
                        setTimeout(() => {
                            chartCanvas.style.cursor = 'crosshair';
                        }, 200);
                    }
                }
            },
            onHover: (event, activeElements) => {
                if (gameState.gameMode === GAME_MODES.PREDICT_PRICE) {
                    const rect = chartCanvas.getBoundingClientRect();
                    const x = event.clientX - rect.left;
                    const chartArea = gameState.historicalChart.chartArea;

                    // Cambiar cursor cuando esté en área clickeable
                    if (x >= chartArea.left && x <= chartArea.right) {
                        chartCanvas.style.cursor = 'crosshair';
                    } else {
                        chartCanvas.style.cursor = 'default';
                    }
                } else {
                    chartCanvas.style.cursor = 'default';
                }
            }
        }
    });

    console.log(`Gráfica creada con éxito para modo ${gameState.gameMode}`); // Debug
}

function updateChartWithSelection(selectedPrice) {
    if (gameState.historicalChart && gameState.gameMode === GAME_MODES.PREDICT_PRICE) {
        const currentData = [...gameState.historicalChart.data.datasets[0].data];
        const currentColors = [...gameState.historicalChart.data.datasets[0].pointBackgroundColor];

        // Añadir el punto seleccionado al final
        if (currentData.length === gameState.currentStock.historicalData.length) {
            currentData.push(selectedPrice);
            currentColors.push('#ef4444'); // Color rojo para el punto seleccionado
        } else {
            // Reemplazar el último punto
            currentData[currentData.length - 1] = selectedPrice;
            currentColors[currentColors.length - 1] = '#ef4444';
        }

        // Actualizar datos de la gráfica
        gameState.historicalChart.data.datasets[0].data = currentData;
        gameState.historicalChart.data.datasets[0].pointBackgroundColor = currentColors;

        gameState.historicalChart.update('none'); // Sin animación para mejor respuesta

        console.log('Gráfica actualizada con selección'); // Debug
    }
}

function submitGuess() {
    if (gameState.gameMode === GAME_MODES.PREDICT_PRICE) {
        submitPriceGuess();
    } else {
        submitStockGuess();
    }
}

function submitPriceGuess() {
    let guess = gameState.selectedPrice || parseFloat(elements.guessInput.value);

    console.log(`Enviando predicción de precio: $${guess} para ${gameState.currentStock.symbol}`); // Debug

    if (isNaN(guess) || guess <= 0) {
        alert('Por favor, selecciona un punto en la gráfica o ingresa un precio válido.');
        return;
    }

    const actualPrice = gameState.currentStock.currentPrice;
    const difference = Math.abs(guess - actualPrice);
    
    // Calcular el rango de precios del activo (volatilidad)
    const priceRange = gameState.currentStock.high52w - gameState.currentStock.low52w;
    
    // Calcular diferencia relativa al rango en lugar del precio absoluto
    // Esto hace la puntuación más justa entre activos volátiles y estables
    const relativeDifference = (difference / priceRange) * 100;
    
    // También mantener el porcentaje tradicional para información
    const percentageDifference = (difference / actualPrice) * 100;

    console.log(`Precio real: $${actualPrice}, Diferencia absoluta: $${difference.toFixed(2)}`); // Debug
    console.log(`Rango del activo: $${priceRange.toFixed(2)} (${gameState.currentStock.low52w.toFixed(2)} - ${gameState.currentStock.high52w.toFixed(2)})`); // Debug
    console.log(`Diferencia relativa al rango: ${relativeDifference.toFixed(2)}%`); // Debug
    console.log(`Diferencia porcentual tradicional: ${percentageDifference.toFixed(2)}%`); // Debug

    // Calcular puntuación basada en la diferencia relativa al rango
    // Fórmula mejorada que penaliza más gradualmente
    let score;
    
    if (relativeDifference < 1) {
        // Predicción perfecta (diferencia < 1% del rango)
        score = 1000;
    } else if (relativeDifference < 3) {
        // Excelente (diferencia < 3% del rango)
        score = Math.round(1000 - (relativeDifference - 1) * 50); // 950-1000 puntos
    } else if (relativeDifference < 8) {
        // Buena (diferencia < 8% del rango)
        score = Math.round(950 - (relativeDifference - 3) * 60); // 650-950 puntos
    } else if (relativeDifference < 15) {
        // Regular (diferencia < 15% del rango)
        score = Math.round(650 - (relativeDifference - 8) * 40); // 370-650 puntos
    } else if (relativeDifference < 25) {
        // Malo (diferencia < 25% del rango)
        score = Math.round(370 - (relativeDifference - 15) * 20); // 170-370 puntos
    } else {
        // Muy malo (diferencia > 25% del rango)
        score = Math.max(0, Math.round(170 - (relativeDifference - 25) * 5)); // 0-170 puntos
    }

    // Asegurar que el score esté en el rango válido
    score = Math.max(0, Math.min(1000, score));

    // Ronda perfecta (diferencia menor al 1% del rango)
    const isPerfect = relativeDifference < 1;
    if (isPerfect) {
        score = 1000;
        gameState.perfectRounds++;
    }

    gameState.scores.push(score);
    gameState.totalScore += score;

    console.log(`Puntuación de la ronda: ${score}, Total acumulado: ${gameState.totalScore}`); // Debug

    // Revelar el stock
    gameState.stockRevealed = true;

    // Pasar la diferencia relativa para mostrar en los resultados
    showRoundResult(guess, actualPrice, score, relativeDifference, isPerfect, 'price');
}

function submitStockGuess() {
    const guess = elements.guessInput.value.trim();

    console.log(`Enviando predicción de empresa: "${guess}" para ${gameState.currentStock.symbol}`); // Debug

    if (!guess || guess.length < 2) {
        alert('Por favor, ingresa el nombre de la empresa.');
        return;
    }

    // Normalizar texto para comparación
    const normalizeText = (text) => text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const guessNormalized = normalizeText(guess);
    const actualNameNormalized = normalizeText(gameState.currentStock.name);

    // También verificar nombres comunes/alternativos
    const alternativeNames = getAlternativeNames(gameState.currentStock.symbol);

    let isCorrect = false;
    let score = 0;

    // Verificación exacta
    if (guessNormalized === actualNameNormalized) {
        isCorrect = true;
        score = 1000;
    }
    // Verificación parcial (contiene palabras clave)
    else if (actualNameNormalized.includes(guessNormalized) || guessNormalized.includes(actualNameNormalized)) {
        isCorrect = true;
        score = 800;
    }
    // Verificar nombres alternativos
    else {
        for (const altName of alternativeNames) {
            const altNormalized = normalizeText(altName);
            if (guessNormalized === altNormalized ||
                altNormalized.includes(guessNormalized) ||
                guessNormalized.includes(altNormalized)) {
                isCorrect = true;
                score = 900;
                break;
            }
        }
    }

    if (isCorrect && score === 1000) {
        gameState.perfectRounds++;
    }

    gameState.scores.push(score);
    gameState.totalScore += score;

    console.log(`Puntuación de la ronda: ${score}, Total acumulado: ${gameState.totalScore}`); // Debug

    // Revelar el stock
    gameState.stockRevealed = true;

    showRoundResult(guess, gameState.currentStock.name, score, 0, isCorrect, 'stock');
}

function getAlternativeNames(symbol) {
    const alternatives = {
        'AAPL': ['Apple', 'Apple Inc'],
        'GOOGL': ['Google', 'Alphabet', 'Alphabet Inc'],
        'MSFT': ['Microsoft', 'Microsoft Corporation'],
        'TSLA': ['Tesla', 'Tesla Inc'],
        'AMZN': ['Amazon', 'Amazon.com'],
        'META': ['Meta', 'Facebook', 'Meta Platforms'],
        'NFLX': ['Netflix'],
        'NVDA': ['NVIDIA', 'Nvidia Corporation'],
        'JPM': ['JPMorgan', 'JP Morgan', 'JPMorgan Chase'],
        'BAC': ['Bank of America', 'BofA'],
        'WMT': ['Walmart', 'Wal-Mart'],
        'JNJ': ['Johnson & Johnson', 'J&J'],
        'V': ['Visa'],
        'MA': ['Mastercard', 'Master Card'],
        'HD': ['Home Depot'],
        'PG': ['Procter & Gamble', 'P&G'],
        'DIS': ['Disney', 'Walt Disney'],
        'MCD': ['McDonalds', 'McDonald\'s'],
        'KO': ['Coca-Cola', 'Coca Cola', 'Coke'],
        'PEP': ['Pepsi', 'PepsiCo']
        // Añadir más según sea necesario
    };

    return alternatives[symbol] || [];
}

function showRoundResult(guess, actual, score, percentageDifference, isPerfect, mode) {
    // IMPORTANTE: Revelar información del stock SIEMPRE después de la predicción
    gameState.stockRevealed = true;
    elements.stockSymbol.textContent = gameState.currentStock.symbol;
    elements.stockName.textContent = gameState.currentStock.name;
    elements.resultSymbol.textContent = gameState.currentStock.symbol;
    elements.resultName.textContent = gameState.currentStock.name;

    console.log(`Mostrando resultado - Stock revelado: ${gameState.currentStock.symbol} - ${gameState.currentStock.name}`); // Debug

    // Actualizar elementos del resultado según el modo
    if (mode === 'price') {
        elements.yourGuess.textContent = `$${parseFloat(guess).toFixed(2)}`;
        elements.actualPrice.textContent = `$${parseFloat(actual).toFixed(2)}`;
        
        // Calcular información adicional para mostrar
        const difference = Math.abs(guess - actual);
        const priceRange = gameState.currentStock.high52w - gameState.currentStock.low52w;
        const percentageOfPrice = (difference / actual) * 100;
        const relativeDiffForDisplay = (difference / priceRange) * 100;
        
        // Mostrar información más detallada sobre la puntuación
        elements.accuracyText.innerHTML = `
            <div style="font-size: 0.9em; line-height: 1.4;">
                <div><strong>Diferencia:</strong> $${difference.toFixed(2)} (${percentageOfPrice.toFixed(1)}% del precio)</div>
                <div><strong>Rango del activo:</strong> $${gameState.currentStock.low52w.toFixed(2)} - $${gameState.currentStock.high52w.toFixed(2)}</div>
                <div><strong>Dificultad relativa:</strong> ${relativeDiffForDisplay.toFixed(1)}% del rango de volatilidad</div>
            </div>
        `;
    } else {
        elements.yourGuess.textContent = guess;
        elements.actualPrice.textContent = actual;
        elements.accuracyText.textContent = isPerfect ? '¡Correcto!' : 'Incorrecto';
    }

    elements.roundScore.textContent = score;

    // Configurar icono y mensaje según precisión
    let iconClass, title, subtitle;

    if (isPerfect || score === 1000) {
        iconClass = 'excellent';
        title = '¡Perfecto!';
        subtitle = mode === 'price' ? 'Predicción exacta' : '¡Empresa correcta!';
        elements.resultIcon.innerHTML = '<i class="fas fa-bullseye"></i>';
    } else if (score >= 800) {
        iconClass = 'excellent';
        title = '¡Excelente!';
        subtitle = mode === 'price' ? 'Muy cerca del precio real' : '¡Muy cerca!';
        elements.resultIcon.innerHTML = '<i class="fas fa-trophy"></i>';
    } else if (score >= 600) {
        iconClass = 'good';
        title = '¡Bien!';
        subtitle = mode === 'price' ? 'Buena predicción' : 'Buena aproximación';
        elements.resultIcon.innerHTML = '<i class="fas fa-thumbs-up"></i>';
    } else if (score >= 300) {
        iconClass = 'good';
        title = 'No está mal';
        subtitle = 'Puedes mejorar';
        elements.resultIcon.innerHTML = '<i class="fas fa-chart-line"></i>';
    } else {
        iconClass = 'poor';
        title = 'Sigue intentando';
        subtitle = mode === 'price' ? 'Bastante lejos del precio real' : 'Respuesta incorrecta';
        elements.resultIcon.innerHTML = '<i class="fas fa-chart-line-down"></i>';
    }

    elements.resultIcon.className = `result-icon ${iconClass}`;
    elements.resultTitle.textContent = title;
    elements.resultSubtitle.textContent = subtitle;

    // Configurar el texto del botón según si es la última ronda
    if (gameState.currentRound >= gameState.totalRounds) {
        // Última ronda - mostrar "Finalizar Partida"
        elements.nextRound.innerHTML = '<i class="fas fa-flag-checkered"></i> Finalizar Partida';
    } else {
        // Rondas intermedias - mostrar "Siguiente Ronda"
        elements.nextRound.innerHTML = '<i class="fas fa-arrow-right"></i> Siguiente Ronda';
    }

    showScreen('roundResult');
}

function nextRound() {
    console.log(`Ronda actual: ${gameState.currentRound}, Total rondas: ${gameState.totalRounds}`); // Debug

    if (gameState.currentRound < gameState.totalRounds) {
        console.log('Cargando siguiente ronda...'); // Debug
        showScreen('game');
        loadNextRound();
    } else {
        console.log('Juego terminado, mostrando resultados finales...'); // Debug
        showFinalResults();
    }
}

async function showFinalResults() {
    console.log('Iniciando showFinalResults...'); // Debug
    console.log(`Puntuación total: ${gameState.totalScore}, Rondas perfectas: ${gameState.perfectRounds}`); // Debug

    try {
        const averageScore = Math.round(gameState.totalScore / gameState.totalRounds);
        const gameEndTime = new Date().toISOString();

        // Calcular tiempo de juego
        const gameStartTime = gameState.gameStartTime || gameEndTime;

        // Calcular precisión promedio para modos
        let correctGuesses = 0;
        let averageAccuracy = 0;

        if (gameState.gameMode === GAME_MODES.DISCOVER_COMPANY) {
            // Para modo discover, contar respuestas correctas
            correctGuesses = gameState.scores.filter(score => score === 1000).length;
            averageAccuracy = Math.round((correctGuesses / gameState.totalRounds) * 100);
        } else {
            // Para modo predict, calcular precisión basada en scores
            averageAccuracy = Math.round(gameState.scores.reduce((sum, score) => sum + score, 0) / gameState.totalRounds / 10);
        }

        // Primero guardar la puntuación en el servidor
        try {
            console.log('Guardando puntuación en el servidor...');
            const response = await fetch('/api/game/save-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    finalScore: gameState.totalScore,
                    gameMode: gameState.gameMode,
                    roundsPlayed: gameState.totalRounds,
                    correctGuesses: correctGuesses,
                    averageAccuracy: averageAccuracy,
                    gameStartTime: gameStartTime,
                    gameEndTime: gameEndTime
                })
            });

            if (response.ok) {
                const saveResult = await response.json();
                console.log('Puntuación guardada exitosamente:', saveResult);
            } else {
                console.warn('Error guardando puntuación:', response.status);
            }
        } catch (saveError) {
            console.error('Error guardando puntuación:', saveError);
        }

        // Obtener estadísticas reales del servidor
        let globalStats = null;
        let playerStats = null;

        try {
            console.log('Obteniendo estadísticas globales...');
            const globalResponse = await fetch('/api/stats/global');
            if (globalResponse.ok) {
                globalStats = await globalResponse.json();
                console.log('Estadísticas globales obtenidas:', globalStats);
            }

            console.log('Obteniendo estadísticas del jugador...');
            const playerResponse = await fetch('/api/stats/player');
            if (playerResponse.ok) {
                playerStats = await playerResponse.json();
                console.log('Estadísticas del jugador obtenidas:', playerStats);
            }
        } catch (statsError) {
            console.error('Error obteniendo estadísticas:', statsError);
        }

        // Verificar que los elementos existen
        if (!elements.averageScore || !elements.perfectRounds || !elements.percentile) {
            console.error('Error: Elementos de resultados finales no encontrados');
            return;
        }

        // Mostrar puntuación del juego actual
        elements.averageScore.textContent = averageScore;
        elements.perfectRounds.textContent = gameState.perfectRounds;

        // Calcular percentil basado en estadísticas reales
        let percentile = 50; // Default
        if (globalStats && globalStats.totalGames > 0) {
            // Usar estadísticas reales para calcular percentil
            if (averageScore >= globalStats.bestScore * 0.9) percentile = 5;
            else if (averageScore >= globalStats.averageScore * 1.5) percentile = 10;
            else if (averageScore >= globalStats.averageScore * 1.2) percentile = 25;
            else if (averageScore >= globalStats.averageScore) percentile = 50;
            else if (averageScore >= globalStats.averageScore * 0.8) percentile = 75;
            else percentile = 90;
        } else {
            // Fallback al sistema anterior si no hay estadísticas
            percentile = calculatePercentile(averageScore);
        }

        elements.percentile.textContent = `${percentile}%`;

        console.log(`Promedio: ${averageScore}, Percentil: ${percentile}%`); // Debug

        // Generar gráfico de distribución con datos reales
        try {
            await generateRealDistributionChart(averageScore, globalStats);
            console.log('Gráfico de distribución generado exitosamente'); // Debug
        } catch (chartError) {
            console.error('Error generando gráfico de distribución:', chartError);
            // Fallback al gráfico simulado
            generateDistributionChart(averageScore);
        }

        // Añadir información de estadísticas reales si está disponible
        addRealStatsToResults(globalStats, playerStats);

        // Mostrar pantalla de resultados finales
        showScreen('finalResults');
        console.log('Pantalla de resultados finales mostrada'); // Debug

    } catch (error) {
        console.error('Error en showFinalResults:', error);
        alert('Error mostrando los resultados finales. Revisa la consola para más detalles.');
    }
}

function calculatePercentile(score) {
    // Simulación de percentiles basada en la puntuación
    if (score >= 900) return 5;
    if (score >= 800) return 10;
    if (score >= 700) return 25;
    if (score >= 600) return 40;
    if (score >= 500) return 60;
    if (score >= 400) return 75;
    if (score >= 300) return 85;
    return 95;
}

function generateDistributionChart(playerScore) {
    const ctx = document.getElementById('distribution-chart').getContext('2d');

    // Generar datos simulados para la distribución normal
    const labels = [];
    const data = [];
    const backgroundColors = [];

    // Crear rangos de 300 a 4800 en incrementos de 150
    for (let i = 300; i <= 4800; i += 150) {
        labels.push(`${i}-${i + 149}`);

        // Simular distribución normal centrada en ~2100
        const mean = 2100;
        const stdDev = 600;
        const x = i + 75; // punto medio del rango
        const value = Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
        data.push(Math.round(value * 100));

        // Resaltar la barra del jugador
        if (playerScore >= i && playerScore < i + 150) {
            backgroundColors.push('#ef4444');
        } else {
            backgroundColors.push('#06b6d4');
        }
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Rango de Puntuación Promedio',
                        color: '#6b7280',
                        font: {
                            size: 12
                        }
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 10
                        },
                        maxRotation: 45
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Número de Jugadores',
                        color: '#6b7280',
                        font: {
                            size: 12
                        }
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        color: '#e5e7eb'
                    }
                }
            }
        }
    });
}

function restartGame() {
    console.log('Reiniciando juego...'); // Debug

    // Limpiar cache para obtener datos frescos
    stockDataCache.clear();

    // Resetear estado del juego completamente
    gameState.currentRound = 0;
    gameState.scores = [];
    gameState.currentStock = null;
    gameState.gameStocks = [];
    gameState.totalScore = 0;
    gameState.perfectRounds = 0;
    gameState.selectedPrice = null;

    // Resetear botón de inicio
    elements.startBtn.innerHTML = '<i class="fas fa-play"></i> Comenzar Juego';
    elements.startBtn.disabled = false;

    // Destruir gráfica si existe
    if (gameState.historicalChart) {
        gameState.historicalChart.destroy();
        gameState.historicalChart = null;
    }

    // Limpiar cualquier gráfica de distribución existente
    const distributionCanvas = document.getElementById('distribution-chart');
    if (distributionCanvas) {
        const ctx = distributionCanvas.getContext('2d');
        ctx.clearRect(0, 0, distributionCanvas.width, distributionCanvas.height);
    }

    // Limpiar input de predicción
    elements.guessInput.value = '';
    elements.submitGuess.textContent = 'Selecciona en la gráfica o escribe el precio';
    elements.submitGuess.disabled = true;

    // Mostrar pantalla de inicio
    showScreen('start');

    console.log('Juego reiniciado correctamente'); // Debug
}

function showScreen(screenName) {
    console.log(`Mostrando pantalla: ${screenName}`); // Debug

    // Ocultar todas las pantallas
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none'; // Forzar ocultación
    });

    // Mostrar la pantalla solicitada
    switch (screenName) {
        case 'start':
            screens.start.classList.add('active');
            screens.start.style.display = 'block';
            break;
        case 'game':
            screens.game.classList.add('active');
            screens.game.style.display = 'block';
            break;
        case 'roundResult':
            screens.roundResult.classList.add('active');
            screens.roundResult.style.display = 'block';
            break;
        case 'finalResults':
            screens.finalResults.classList.add('active');
            screens.finalResults.style.display = 'block';
            break;
        default:
            console.error(`Pantalla desconocida: ${screenName}`);
            // Por defecto mostrar inicio
            screens.start.classList.add('active');
            screens.start.style.display = 'block';
    }
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Funcionalidad adicional para compartir
document.addEventListener('click', function (e) {
    if (e.target.matches('.share-btn') || e.target.closest('.share-btn')) {
        shareResults();
    }

    if (e.target.matches('.twitter-btn') || e.target.closest('.twitter-btn')) {
        shareOnTwitter();
    }

    if (e.target.matches('.coffee-btn') || e.target.closest('.coffee-btn')) {
        window.open('https://buymeacoffee.com/adrifandango', '_blank');
    }
});

function shareResults() {
    const averageScore = Math.round(gameState.totalScore / gameState.totalRounds);
    const shareText = `¡Jugué StockGuessr y obtuve un promedio de ${averageScore} puntos con ${gameState.perfectRounds} rondas perfectas! ¿Puedes superar mi puntuación?`;
    if (navigator.share) {
        navigator.share({
            title: 'StockGuessr - Mis Resultados',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText + ' ' + window.location.href);
        alert('¡Resultado copiado al portapapeles!');
    }
}

function shareOnTwitter() {
    const averageScore = Math.round(gameState.totalScore / gameState.totalRounds);
    const tweetText = `¡Jugué StockGuessr y obtuve un promedio de ${averageScore} puntos con ${gameState.perfectRounds} rondas perfectas! 📈💰 ¿Puedes superar mi puntuación?`;
    const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(tweetUrl, '_blank');
}

// Nueva función para generar gráfico con datos reales
async function generateRealDistributionChart(playerScore, globalStats) {
    const ctx = document.getElementById('distribution-chart').getContext('2d');

    let labels = [];
    let data = [];
    let backgroundColors = [];

    if (globalStats && globalStats.totalGames > 10) {
        // Usar datos reales si hay suficientes partidas
        try {
            const leaderboardResponse = await fetch('/api/stats/leaderboard?limit=50');
            if (leaderboardResponse.ok) {
                const leaderboard = await leaderboardResponse.json();
                
                // Crear rangos basados en datos reales
                const scores = leaderboard.topScores.map(s => s.score);
                const minScore = Math.min(...scores, playerScore);
                const maxScore = Math.max(...scores, playerScore);
                const range = maxScore - minScore;
                const numBins = 8;
                const binSize = Math.ceil(range / numBins);

                // Crear bins
                for (let i = 0; i < numBins; i++) {
                    const binStart = minScore + (i * binSize);
                    const binEnd = binStart + binSize - 1;
                    labels.push(`${binStart}-${binEnd}`);

                    // Contar cuántos scores caen en este rango
                    const count = scores.filter(score => score >= binStart && score <= binEnd).length;
                    data.push(count);

                    // Resaltar la barra del jugador
                    if (playerScore >= binStart && playerScore <= binEnd) {
                        backgroundColors.push('#ef4444');
                    } else {
                        backgroundColors.push('#06b6d4');
                    }
                }
            }
        } catch (error) {
            console.error('Error obteniendo datos del leaderboard:', error);
            throw error;
        }
    } else {
        // Fallback a datos simulados si no hay suficientes datos reales
        throw new Error('Insuficientes datos reales, usando fallback');
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Distribución de Puntuaciones (Datos Reales)',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    color: '#374151'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Rango de Puntuación',
                        color: '#6b7280',
                        font: {
                            size: 12
                        }
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 10
                        },
                        maxRotation: 45
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Número de Puntuaciones',
                        color: '#6b7280',
                        font: {
                            size: 12
                        }
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        color: '#e5e7eb'
                    }
                }
            }
        }
    });
}

// Nueva función para añadir estadísticas reales a los resultados
function addRealStatsToResults(globalStats, playerStats) {
    // Buscar el contenedor de la puntuación final
    const finalScore = document.querySelector('.final-score');
    if (!finalScore) return;

    // Crear o actualizar sección de estadísticas reales
    let statsSection = document.getElementById('real-stats-section');
    if (!statsSection) {
        statsSection = document.createElement('div');
        statsSection.id = 'real-stats-section';
        statsSection.className = 'real-stats-section';
        finalScore.appendChild(statsSection);
    }

    let statsHTML = '';

    if (globalStats) {
        statsHTML += `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${globalStats.totalGames.toLocaleString()}</div>
                    <div class="stat-label">Partidas Jugadas</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${globalStats.totalPlayers.toLocaleString()}</div>
                    <div class="stat-label">Jugadores Únicos</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${globalStats.averageScore}</div>
                    <div class="stat-label">Promedio Global</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${globalStats.bestScore}</div>
                    <div class="stat-label">Mejor Puntuación</div>
                </div>
            </div>
        `;
    }

    if (playerStats && !playerStats.isNewPlayer) {
        statsHTML += `
            <div class="player-stats">
                <h4>Tus Estadísticas:</h4>
                <div class="player-stats-grid">
                    <div class="player-stat">
                        <span class="player-stat-value">${playerStats.totalGames}</span>
                        <span class="player-stat-label">Partidas Jugadas</span>
                    </div>
                    <div class="player-stat">
                        <span class="player-stat-value">${playerStats.bestScore}</span>
                        <span class="player-stat-label">Tu Mejor Score</span>
                    </div>
                    <div class="player-stat">
                        <span class="player-stat-value">${playerStats.averageScore}</span>
                        <span class="player-stat-label">Tu Promedio</span>
                    </div>
                </div>
            </div>
        `;
    } else if (playerStats && playerStats.isNewPlayer) {
        statsHTML += `
            <div class="player-stats">
                <p class="welcome-message">
                    ¡Bienvenido! Esta es tu primera partida. Tus estadísticas se irán acumulando mientras juegas.
                </p>
            </div>
        `;
    }

    statsSection.innerHTML = statsHTML;
} 
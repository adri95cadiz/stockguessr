// server.js - Servidor proxy para StockGuessr con Financial Modeling Prep API
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// API Key gratuita real de Financial Modeling Prep (250 requests/día)
const FMP_API_KEY = process.env.FMP_API_KEY || 'demo';

// Configuración para producción
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`🚀 Iniciando servidor en modo: ${NODE_ENV}`);
console.log(`🔑 API Key configurada: ${FMP_API_KEY === 'demo' ? 'Demo (limitada)' : 'Personalizada'}`);

// Sistema de caché en memoria
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

// Sistema de persistencia de datos de jugadores
const PLAYERS_DATA_FILE = path.join(__dirname, 'players_data.json');
const GAME_STATS_FILE = path.join(__dirname, 'game_stats.json');

// Función para leer datos de jugadores
function loadPlayersData() {
    try {
        if (fs.existsSync(PLAYERS_DATA_FILE)) {
            const data = fs.readFileSync(PLAYERS_DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error leyendo datos de jugadores:', error);
    }
    return { players: [], games: [] };
}

// Función para guardar datos de jugadores
function savePlayersData(data) {
    try {
        fs.writeFileSync(PLAYERS_DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error guardando datos de jugadores:', error);
        return false;
    }
}

// Función para leer estadísticas del juego
function loadGameStats() {
    try {
        if (fs.existsSync(GAME_STATS_FILE)) {
            const data = fs.readFileSync(GAME_STATS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error leyendo estadísticas del juego:', error);
    }
    return {
        totalGames: 0,
        totalPlayers: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 10000,
        gamesByMode: {
            predict: 0,
            discover: 0
        },
        dailyStats: {},
        topScores: []
    };
}

// Función para guardar estadísticas del juego
function saveGameStats(stats) {
    try {
        fs.writeFileSync(GAME_STATS_FILE, JSON.stringify(stats, null, 2));
        return true;
    } catch (error) {
        console.error('Error guardando estadísticas del juego:', error);
        return false;
    }
}

// Función para generar ID único de jugador (basado en IP + UserAgent)
function generatePlayerId(req) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const crypto = require('crypto');
    return crypto.createHash('md5').update(`${ip}_${userAgent}`).digest('hex').substring(0, 12);
}

// Función para actualizar estadísticas
function updateGameStats(gameData) {
    const stats = loadGameStats();
    const today = new Date().toISOString().split('T')[0];
    
    // Actualizar estadísticas generales
    stats.totalGames++;
    stats.gamesByMode[gameData.gameMode]++;
    
    // Actualizar puntuaciones
    if (gameData.finalScore > stats.bestScore) {
        stats.bestScore = gameData.finalScore;
    }
    if (gameData.finalScore < stats.worstScore) {
        stats.worstScore = gameData.finalScore;
    }
    
    // Calcular promedio
    const allGames = loadPlayersData().games;
    const totalScore = allGames.reduce((sum, game) => sum + game.finalScore, 0) + gameData.finalScore;
    stats.averageScore = Math.round(totalScore / (allGames.length + 1));
    
    // Estadísticas diarias
    if (!stats.dailyStats[today]) {
        stats.dailyStats[today] = { games: 0, uniquePlayers: [] };
    }
    stats.dailyStats[today].games++;
    
    // Añadir jugador único si no existe
    if (!stats.dailyStats[today].uniquePlayers.includes(gameData.playerId)) {
        stats.dailyStats[today].uniquePlayers.push(gameData.playerId);
    }
    
    // Top scores (mantener solo top 10)
    stats.topScores.push({
        score: gameData.finalScore,
        date: new Date().toISOString(),
        gameMode: gameData.gameMode,
        playerId: gameData.playerId.substring(0, 8) + '...' // ID parcial por privacidad
    });
    stats.topScores.sort((a, b) => b.score - a.score);
    stats.topScores = stats.topScores.slice(0, 10);
    
    saveGameStats(stats);
    return stats;
}

// Función para generar clave de caché
function getCacheKey(symbol, endpoint, gameMode = null) {
    return `${symbol}_${endpoint}${gameMode ? `_${gameMode}` : ''}`;
}

// Función para obtener datos del caché
function getFromCache(key) {
    const cached = cache.get(key);
    if (!cached) {
        return null;
    }
    
    // Verificar si ha expirado
    if (Date.now() > cached.expiry) {
        cache.delete(key);
        return null;
    }
    
    console.log(`🗃️ Datos recuperados del caché para: ${key}`);
    return cached.data;
}

// Función para guardar datos en el caché
function saveToCache(key, data) {
    const cached = {
        data: data,
        expiry: Date.now() + CACHE_TTL,
        timestamp: new Date().toISOString()
    };
    
    cache.set(key, cached);
    console.log(`💾 Datos guardados en caché para: ${key} (expira en ${CACHE_TTL/60000} min)`);
}

// Función para limpiar caché expirado
function cleanExpiredCache() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, cached] of cache.entries()) {
        if (now > cached.expiry) {
            cache.delete(key);
            cleaned++;
        }
    }
    
    if (cleaned > 0) {
        console.log(`🧹 Limpieza automática: ${cleaned} entradas expiradas eliminadas del caché`);
    }
}

// Limpiar caché cada 10 minutos
setInterval(cleanExpiredCache, 10 * 60 * 1000);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Servir archivos estáticos

// Rate limiting simple
const requestCounts = new Map();
const RATE_LIMIT = 200; // requests per day (conservador para la clave demo)
const RATE_WINDOW = 24 * 60 * 60 * 1000; // 24 horas

function rateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
        return next();
    }
    
    const userData = requestCounts.get(ip);
    
    if (now > userData.resetTime) {
        userData.count = 1;
        userData.resetTime = now + RATE_WINDOW;
    } else {
        userData.count++;
        if (userData.count > RATE_LIMIT) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                details: 'Maximum requests per day reached',
                resetTime: new Date(userData.resetTime).toISOString()
            });
        }
    }
    
    next();
}

// Función para obtener datos de Financial Modeling Prep
async function fetchFromFMP(symbol, endpoint) {
    try {
        console.log(`📈 Obteniendo datos de FMP para ${symbol}...`);
        
        if (endpoint === 'timeseries') {
            // Para datos históricos mensuales de 2 años
            const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${FMP_API_KEY}`;
            console.log(`🔗 URL: ${url}`);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`FMP timeseries HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.historical || data.historical.length === 0) {
                throw new Error('No hay datos históricos disponibles');
            }
            
            // Convertir al formato esperado por el frontend (solo últimos 24 meses)
            const monthlyData = data.historical
                .slice(0, 730) // ~2 años de datos diarios
                .filter((_, index) => index % 30 === 0) // Simular datos mensuales tomando cada 30 días
                .slice(0, 24) // Últimos 24 meses
                .reverse() // Orden cronológico
                .map(item => ({
                    date: item.date,
                    close: item.close,
                    volume: item.volume || 0
                }));
            
            console.log(`✅ Datos históricos obtenidos: ${monthlyData.length} puntos`);
            return { 'Monthly Time Series': monthlyData };
            
        } else if (endpoint === 'overview') {
            // Para datos fundamentales de la empresa
            const url = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_API_KEY}`;
            console.log(`🔗 URL: ${url}`);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`FMP profile HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data || data.length === 0) {
                throw new Error('No se encontró información de la empresa');
            }
            
            const profile = data[0]; // FMP devuelve un array
            
            // Convertir al formato esperado por el frontend
            const overview = {
                Symbol: profile.symbol || symbol,
                Name: profile.companyName || `${symbol} Company`,
                Description: profile.description || `${profile.companyName || symbol} es una empresa que cotiza en el mercado de valores estadounidense.`,
                Sector: profile.sector || 'Technology',
                Industry: profile.industry || 'Software',
                MarketCapitalization: profile.mktCap || Math.floor(Math.random() * 1000000000000),
                PERatio: profile.pe || (Math.random() * 30 + 10).toFixed(2),
                '52WeekHigh': profile.range ? profile.range.split('-')[1] : (profile.price * 1.2).toFixed(2),
                '52WeekLow': profile.range ? profile.range.split('-')[0] : (profile.price * 0.8).toFixed(2),
                DividendYield: profile.lastDiv ? ((profile.lastDiv / profile.price) * 100).toFixed(2) + '%' : 'N/A',
                Beta: profile.beta || (Math.random() * 2 + 0.5).toFixed(2),
                Country: profile.country || 'US',
                Currency: profile.currency || 'USD'
            };
            
            console.log(`✅ Datos fundamentales obtenidos para ${overview.Name}`);
            return overview;
        }
        
    } catch (error) {
        console.error(`❌ Error en FMP API: ${error.message}`);
        throw error;
    }
}

// Función de fallback que genera datos locales
function createFallbackStockData(symbol, endpoint, gameMode = 'predict') {
    console.log(`🔄 Generando datos fallback para ${symbol} (${endpoint})...`);
    
    if (endpoint === 'timeseries') {
        const data = generateFallbackHistoricalData(symbol, gameMode);
        console.log(`✅ Datos históricos fallback generados: ${data['Monthly Time Series'].length} puntos`);
        return data;
    } else if (endpoint === 'overview') {
        const overview = {
            Symbol: symbol,
            Name: getCompanyName(symbol),
            Description: `${getCompanyName(symbol)} es una empresa líder en su sector que cotiza en el mercado de valores estadounidense.`,
            Sector: getSectorForSymbol(symbol),
            Industry: getIndustryForSymbol(symbol),
            MarketCapitalization: Math.floor(Math.random() * 500000000000 + 50000000000),
            PERatio: (Math.random() * 25 + 8).toFixed(2),
            '52WeekHigh': (Math.random() * 50 + 150).toFixed(2),
            '52WeekLow': (Math.random() * 50 + 80).toFixed(2),
            DividendYield: Math.random() > 0.3 ? (Math.random() * 4 + 0.5).toFixed(2) + '%' : 'N/A',
            Beta: (Math.random() * 1.5 + 0.5).toFixed(2),
            Country: 'US',
            Currency: 'USD'
        };
        console.log(`✅ Datos fundamentales fallback generados para ${overview.Name}`);
        return overview;
    }
}

// Funciones auxiliares para datos fallback
function getCompanyName(symbol) {
    const companies = {
        'AAPL': 'Apple Inc.',
        'GOOGL': 'Alphabet Inc.',
        'MSFT': 'Microsoft Corporation',
        'TSLA': 'Tesla Inc.',
        'AMZN': 'Amazon.com Inc.',
        'META': 'Meta Platforms Inc.',
        'NVDA': 'NVIDIA Corporation',
        'NFLX': 'Netflix Inc.',
        'JPM': 'JPMorgan Chase & Co.',
        'BAC': 'Bank of America Corp.',
        'WMT': 'Walmart Inc.',
        'JNJ': 'Johnson & Johnson',
        'V': 'Visa Inc.',
        'PG': 'Procter & Gamble Co.',
        'UNH': 'UnitedHealth Group Inc.',
        'HD': 'Home Depot Inc.',
        'MA': 'Mastercard Inc.',
        'DIS': 'Walt Disney Co.',
        'PYPL': 'PayPal Holdings Inc.',
        'ADBE': 'Adobe Inc.',
        'CRM': 'Salesforce Inc.',
        'NFLX': 'Netflix Inc.',
        'INTC': 'Intel Corporation',
        'VZ': 'Verizon Communications Inc.',
        'KO': 'Coca-Cola Co.',
        'PFE': 'Pfizer Inc.',
        'T': 'AT&T Inc.',
        'MRK': 'Merck & Co Inc.',
        'ABBV': 'AbbVie Inc.',
        'PEP': 'PepsiCo Inc.',
        'AVGO': 'Broadcom Inc.',
        'TMO': 'Thermo Fisher Scientific Inc.',
        'COST': 'Costco Wholesale Corp.',
        'ACN': 'Accenture PLC',
        'TXN': 'Texas Instruments Inc.',
        'LOW': 'Lowe\'s Companies Inc.',
        'QCOM': 'Qualcomm Inc.',
        'HON': 'Honeywell International Inc.',
        'LIN': 'Linde PLC',
        'UPS': 'United Parcel Service Inc.',
        'IBM': 'International Business Machines Corp.',
        'SBUX': 'Starbucks Corp.',
        'GILD': 'Gilead Sciences Inc.',
        'CAT': 'Caterpillar Inc.',
        'INTU': 'Intuit Inc.',
        'ISRG': 'Intuitive Surgical Inc.',
        'GS': 'Goldman Sachs Group Inc.',
        'AXP': 'American Express Co.',
        'BA': 'Boeing Co.',
        'MMM': '3M Co.',
        'AMD': 'Advanced Micro Devices Inc.',
        'BLK': 'BlackRock Inc.',
        'MDLZ': 'Mondelez International Inc.',
        'C': 'Citigroup Inc.',
        'NOW': 'ServiceNow Inc.',
        'ANTM': 'Anthem Inc.',
        'ZTS': 'Zoetis Inc.',
        'SPGI': 'S&P Global Inc.',
        'TJX': 'TJX Companies Inc.',
        'SYK': 'Stryker Corp.',
        'CVS': 'CVS Health Corp.',
        'MO': 'Altria Group Inc.',
        'CB': 'Chubb Ltd.',
        'MMC': 'Marsh & McLennan Companies Inc.',
        'USB': 'U.S. Bancorp',
        'DE': 'Deere & Co.',
        'CI': 'Cigna Corp.',
        'BDX': 'Becton Dickinson and Co.',
        'SO': 'Southern Co.',
        'DUK': 'Duke Energy Corp.',
        'BSX': 'Boston Scientific Corp.',
        'CL': 'Colgate-Palmolive Co.',
        'EL': 'Estee Lauder Companies Inc.',
        'NSC': 'Norfolk Southern Corp.',
        'AON': 'Aon PLC',
        'CSX': 'CSX Corp.',
        'ICE': 'Intercontinental Exchange Inc.',
        'PNC': 'PNC Financial Services Group Inc.',
        'FIS': 'Fidelity National Information Services Inc.',
        'WM': 'Waste Management Inc.',
        'GE': 'General Electric Co.',
        'ECL': 'Ecolab Inc.',
        'ITW': 'Illinois Tool Works Inc.',
        'FISV': 'Fiserv Inc.',
        'GM': 'General Motors Co.',
        'F': 'Ford Motor Co.',
        'ORCL': 'Oracle Corp.',
        'COP': 'ConocoPhillips',
        'XOM': 'Exxon Mobil Corp.',
        'CVX': 'Chevron Corp.'
    };
    
    return companies[symbol] || `${symbol} Corporation`;
}

function getSectorForSymbol(symbol) {
    const sectors = {
        'AAPL': 'Technology', 'GOOGL': 'Technology', 'MSFT': 'Technology', 'TSLA': 'Consumer Cyclical',
        'AMZN': 'Consumer Cyclical', 'META': 'Technology', 'NVDA': 'Technology', 'NFLX': 'Technology',
        'JPM': 'Financial Services', 'BAC': 'Financial Services', 'WMT': 'Consumer Defensive',
        'JNJ': 'Healthcare', 'V': 'Technology', 'PG': 'Consumer Defensive', 'UNH': 'Healthcare'
    };
    
    return sectors[symbol] || 'Technology';
}

function getIndustryForSymbol(symbol) {
    const industries = {
        'AAPL': 'Consumer Electronics', 'GOOGL': 'Internet Content & Information', 'MSFT': 'Software—Infrastructure',
        'TSLA': 'Auto Manufacturers', 'AMZN': 'Internet Retail', 'META': 'Internet Content & Information',
        'NVDA': 'Semiconductors', 'NFLX': 'Entertainment', 'JPM': 'Banks—Diversified', 'BAC': 'Banks—Diversified'
    };
    
    return industries[symbol] || 'Software';
}

function generateFallbackHistoricalData(symbol, gameMode) {
    const monthlyData = [];
    const basePrice = Math.random() * 200 + 50; // Precio base entre $50-$250
    let currentPrice = basePrice;
    const now = new Date();
    
    // Generar 24 meses de datos
    for (let i = 23; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        
        // Simular movimiento del precio con volatilidad realista
        const volatility = 0.05; // 5% de volatilidad mensual
        const randomChange = (Math.random() - 0.5) * 2 * volatility;
        currentPrice = Math.max(currentPrice * (1 + randomChange), 1);
        
        monthlyData.push({
            date: date.toISOString().split('T')[0],
            close: parseFloat(currentPrice.toFixed(2)),
            volume: Math.floor(Math.random() * 50000000 + 10000000) // Volumen entre 10M-60M
        });
    }
    
    return { 'Monthly Time Series': monthlyData };
}

// Health check
app.get('/api/health', (req, res) => {
    try {
        const stats = loadGameStats();
        const playersData = loadPlayersData();
        
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            dataSource: 'Financial Modeling Prep',
            rateLimitPerDay: RATE_LIMIT,
            apiKey: FMP_API_KEY === 'demo' ? 'Demo (limitada)' : 'Configurada',
            cache: {
                entries: cache.size,
                ttlHours: CACHE_TTL / (60 * 60 * 1000)
            },
            gameStats: {
                totalGames: stats.totalGames,
                totalPlayers: playersData.players.length,
                totalGameRecords: playersData.games.length,
                dataFilesExist: {
                    playersData: fs.existsSync(PLAYERS_DATA_FILE),
                    gameStats: fs.existsSync(GAME_STATS_FILE)
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint para datos históricos
app.get('/api/stock/:symbol/timeseries', rateLimit, async (req, res) => {
    const { symbol } = req.params;
    const gameMode = req.query.gameMode || 'predict';
    const cacheKey = getCacheKey(symbol.toUpperCase(), 'timeseries', gameMode);
    
    // Primero verificar caché
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
        res.json(cachedData);
        return;
    }
    
    try {
        const data = await fetchFromFMP(symbol.toUpperCase(), 'timeseries');
        saveToCache(cacheKey, data);
        res.json(data);
    } catch (error) {
        console.warn(`⚠️ FMP falló, usando fallback: ${error.message}`);
        try {
            const fallbackData = createFallbackStockData(symbol.toUpperCase(), 'timeseries', gameMode);
            saveToCache(cacheKey, fallbackData); // También cachear datos de fallback
            res.json(fallbackData);
        } catch (fallbackError) {
            res.status(500).json({
                error: 'Error obteniendo datos históricos',
                details: error.message,
                source: 'Financial Modeling Prep'
            });
        }
    }
});

// Endpoint para información de la empresa
app.get('/api/stock/:symbol/overview', rateLimit, async (req, res) => {
    const { symbol } = req.params;
    const cacheKey = getCacheKey(symbol.toUpperCase(), 'overview');
    
    // Primero verificar caché
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
        res.json(cachedData);
        return;
    }
    
    try {
        const data = await fetchFromFMP(symbol.toUpperCase(), 'overview');
        saveToCache(cacheKey, data);
        res.json(data);
    } catch (error) {
        console.warn(`⚠️ FMP falló, usando fallback: ${error.message}`);
        try {
            const fallbackData = createFallbackStockData(symbol.toUpperCase(), 'overview');
            saveToCache(cacheKey, fallbackData); // También cachear datos de fallback
            res.json(fallbackData);
        } catch (fallbackError) {
            res.status(500).json({
                error: 'Error obteniendo información de la empresa',
                details: error.message,
                source: 'Financial Modeling Prep'
            });
        }
    }
});

// Endpoint para limpiar caché manualmente (útil para desarrollo)
app.post('/api/cache/clear', (req, res) => {
    const previousSize = cache.size;
    cache.clear();
    console.log(`🗑️ Caché limpiado manualmente: ${previousSize} entradas eliminadas`);
    res.json({
        message: 'Caché limpiado exitosamente',
        entriesCleared: previousSize
    });
});

// Endpoint para ver estadísticas de caché
app.get('/api/cache/stats', (req, res) => {
    const stats = {
        totalEntries: cache.size,
        ttlMinutes: CACHE_TTL / 60000,
        entries: []
    };
    
    for (const [key, cached] of cache.entries()) {
        const timeLeft = Math.max(0, cached.expiry - Date.now());
        stats.entries.push({
            key: key,
            timestamp: cached.timestamp,
            expiresIn: Math.round(timeLeft / 1000) + ' segundos'
        });
    }
    
    res.json(stats);
});

// Endpoint para guardar puntuación de partida
app.post('/api/game/save-score', (req, res) => {
    try {
        const { 
            finalScore, 
            gameMode, 
            roundsPlayed, 
            correctGuesses, 
            averageAccuracy,
            gameStartTime,
            gameEndTime 
        } = req.body;
        
        // Validar datos
        if (!finalScore || !gameMode || !roundsPlayed) {
            return res.status(400).json({
                error: 'Datos incompletos',
                details: 'Se requiere finalScore, gameMode y roundsPlayed'
            });
        }
        
        const playerId = generatePlayerId(req);
        const gameData = {
            playerId,
            finalScore,
            gameMode,
            roundsPlayed,
            correctGuesses: correctGuesses || 0,
            averageAccuracy: averageAccuracy || 0,
            gameStartTime: gameStartTime || new Date().toISOString(),
            gameEndTime: gameEndTime || new Date().toISOString(),
            timestamp: new Date().toISOString(),
            ip: req.ip || req.connection.remoteAddress || 'unknown'
        };
        
        // Cargar datos existentes
        const playersData = loadPlayersData();
        
        // Buscar o crear jugador
        let player = playersData.players.find(p => p.playerId === playerId);
        if (!player) {
            player = {
                playerId,
                firstSeen: new Date().toISOString(),
                totalGames: 0,
                bestScore: 0,
                totalScore: 0,
                gamesByMode: { predict: 0, discover: 0 }
            };
            playersData.players.push(player);
        }
        
        // Actualizar estadísticas del jugador
        player.totalGames++;
        player.totalScore += finalScore;
        player.gamesByMode[gameMode]++;
        if (finalScore > player.bestScore) {
            player.bestScore = finalScore;
        }
        player.averageScore = Math.round(player.totalScore / player.totalGames);
        player.lastSeen = new Date().toISOString();
        
        // Guardar partida
        playersData.games.push(gameData);
        
        // Guardar datos
        savePlayersData(playersData);
        
        // Actualizar estadísticas globales
        const updatedStats = updateGameStats(gameData);
        
        console.log(`🎮 Partida guardada: ${playerId.substring(0, 8)}... - Puntuación: ${finalScore} (${gameMode})`);
        
        res.json({
            success: true,
            message: 'Puntuación guardada exitosamente',
            gameId: playersData.games.length,
            playerStats: {
                totalGames: player.totalGames,
                bestScore: player.bestScore,
                averageScore: player.averageScore
            },
            globalStats: {
                totalGames: updatedStats.totalGames,
                averageScore: updatedStats.averageScore,
                bestScore: updatedStats.bestScore
            }
        });
        
    } catch (error) {
        console.error('Error guardando puntuación:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// Endpoint para obtener estadísticas globales
app.get('/api/stats/global', (req, res) => {
    try {
        const stats = loadGameStats();
        const playersData = loadPlayersData();
        
        // Contar jugadores únicos
        const uniquePlayers = new Set(playersData.games.map(game => game.playerId)).size;
        
        // Estadísticas de los últimos 7 días
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentGames = playersData.games.filter(game => 
            new Date(game.timestamp) >= sevenDaysAgo
        );
        
        const response = {
            totalGames: stats.totalGames,
            totalPlayers: uniquePlayers,
            averageScore: stats.averageScore,
            bestScore: stats.bestScore,
            worstScore: stats.worstScore === 10000 ? 0 : stats.worstScore,
            gamesByMode: stats.gamesByMode,
            topScores: stats.topScores,
            recentActivity: {
                gamesLast7Days: recentGames.length,
                uniquePlayersLast7Days: new Set(recentGames.map(game => game.playerId)).size
            },
            lastUpdated: new Date().toISOString()
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Error obteniendo estadísticas globales:', error);
        res.status(500).json({
            error: 'Error obteniendo estadísticas',
            details: error.message
        });
    }
});

// Endpoint para obtener estadísticas del jugador actual
app.get('/api/stats/player', (req, res) => {
    try {
        const playerId = generatePlayerId(req);
        const playersData = loadPlayersData();
        
        const player = playersData.players.find(p => p.playerId === playerId);
        
        if (!player) {
            return res.json({
                isNewPlayer: true,
                totalGames: 0,
                bestScore: 0,
                averageScore: 0,
                gamesByMode: { predict: 0, discover: 0 },
                recentGames: []
            });
        }
        
        // Últimas 5 partidas del jugador
        const playerGames = playersData.games
            .filter(game => game.playerId === playerId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5)
            .map(game => ({
                score: game.finalScore,
                gameMode: game.gameMode,
                roundsPlayed: game.roundsPlayed,
                accuracy: game.averageAccuracy,
                date: game.timestamp
            }));
        
        res.json({
            isNewPlayer: false,
            totalGames: player.totalGames,
            bestScore: player.bestScore,
            averageScore: player.averageScore,
            gamesByMode: player.gamesByMode,
            recentGames: playerGames,
            firstSeen: player.firstSeen,
            lastSeen: player.lastSeen
        });
        
    } catch (error) {
        console.error('Error obteniendo estadísticas del jugador:', error);
        res.status(500).json({
            error: 'Error obteniendo estadísticas del jugador',
            details: error.message
        });
    }
});

// Endpoint para obtener leaderboard
app.get('/api/stats/leaderboard', (req, res) => {
    try {
        const playersData = loadPlayersData();
        const limit = parseInt(req.query.limit) || 10;
        const gameMode = req.query.gameMode; // 'predict', 'discover', o undefined para ambos
        
        let games = playersData.games;
        
        // Filtrar por modo de juego si se especifica
        if (gameMode && ['predict', 'discover'].includes(gameMode)) {
            games = games.filter(game => game.gameMode === gameMode);
        }
        
        // Top scores
        const topScores = games
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, limit)
            .map((game, index) => ({
                rank: index + 1,
                score: game.finalScore,
                gameMode: game.gameMode,
                date: game.timestamp,
                playerId: game.playerId.substring(0, 8) + '...' // ID parcial por privacidad
            }));
        
        // Top players por promedio
        const playerAverages = playersData.players
            .filter(player => player.totalGames >= 3) // Mínimo 3 partidas para aparecer
            .map(player => ({
                playerId: player.playerId.substring(0, 8) + '...',
                averageScore: player.averageScore,
                totalGames: player.totalGames,
                bestScore: player.bestScore
            }))
            .sort((a, b) => b.averageScore - a.averageScore)
            .slice(0, limit)
            .map((player, index) => ({
                rank: index + 1,
                ...player
            }));
        
        res.json({
            topScores,
            topPlayers: playerAverages,
            filter: gameMode || 'all',
            lastUpdated: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error obteniendo leaderboard:', error);
        res.status(500).json({
            error: 'Error obteniendo leaderboard',
            details: error.message
        });
    }
});

// Manejo de errores globales
app.use((error, req, res, next) => {
    console.error('Error global:', error);
    res.status(500).json({
        error: 'Error interno del servidor',
        details: error.message
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
    console.log(`📊 Fuente de datos: Financial Modeling Prep`);
    console.log(`🔑 API Key: ${FMP_API_KEY === 'demo' ? 'Demo (250 requests/día)' : 'Personalizada'}`);
    console.log(`⏰ Rate limit: ${RATE_LIMIT} requests/día por IP`);
}); 
# 📈 StockGuessr

Un juego interactivo donde puedes poner a prueba tus conocimientos financieros prediciendo precios de acciones y adivinando empresas basándote en datos históricos.

## 🎮 Características

- **Dos modos de juego:**
  - **Predict Price**: Predice el precio actual basándote en datos históricos
  - **Discover Company**: Adivina qué empresa es basándote en su gráfico histórico

- **Sistema de puntuación inteligente** basado en volatilidad
- **Estadísticas reales** de jugadores persistentes
- **Gráficos interactivos** con Chart.js
- **Cache inteligente** para optimizar rendimiento
- **API híbrida** con fallback automático

## 🚀 Demo en Vivo

🔗 **[Jugar StockGuessr](https://tu-app.onrender.com)**

## 🛠 Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Chart.js
- **Backend**: Node.js, Express.js
- **API**: Financial Modeling Prep + Sistema de fallback
- **Base de datos**: JSON persistente (fácilmente migrable a SQL)
- **Deploy**: Render

## 📊 Características Técnicas

### Sistema de Puntuación
- Puntuación basada en **volatilidad relativa** del activo
- Máximo 1000 puntos por ronda perfecta
- Algoritmo justo para acciones volátiles vs estables

### Sistema de Cache
- Cache en memoria con TTL de 24 horas
- Limpieza automática cada 10 minutos
- Endpoints de gestión: `/api/cache/stats` y `/api/cache/clear`

### Estadísticas de Jugadores
- Identificación anónima por IP + UserAgent
- Persistencia en archivos JSON
- Estadísticas globales y personales
- Leaderboard en tiempo real

## 🔧 Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/stockguessr.git
cd stockguessr

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# El servidor se ejecutará en http://localhost:3000
```

## 🌐 Deploy en Render

### Variables de Entorno Necesarias:
```
FMP_API_KEY=tu_clave_de_financial_modeling_prep
PORT=3000
NODE_ENV=production
```

### Configuración Automática:
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Auto-deploy**: Habilitado desde GitHub

## 📁 Estructura del Proyecto

```
stockguessr/
├── server.js              # Servidor principal con todas las APIs
├── index.html             # Frontend principal
├── script.js              # Lógica del juego
├── styles.css             # Estilos del juego
├── package.json           # Dependencias y scripts
├── players_data.json      # Datos de jugadores (generado automáticamente)
├── game_stats.json        # Estadísticas globales (generado automáticamente)
└── README.md             # Este archivo
```

## 🎯 API Endpoints

### Juego
- `GET /api/stock/:symbol/timeseries` - Datos históricos
- `GET /api/stock/:symbol/overview` - Información de la empresa
- `POST /api/game/save-score` - Guardar puntuación

### Estadísticas
- `GET /api/stats/global` - Estadísticas globales
- `GET /api/stats/player` - Estadísticas del jugador actual
- `GET /api/stats/leaderboard` - Tabla de clasificación

### Utilidades
- `GET /api/health` - Estado del servidor
- `GET /api/cache/stats` - Estadísticas de cache
- `POST /api/cache/clear` - Limpiar cache

## 🔄 Sistema de Fallback

Si la API externa falla, el sistema automáticamente:
1. Intenta obtener datos de Financial Modeling Prep
2. Si falla, genera datos realistas de fallback
3. Cache ambos tipos de datos por igual
4. Usa datos basados en empresas reales del S&P 500

## 📈 Futuras Mejoras

- [ ] Migración a base de datos PostgreSQL
- [ ] Sistema de autenticación opcional
- [ ] Torneos y competencias
- [ ] Más tipos de instrumentos financieros
- [ ] API propia de datos financieros
- [ ] Modo multijugador en tiempo real

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Añadir nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## ☕ Apóyanos

Si te gusta el proyecto, [¡invítanos un café!](https://buymeacoffee.com/adrifandango)

---

**Desarrollado con ❤️ por [adrifandango](https://github.com/adrifandango)** 
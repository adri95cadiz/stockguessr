# 📈 StockGuessr

**¿Puedes predecir el mercado de valores?**

StockGuessr es un juego web interactivo inspirado en Geoguessr donde los jugadores deben adivinar el precio actual de las acciones basándose en datos e indicadores históricos reales obtenidos de APIs financieras.

## 🎮 Cómo Jugar

1. **Observa los datos históricos reales**: Ve el precio de la acción hace un año junto con indicadores clave como P/E ratio, capitalización de mercado, máximos y mínimos de 52 semanas, y volumen de trading.

2. **Analiza la gráfica histórica**: Observa la evolución del precio durante los últimos 24 meses en una gráfica interactiva.

3. **Haz tu predicción**: 
   - **Opción 1**: Haz clic directamente en la gráfica donde crees que está el precio actual
   - **Opción 2**: Escribe manualmente tu estimación en el campo de texto

4. **Obtén tu puntuación**: Recibe puntos basados en qué tan cerca estuviste del precio real (0-1000 puntos por ronda).

5. **Completa 10 rondas**: Juega con 10 acciones diferentes seleccionadas aleatoriamente de datos reales.

6. **Ve tus estadísticas**: Al final, observa tu promedio de puntuación, rondas perfectas y tu posición en la distribución de jugadores.

## 🎯 Sistema de Puntuación

- **1000 puntos**: Predicción perfecta (diferencia < 1%)
- **900+ puntos**: Excelente (diferencia < 5%)
- **700+ puntos**: Buena predicción (diferencia < 15%)
- **500+ puntos**: Predicción decente (diferencia < 30%)
- **0-499 puntos**: Necesitas mejorar (diferencia > 30%)

## 🚀 Configuración Rápida

### Para datos reales (recomendado):

1. **Obtén una API key gratuita**:
   - Ve a [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
   - Regístrate gratis (sin tarjeta de crédito)
   - Recibirás 500 llamadas API gratuitas por día

2. **Configura tu clave**:
   - Abre `script.js`
   - Reemplaza `const API_KEY = 'demo';` con tu clave real
   - Ejemplo: `const API_KEY = 'TU_CLAVE_AQUI';`

3. **¡Juega con datos reales!**
   - Datos históricos auténticos de Alpha Vantage
   - Información fundamental real de empresas
   - Gráficas con evolución real de precios

### Para prueba inmediata:
- Simplemente abre `index.html` en tu navegador
- El juego funcionará con datos simulados realistas
- Sin configuración necesaria

## 🏆 Características

### 🔥 **Nuevas características principales:**
- **Datos reales de acciones**: Integración con Alpha Vantage API para datos auténticos
- **Gráfica histórica interactiva**: Visualiza 24 meses de evolución de precios
- **Selección por clic**: Haz clic directamente en la gráfica para hacer tu predicción
- **Fallback inteligente**: Si la API falla, usar datos simulados realistas
- **Cache de datos**: Evita llamadas redundantes a la API

### ✨ **Características existentes mejoradas:**
- **15 acciones populares**: AAPL, GOOGL, MSFT, TSLA, NVDA, META, y más
- **Indicadores financieros auténticos**: P/E ratio, capitalización de mercado, rangos de 52 semanas
- **Sistema de puntuación inteligente**: Basado en el porcentaje de diferencia con el precio real
- **Estadísticas visuales**: Gráfico de distribución de puntuaciones y percentiles
- **Interfaz moderna**: Diseño inspirado en Geoguessr con gradientes y animaciones
- **Funcionalidad de compartir**: Comparte tus puntuaciones en redes sociales
- **Totalmente responsive**: Funciona perfectamente en móviles y desktop

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica y accesible
- **CSS3**: Estilos modernos con glassmorphism, gradientes y animaciones
- **JavaScript ES6+**: Lógica del juego, manejo de estado, async/await para APIs
- **Chart.js**: Gráficas interactivas para datos históricos y distribución de puntuaciones
- **Alpha Vantage API**: Datos reales de mercado financiero
- **Font Awesome**: Iconografía profesional
- **Google Fonts (Inter)**: Tipografía moderna y legible

## 📂 Estructura del Proyecto

```
stockguessr/
├── index.html          # Estructura principal del juego
├── styles.css          # Estilos modernos y responsive
├── script.js           # Lógica del juego + integración API
├── README.md           # Este archivo
├── API_SETUP.md        # Guía para configurar API keys
└── [otros archivos]
```

## 🚀 Cómo Ejecutar

### Opción 1: Ejecución local simple
1. Clona este repositorio o descarga los archivos
2. Abre `index.html` en tu navegador web
3. ¡Comienza a jugar inmediatamente con datos simulados!

### Opción 2: Con datos reales (recomendado)
1. Sigue las instrucciones en `API_SETUP.md`
2. Configura tu API key en `script.js`
3. Abre `index.html` en tu navegador
4. ¡Disfruta datos reales de acciones!

### Opción 3: Servidor local
```bash
# Con Python
python -m http.server 8000

# Con Node.js
npx serve .

# Luego visita http://localhost:8000
```

## 📱 Compatibilidad

- ✅ Chrome/Chromium (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Dispositivos móviles (iOS/Android)
- ✅ Funciona offline con datos simulados

## 🎨 Capturas de Pantalla

### Pantalla de Inicio
Interfaz limpia y atractiva que invita a comenzar el juego.

### Pantalla del Juego con Gráfica
Visualización clara de datos de la acción con:
- Indicadores financieros profesionales
- Gráfica histórica interactiva de 24 meses
- Capacidad de hacer clic para seleccionar precio

### Resultados de Ronda
Feedback inmediato sobre tu predicción con comparación visual.

### Estadísticas Finales
Gráfico de distribución y análisis de tu rendimiento vs otros jugadores.

## 🔧 API y Configuración

### Proveedores de datos soportados:
- **Alpha Vantage** (principal): 500 llamadas gratuitas/día
- **Datos simulados** (fallback): Generados algorítmicamente

### Límites y consideraciones:
- **500 llamadas API por día** con plan gratuito
- **Datos de fin de día** (no en tiempo real con plan gratuito)
- **Cache automático** para optimizar uso de API
- **Fallback inteligente** si se exceden los límites

## 🔮 Características Futuras

- [ ] **Más APIs**: Integración con Twelve Data, IEX Cloud
- [ ] **Tiempo real**: Datos en vivo para usuarios premium
- [ ] **Más mercados**: Europa, Asia, criptomonedas
- [ ] **Modo de dificultad**: Principiante, intermedio, experto
- [ ] **Datos variables**: 6 meses, 2 años, 5 años
- [ ] **Sistema de logros**: Badges y desafíos especiales
- [ ] **Leaderboard global**: Competencia mundial
- [ ] **Modo multijugador**: Desafía a tus amigos
- [ ] **Análisis técnico**: RSI, MACD, medias móviles
- [ ] **Predicción por sectores**: Tecnología, salud, energía

## 💡 Inspiración

Este proyecto está inspirado en:
- **Geoguessr**: Por su mecánica de juego adictiva y sistema de puntuación
- **Wordle**: Por su simplicidad y capacidad de compartir resultados
- **Mercados financieros reales**: Por la emoción de predecir precios auténticos
- **TradingView**: Por sus gráficas interactivas y herramientas de análisis

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si tienes ideas para mejorar el juego:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Ideas para contribuir:
- Añadir más APIs de datos financieros
- Mejorar las gráficas interactivas
- Añadir más indicadores técnicos
- Crear nuevos modos de juego
- Mejorar la UI/UX
- Optimizar el rendimiento

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ve el archivo `LICENSE` para más detalles.

## ☕ Apoya el Proyecto

Si disfrutas jugando StockGuessr, considera [comprarme un café](https://buymeacoffee.com/stockguessr) para mantener el proyecto activo y añadir nuevas características.

## 🔗 Enlaces Útiles

- [Alpha Vantage API Documentation](https://www.alphavantage.co/documentation/)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [Configuración de API](./API_SETUP.md)

---

**¡Disfruta prediciendo el mercado con datos reales y pon a prueba tu intuición financiera!** 📊💰

*Última actualización: Incluye gráficas interactivas y datos reales de APIs* 
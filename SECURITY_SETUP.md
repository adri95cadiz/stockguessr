# 🔐 Configuración de Seguridad para StockGuessr

## ⚠️ Problema de Seguridad Identificado

La versión anterior exponía la clave API directamente en el código JavaScript del cliente, lo que permitía que **cualquier persona** pudiera:
- Ver tu clave API en el código fuente
- Usar tu clave para sus propios proyectos  
- Agotar tu límite de 500 llamadas diarias
- Potencialmente hacer que Alpha Vantage bloquee tu acceso

## 🛡️ Solución Implementada: Backend Proxy

Hemos implementado un servidor Node.js que actúa como proxy entre tu aplicación y la API de Alpha Vantage, manteniendo la clave API completamente segura en el servidor.

### Características de Seguridad:

✅ **Clave API oculta**: Nunca se envía al cliente  
✅ **Rate limiting**: Protección contra abuso (100 requests/hora por IP)  
✅ **Validación de entrada**: Solo símbolos válidos de acciones  
✅ **Manejo de errores**: Respuestas seguras sin exponer detalles internos  
✅ **CORS configurado**: Control de acceso desde otros dominios  

## 📋 Instalación y Configuración

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` copiando el ejemplo:

```bash
# En Windows
copy env.example .env

# En Mac/Linux  
cp env.example .env
```

Edita el archivo `.env` con tus valores reales:

```env
# Tu clave API de Alpha Vantage (MANTENER SECRETA)
ALPHA_VANTAGE_API_KEY=NO49Z77SLSD76GM8

# Puerto del servidor
PORT=3000

# Rate limiting
RATE_LIMIT_REQUESTS_PER_HOUR=100

NODE_ENV=production
```

### 3. Ejecutar el Servidor

```bash
# Modo producción
npm start

# Modo desarrollo (con auto-reload)
npm run dev
```

### 4. Acceder a la Aplicación

Abre tu navegador en: `http://localhost:3000`

## 🌐 API Endpoints Disponibles

### Obtener Datos Históricos
```
GET /api/stock/{SYMBOL}/timeseries
```

### Obtener Información de la Empresa
```
GET /api/stock/{SYMBOL}/overview
```

### Estado del Servidor
```
GET /api/health
```

## 🚀 Despliegue en Producción

### Opción 1: Heroku (Recomendada)

1. **Instalar Heroku CLI**
2. **Crear aplicación**:
   ```bash
   heroku create stockguessr-tuusuario
   ```

3. **Configurar variable de entorno en Heroku**:
   ```bash
   heroku config:set ALPHA_VANTAGE_API_KEY=tu_clave_real_aqui
   ```

4. **Desplegar**:
   ```bash
   git add .
   git commit -m "Add secure backend"
   git push heroku main
   ```

### Opción 2: Vercel

1. **Instalar Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Desplegar**:
   ```bash
   vercel
   ```

3. **Configurar variables de entorno** en el dashboard de Vercel

### Opción 3: Railway

1. Conectar tu repositorio GitHub a Railway
2. Configurar `ALPHA_VANTAGE_API_KEY` en las variables de entorno
3. Desplegar automáticamente

## 🔧 Configuración Adicional de Seguridad

### Restricciones de Alpha Vantage

1. **Ir a tu cuenta de Alpha Vantage**
2. **Configurar restricciones de dominio** (solo para planes premium)
3. **Habilitar HTTPS only**

### Rate Limiting Personalizado

Puedes ajustar los límites en `server.js`:

```javascript
const RATE_LIMIT = 50; // requests per hour per IP
const RATE_WINDOW = 60 * 60 * 1000; // 1 hora
```

### CORS Personalizado

Para mayor seguridad, especifica dominios permitidos:

```javascript
app.use(cors({
    origin: ['https://tudominio.com', 'http://localhost:3000'],
    methods: ['GET'],
    allowedHeaders: ['Content-Type']
}));
```

## 🚨 Mejores Prácticas de Seguridad

### ✅ Hacer:
- Mantener el archivo `.env` en `.gitignore`
- Usar HTTPS en producción
- Monitorear logs para detectar abuso
- Rotar claves API periódicamente
- Implementar autenticación para usuarios frecuentes

### ❌ NO Hacer:
- Subir archivos `.env` a repositorios públicos
- Hardcodear claves API en el código
- Usar la misma clave para desarrollo y producción
- Ignorar alertas de rate limiting

## 🔍 Monitoreo y Logs

El servidor registra automáticamente:
- Requests por IP y timestamp
- Símbolos de acciones solicitados  
- Errores de API y rate limiting
- Estado de salud del servidor

Para ver logs en tiempo real:
```bash
# En desarrollo
npm run dev

# En producción con Heroku
heroku logs --tail
```

## 🆘 Solución de Problemas

### Error: "Rate limit exceeded"
**Causa**: Demasiadas requests desde la misma IP  
**Solución**: Esperar o aumentar `RATE_LIMIT`

### Error: "Invalid stock symbol"
**Causa**: Símbolo no válido o formato incorrecto  
**Solución**: Verificar que el símbolo tenga 1-5 letras mayúsculas

### Error: "API call frequency limit reached"
**Causa**: Límite de Alpha Vantage alcanzado  
**Solución**: Esperar hasta el siguiente minuto o considerar plan premium

### Error 500: "Internal server error"
**Causa**: Problema con la clave API o conectividad  
**Solución**: Verificar `.env` y conexión a internet

## 📊 Comparación: Antes vs Después

| Aspecto | Antes (Inseguro) | Después (Seguro) |
|---------|------------------|------------------|
| **Clave API** | ❌ Visible en código | ✅ Oculta en servidor |
| **Rate Limiting** | ❌ Sin control | ✅ 100 req/hora por IP |
| **Validación** | ❌ Básica | ✅ Robusta con regex |
| **Monitoreo** | ❌ Sin logs | ✅ Logs completos |
| **Escalabilidad** | ❌ Limitada | ✅ Lista para producción |
| **Mantenimiento** | ❌ Manual | ✅ Automatizado |

## 🎯 Próximos Pasos Recomendados

1. **Implementar autenticación de usuarios**
2. **Añadir base de datos para estadísticas**
3. **Cache inteligente con Redis**
4. **Notificaciones push**
5. **PWA (Progressive Web App)**
6. **Análisis de uso con Google Analytics**

---

¡Tu aplicación StockGuessr ahora es **completamente segura** y lista para producción! 🚀🔐 
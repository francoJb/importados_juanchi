# Configuración de Entornos

Este proyecto está configurado para funcionar en tres entornos diferentes: **local**, **staging** y **producción**.

## Estructura de archivos `.env`

Cada entorno tiene su propio archivo de configuración:

- **`.env.local`** - Desarrollo local (http://localhost:3000)
- **`.env.staging`** - Staging (https://elda-gestion-staging.onrender.com)
- **`.env.production`** - Producción (https://elda-gestion.onrender.com)
- **`.env.example`** - Plantilla de referencia (NO usar directamente)

## Cómo ejecutar cada entorno

### 1. Desarrollo Local
```bash
# Cargar automáticamente .env.local
npm run dev

# O explícitamente:
NODE_ENV=local npm run dev
```

### 2. Staging
```bash
NODE_ENV=staging npm start
```

Para Render (staging), configurar en Settings → Environment Variables:
```
NODE_ENV=staging
```

### 3. Producción
```bash
NODE_ENV=production npm start
```

Para Render (producción), configurar en Settings → Environment Variables:
```
NODE_ENV=production
```

## Variables de Entorno por Archivo

### Desarrollo Local (`.env.local`)
- Base de datos: `importados_dev`
- Empresa: `jrimport`
- Usuario: `Admin`
- Duración de token: 1 día

### Staging (`.env.staging`)
- Base de datos: `importados_staging`
- Empresa: `jrimport`
- Usuario: `Admin`
- Duración de token: 1 día

### Producción (`.env.production`)
- Base de datos: `importados`
- Empresa: `jrimport`
- Usuario: `Admin`
- Duración de token: 20 días

## Credenciales de Login

Para todos los entornos, el login es:
- **Empresa**: jrimport
- **Usuario**: Admin
- **Contraseña**: (la que corresponde al hash en AUTH_PASSWORD_HASH)

Si necesitas regenerar el hash de contraseña:
```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('tu_contraseña_aqui', 12).then(hash => console.log(hash));
```

## Despliegue en Render

1. Conectar el repositorio a Render
2. En cada servicio (staging y producción):
   - Ir a **Settings** → **Environment**
   - Agregar `NODE_ENV=staging` o `NODE_ENV=production`
   - Asegurarse de que los datos de BD estén configurados correctamente

## Solución de problemas

### ❌ "Credenciales incorrectas" en staging
1. Verifica que `AUTH_EMPRESA`, `AUTH_USER` y `AUTH_PASSWORD_HASH` en `.env.staging` sean idénticos a los que espera el backend
2. Confirma que Render tiene las variables de entorno correctas en Settings
3. Redeploy la aplicación después de cambiar variables

### ❌ Error de conexión a BD
1. Verifica que `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` sean correctos
2. Asegúrate de que el certificado SSL (`isrgrootx1.pem`) existe en la raíz del proyecto
3. Comprueba que el puerto es el correcto (por defecto 3306 para TiDB)

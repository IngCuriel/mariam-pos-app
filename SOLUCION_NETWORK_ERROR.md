# 🔧 Solución: Network Error en APK Android

## ❌ Problema
El APK instalado en el celular muestra "Network error" pero el endpoint funciona desde Chrome.

## 🔍 Causas Posibles

1. **Android bloquea HTTP por defecto** (desde Android 9+)
2. **Faltan permisos de red** en AndroidManifest
3. **URL incorrecta o inaccesible** desde el dispositivo
4. **Firewall o red bloqueando conexiones**

## ✅ Soluciones Aplicadas

### 1. Configuración de `app.json`

Se agregaron:
- **Permisos de red**: `INTERNET` y `ACCESS_NETWORK_STATE`
- **Plugin expo-build-properties**: Para habilitar `usesCleartextTraffic`

### 2. Verificaciones Necesarias

#### A. Verificar que el servidor esté accesible

Desde tu celular, abre Chrome y prueba:
```
http://192.168.0.8:3001/api/categories/showInPOS
```

Si funciona en Chrome pero no en la app, el problema es la configuración de Android.

#### B. Verificar la IP del servidor

La IP `192.168.0.8` debe ser:
- La IP local de tu computadora en la red
- Accesible desde el celular (misma red WiFi)
- No debe cambiar (considera IP estática)

Para verificar tu IP:
- **Windows**: `ipconfig` (buscar "Dirección IPv4")
- **Linux/Mac**: `ifconfig` o `ip addr show`

#### C. Verificar firewall

El firewall debe permitir conexiones en el puerto 3001:

**Windows:**
```powershell
netsh advfirewall firewall add rule name="MariamPOS Backend" dir=in action=allow protocol=TCP localport=3001
```

**Linux:**
```bash
sudo ufw allow 3001/tcp
```

### 3. Reconstruir el APK

Después de los cambios, **debes reconstruir el APK**:

```bash
cd mariam-pos-app
eas build --platform android --profile preview
```

O si usas build local:
```bash
eas build --platform android --profile preview --local
```

## 🔄 Pasos de Diagnóstico

1. **Verificar logs en el dispositivo:**
   - Conecta el celular por USB
   - Activa "Depuración USB"
   - Ejecuta: `adb logcat | grep -i "network\|error\|api"`

2. **Probar con diferentes URLs:**
   - Cambia temporalmente la URL en `app/api/api.js`
   - Prueba con la IP de tu servidor
   - Verifica que funcione desde Chrome en el celular

3. **Verificar conectividad:**
   - Asegúrate de que el celular y la PC estén en la misma red WiFi
   - Prueba hacer ping desde el celular a la IP del servidor (si es posible)

## 📝 Configuración de URL

Si necesitas cambiar la URL del backend, edita `app/api/api.js`:

```javascript
const API_URL = 'http://TU_IP:3001';
```

**Importante:** Después de cambiar la URL, debes reconstruir el APK.

## 🚀 Próximos Pasos

1. Reconstruir el APK con los cambios aplicados
2. Instalar el nuevo APK en el dispositivo
3. Verificar que funcione correctamente
4. Si persiste el error, revisar los logs con `adb logcat`

## 💡 Recomendación

Para producción, considera:
- Usar HTTPS en lugar de HTTP
- Configurar un servidor con dominio fijo
- Usar variables de entorno para la URL de la API


# 🎨 Cómo usar logo-mini-super.ico como icono en Android

## 📋 Pasos necesarios

### Opción 1: Convertir ICO a PNG (Recomendado)

1. **Convertir el archivo .ico a PNG:**
   - Abre `logo-mini-super.ico` en un editor de imágenes (Photoshop, GIMP, Paint.NET, o usa una herramienta online)
   - Exporta como PNG con tamaño **1024x1024 píxeles**
   - Guarda como: `logo-mini-super.png` en `assets/images/`

2. **Herramientas online para convertir:**
   - https://convertio.co/es/ico-png/
   - https://cloudconvert.com/ico-to-png
   - https://www.aconvert.com/image/ico-to-png/

3. **Actualizar app.json:**
   - Cambiar `foregroundImage` para usar el nuevo PNG

### Opción 2: Usar solo el icono general (Más simple)

Si Expo puede generar los iconos desde el .ico, puedes simplificar la configuración.

## ✅ Configuración recomendada

Después de convertir a PNG, actualiza `app.json`:

```json
"android": {
  "adaptiveIcon": {
    "backgroundColor": "#E6F4FE",
    "foregroundImage": "./assets/images/logo-mini-super.png"
  }
}
```

Esto usará tu logo como foreground y el color azul como fondo.


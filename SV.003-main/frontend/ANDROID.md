# GUIAA — App Android (Capacitor)

La app Android empaqueta el frontend React en un WebView nativo y habla con `https://api.guiaa.vet`.

## Requisitos

- Node.js 18+ y npm
- [Android Studio](https://developer.android.com/studio) (SDK 35+, JDK 21)
- Emulador o dispositivo USB con depuración

## Primera vez

```bash
cd frontend
npm install --legacy-peer-deps
npm run android:build
npm run cap:open
```

En Android Studio: espera el sync de Gradle y pulsa **Run** (▶).

## Ciclo diario

Tras cambios en el frontend:

```bash
npm run android:build
```

Luego Run de nuevo en Android Studio (o `npx cap run android` si el SDK está en PATH).

| Script | Qué hace |
|--------|----------|
| `npm run android:build` | `build` web + `cap sync android` |
| `npm run cap:sync` | Solo copia `build/` al proyecto nativo |
| `npm run cap:open` | Abre Android Studio |
| `npm run android:open` | Build + sync + abrir Studio |

## Generar APK / AAB

En Android Studio:

1. **Build → Build Bundle(s) / APK(s) → Build APK(s)** → APK de depuración
2. Para Play Store: **Build → Generate Signed Bundle / APK** (AAB)

Rutas típicas:

- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release AAB: `android/app/build/outputs/bundle/release/app-release.aab`

## Identidad

| Campo | Valor |
|-------|--------|
| App ID | `vet.guiaa.app` |
| Nombre | GUIAA |
| API | `https://api.guiaa.vet` (forzada en shell nativo) |

Para apuntar a otra API en builds de prueba, define `REACT_APP_BACKEND_URL` antes del `npm run build`.

## Notas

- El proyecto nativo vive en `frontend/android/` (versionar en git).
- Push notifications y offline completo quedan para una fase posterior.
- En este PC, si no hay JDK/Android SDK en PATH, usa Android Studio para compilar.

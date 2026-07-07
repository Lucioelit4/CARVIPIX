# Handoff - Login Demo (2026-07-04)

## Estado actual
- El usuario demo sigue reportando fallo intermitente al entrar desde `/login?next=%2Fdashboard`.
- Se confirmo que `POST /api/auth/login` devuelve 200 con `success: true` y `demo: true`.
- Se confirmo que `GET /api/auth/session` devuelve 200 en flujo demo.
- En pruebas internas, el flujo llego a `/dashboard` cuando el click/submit efectivamente se dispara.
- Se observo comportamiento inconsistente del submit en navegador de prueba (click no siempre dispara accion).

## Cambios aplicados
- `app/login/page.tsx`
  - Submit de login consolidado en `submitLogin()`.
  - Disparo por boton y por tecla Enter.
  - Validacion posterior con `/api/auth/session`.
  - Redireccion por navegador con `window.location.replace(redirectPath)`.
  - Mensajes de error claros y control de loading.
  - Escritura de cookies de respaldo para demo y `writeAuthSession('cliente')`.
- `middleware.ts`
  - Fallback controlado para demo en `/dashboard` cuando no llega cookie de sesion a tiempo:
    - `DEMO_AUTH_ENABLED === true`
    - `role === cliente`
    - `membershipStatus === activo || inactivo`

## Validaciones realizadas
- `npx tsc --noEmit`: OK
- `npm run build`: OK
- `npm run lint`: OK sin errores (warnings preexistentes)

## Credenciales demo
- Correo: `demo@carvipix.local`
- Contrasena: `Demo1234!`

## Siguiente paso recomendado (al retomar)
1. Abrir `/login?next=%2Fdashboard`.
2. Ingresar credenciales demo y click en Ingresar.
3. Si vuelve a fallar, abrir DevTools > Network y revisar en orden:
   - `/api/auth/login` (status, payload, Set-Cookie)
   - `/api/auth/session` (status)
   - navegacion a `/dashboard` y posible redirect de middleware.
4. Si el click no dispara submit en ese navegador, revisar overlays o capas que intercepten pointer events sobre el boton.

# 🎯 EXACTAMENTE DÓNDE PEGAR LA API KEY DE RESEND

## 📁 ARCHIVO: `.env.local`

```env
# Created by Vercel CLI
ADMIN_ACCESS_CODE="ADMIN_CODE_PROD_049E46CB93D03D448B28691D"
ADMIN_SECRET="local-admin-session-secret"
CARVIPIX_DATA_CLASSIFICATION="SANDBOX"
CARVIPIX_JWT_SECRET="local-dev-jwt-secret-for-testing-only"
CARVIPIX_TIMEZONE="America/Mazatlan"
COMMUNITY_PUBLISHER_ENABLED="true"
COOKIE_SIGNING_SECRET="local-dev-cookie-secret-for-testing-only"
DATABASE_URL="postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require"
EMAIL_TRANSPORT="resend"

┌─────────────────────────────────────────────────────────────────────────┐
│ 🔴 AQUÍ PEGA TU API KEY:                                                │
│                                                                         │
│ RESEND_API_KEY="re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"            │
│ ↑                                                                       │
│ REEMPLAZA "re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"                 │
│ CON TU API KEY REAL DE RESEND                                           │
│                                                                         │
│ EJEMPLO REAL:                                                           │
│ RESEND_API_KEY="re_RhaAgWXC_MKxfNqjHMJzyuoLiY2g7iqAr"                   │
│ (Este NO funciona, es solo ejemplo)                                     │
└─────────────────────────────────────────────────────────────────────────┘

RESEND_API_KEY="re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"  ← PEGA AQUÍ
RESEND_FROM_EMAIL="noreply@carvipix.com"
RESEND_FROM_NAME="CARVIPIX"

EMAIL_FROM_NAME="CARVIPIX"
EMAIL_NOREPLY_ADDRESS="noreply@carvipix.com"
EMAIL_SUPPORT_ADDRESS="soporte@carvipix.com"
EMAIL_PAYMENTS_ADDRESS="pagos@carvipix.com"
```

---

## 🔍 PASOS EXACTOS

### 1️⃣ Abre el archivo `.env.local`
   - **Ubicación**: `C:\Users\user1\carvipix\.env.local`
   - En VS Code: Ctrl+P → `.env.local` → Enter

### 2️⃣ Busca esta línea:
```
RESEND_API_KEY="re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

### 3️⃣ Reemplaza TODO lo que está entre comillas:
```
ANTES:  RESEND_API_KEY="re_RhaAgWXC_MKxfNqjHMJzyuoLiY2g7iqAr"
DESPUÉS: RESEND_API_KEY="re_TU_API_KEY_REAL_AQUI"
```

### 4️⃣ Guarda el archivo: Ctrl+S

---

## ✅ CONFIRMACIÓN

Cuando pegues correctamente, verás:

```
✅ ANTES (INVÁLIDO):
   RESEND_API_KEY="re_RhaAgWXC_MKxfNqjHMJzyuoLiY2g7iqAr"
   ❌ Error 401: API key is invalid

✅ DESPUÉS (VÁLIDO):
   RESEND_API_KEY="re_XXXXX_XXXXXX_XXXXX"
   ✅ Error 0: Emails funcionando
```

---

## 📧 LUEGO QUE PEGUES:

1. **Guarda el archivo** (Ctrl+S)
2. **Commit a git**:
   ```
   git add .env.local
   git commit -m "fix: update resend api key"
   git push
   ```
3. **Espera 2 minutos** para que Vercel haga redeploy
4. **Prueba el flujo completo**: Registro → Email → Login → Compra → Descarga

---

## 🆘 ¿DÓNDE OBTENGO MI API KEY?

1. Ve a: https://resend.com/api-keys
2. Inicia sesión con tu cuenta de Resend
3. Haz clic en "Create API Key" o copia una existente
4. Copia el valor completo (incluye el `re_` al inicio)
5. **Pégalo en `.env.local`** en la línea de `RESEND_API_KEY`

**¡Listo! Los emails funcionarán automáticamente.**

# 🎯 EXACTAMENTE DÓNDE PEGAR LOS REGISTROS DNS

## EN TU PROVEEDOR DE DNS (GoDaddy, Namecheap, CloudFlare, Hostinger, etc.)

---

## ✅ REGISTRO 1: SPF

```
┌─────────────────────────────────────────────────────────────────┐
│  AGREGAR NUEVO REGISTRO                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tipo:        [TXT ▼]                                          │
│                                                                 │
│  Nombre/Host: [@] o dejar vacío                                │
│                                                                 │
│  Valor:       [v=spf1 include:resend.com ~all                  │
│                                                                 │
│  TTL:         [3600] (o dejar por defecto)                     │
│                                                                 │
│                                        [GUARDAR] [CANCELAR]    │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ REGISTRO 2: DKIM

```
┌─────────────────────────────────────────────────────────────────┐
│  AGREGAR NUEVO REGISTRO                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tipo:        [CNAME ▼]                                        │
│                                                                 │
│  Nombre/Host: [default._domainkey]                             │
│                                                                 │
│  Valor:       [default._domainkey.cname.resend.com             │
│                                                                 │
│  TTL:         [3600] (o dejar por defecto)                     │
│                                                                 │
│                                        [GUARDAR] [CANCELAR]    │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ REGISTRO 3: DMARC

```
┌─────────────────────────────────────────────────────────────────┐
│  AGREGAR NUEVO REGISTRO                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tipo:        [TXT ▼]                                          │
│                                                                 │
│  Nombre/Host: [_dmarc]                                         │
│                                                                 │
│  Valor:       [v=DMARC1; p=none; rua=mailto:admin@carvipix.com │
│                                                                 │
│  TTL:         [3600] (o dejar por defecto)                     │
│                                                                 │
│                                        [GUARDAR] [CANCELAR]    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 PASOS EXACTOS

1. **Abre tu proveedor DNS** (GoDaddy, Namecheap, CloudFlare, Hostinger, Bluehost, 1&1, etc.)

2. **Ve a "Gestionar DNS"** o "DNS Records" de `carvipix.com`

3. **Busca el botón "Agregar Registro"** o "Add Record" (+ New Record)

4. **COPIA Y PEGA EXACTAMENTE:**

   | Registro | Tipo | Host | Valor |
   |----------|------|------|-------|
   | SPF | TXT | @ | v=spf1 include:resend.com ~all |
   | DKIM | CNAME | default._domainkey | default._domainkey.cname.resend.com |
   | DMARC | TXT | _dmarc | v=DMARC1; p=none; rua=mailto:admin@carvipix.com |

5. **Haz clic en "GUARDAR"** después de cada registro

6. **Espera 24-48 horas** (a veces 1-2 horas)

---

## 🔍 PROVEEDORES MÁS COMUNES

### GoDaddy
1. Accede a tu dominio
2. Haz clic en **"Gestionar DNS"**
3. Desplázate a la sección de registros
4. Busca **"Agregar registro"** (abajo de la lista)
5. Copia/pega los valores

### Namecheap
1. Dashboard → Domain List
2. Haz clic en **"Manage"** al lado de carvipix.com
3. Tab **"Advanced DNS"**
4. En cada fila vacía → Tipo, Host, Valor

### CloudFlare
1. Accede a tu cuenta
2. Selecciona carvipix.com
3. Tab **"DNS"**
4. Botón **"+ Add record"**
5. Copia/pega exactamente

---

## ⏰ DESPUÉS DE GUARDAR

1. Los registros aparecerán en tu lista DNS
2. Estado probablemente: **"Pendiente"** o **"Propagando"** (normal)
3. Espera **24-48 horas** para propagación global
4. Luego ve a **Resend.com** → Dashboard → Domains → Verifica carvipix.com
5. Verás ✅ cuando todos los registros estén correctos

**¡LISTO! Email en producción funcionando.**

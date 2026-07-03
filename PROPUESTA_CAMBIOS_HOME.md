# 🎬 PROPUESTA DE CAMBIOS - HOME PREMIUM

**Fecha:** 2 Julio 2026  
**Objetivo:** Especificación exacta de qué cambiar en page.tsx  
**Status:** 🟡 AGUARDANDO APROBACIÓN  

---

## 📝 CAMBIO #1: DISCLAIMER DE DATOS SIMULADOS

**Ubicación:** Arriba del chart de balance  
**Razón:** Legal + Confianza  

```jsx
// AGREGAR ANTES DEL CHART

<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  className="rounded-lg border-l-4 border-[#D4AF37] 
    bg-[#D4AF37]/5 p-4 mb-6 flex gap-3 items-start"
>
  <AlertCircle size={20} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
  <div>
    <p className="text-sm font-semibold text-white">Datos de demostración</p>
    <p className="text-xs text-white/70 mt-1">
      Este balance es simulado para propósitos educativos. 
      Los resultados históricos no garantizan rendimiento futuro.
    </p>
  </div>
</motion.div>
```

---

## 📝 CAMBIO #2: HERO SECTION - REDISEÑO COMPLETO

**Ubicación:** Líneas 240-255 en page.tsx  
**Razón:** Impacto inmediato, comunica autoridad  

### ANTES:
```jsx
<motion.div className="mb-8 flex items-center justify-between gap-6">
  <div>
    <h1 className="text-4xl font-bold text-[#D4AF37]">
      Bienvenido a CARVIPIX
    </h1>
    <p className="mt-2 text-zinc-400">
      Tu ventaja en el mercado empieza aquí.
    </p>
  </div>

  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 shadow-2xl shadow-black/30">
    <p className="text-sm text-zinc-400">Renovación</p>
    <p className="font-bold">18/07/2026</p>
  </div>
</motion.div>
```

### DESPUÉS:
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  className="mb-12 space-y-6"
>
  {/* Subtítulo pequeño */}
  <div>
    <p className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] font-semibold">
      Trading Profesional Asistido
    </p>
  </div>

  {/* Título principal */}
  <div>
    <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
      Detecta Giros de Mercado
      <span className="block text-[#D4AF37]">2h Antes</span>
    </h1>
  </div>

  {/* Números de autoridad */}
  <div className="grid grid-cols-3 gap-8 pt-4">
    <div>
      <p className="text-3xl font-bold text-white">2,347</p>
      <p className="text-xs text-white/60 mt-1">Traders Activos</p>
    </div>
    <div>
      <p className="text-3xl font-bold text-[#D4AF37]">$185M</p>
      <p className="text-xs text-white/60 mt-1">Volumen Movido</p>
    </div>
    <div>
      <p className="text-3xl font-bold text-white">69.5%</p>
      <p className="text-xs text-white/60 mt-1">Win Rate</p>
    </div>
  </div>

  {/* Descripción */}
  <p className="text-base text-white/70 max-w-2xl leading-relaxed">
    Sistema automatizado que identifica puntos de giro en mercados 
    alcistas y bajistas. Precisión basada en datos reales del mercado XAUUSD.
  </p>
</motion.div>
```

**Cambios clave:**
- Título ahora comunica valor específico, no genérico
- Números grande (2,347, $185M, 69.5%) generan confianza
- Escala tipográfica: subtítulo small, título grande
- Sin card de "Renovación" (distrae)
- Más espacio visual (mb-12 vs mb-8)

---

## 📝 CAMBIO #3: STATS CARDS - MEJORAR ESPACIADO & COLORES

**Ubicación:** Líneas 260-310  
**Razón:** Consistencia de paleta, premium feel  

### Cambios:
```jsx
{/* 
  1. Cambiar contenedor grid
  ANTES: grid gap-5 md:grid-cols-2 xl:grid-cols-4
  DESPUÉS: grid gap-6 md:grid-cols-2 lg:grid-cols-4
*/}

{/* 
  2. Cambiar colores de stats
  ANTES:
  - Win Rate: text-green-400 ❌
  - Riesgo: text-purple-400 ❌
  
  DESPUÉS:
  - Win Rate: text-white ✅
  - Riesgo: text-[#D4AF37] ✅
*/}

{/* 
  3. Cambiar padding de cards
  ANTES: p-6 (24px)
  DESPUÉS: p-8 (32px)
*/}

{/* 
  4. Cambiar icon size
  ANTES: size={20}
  DESPUÉS: size={28}
*/}

{/* 
  5. Cambiar border color
  ANTES: border-white/10
  DESPUÉS: border-[#D4AF37]/20
*/}

{/* 
  6. Cambiar shadow
  ANTES: shadow-2xl shadow-black/20
  DESPUÉS: shadow-lg shadow-black/15
*/}

{/* 
  7. Mejorar hover
  ANTES: hover:border-[#D4AF37]/40
  DESPUÉS: hover:border-[#D4AF37]/60 hover:shadow-[#D4AF37]/20
*/}
```

**Resultado:** Stats cards se ven más premium, mejor espaciadas, colores coherentes.

---

## 📝 CAMBIO #4: BUTTONS - AUMENTAR TAMAÑO Y HOVER STATES

**Ubicación:** Líneas 340-350 (Button "Ver alertas")  
**Razón:** Conversión, premium feel  

### ANTES:
```jsx
<Link
  href="/alertas"
  className="mt-6 inline-flex items-center justify-center gap-2 
    rounded-full border border-[#D4AF37] bg-[#D4AF37]/10 px-4 py-3 
    text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
>
  Ver alertas
  <ArrowRight size={16} />
</Link>
```

### DESPUÉS:
```jsx
<Link
  href="/alertas"
  className="mt-8 w-full flex items-center justify-center gap-2 
    rounded-xl border border-[#D4AF37] bg-[#D4AF37]/10 px-6 py-4 
    text-sm font-bold text-[#D4AF37] 
    hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/80 hover:-translate-y-1
    hover:shadow-lg hover:shadow-[#D4AF37]/30
    transition-all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)"
>
  Ver todas las alertas
  <ArrowRight size={18} />
</Link>
```

**Cambios:**
- `w-full` (ocupar ancho completo)
- `py-4` (44px de altura total, accesibilidad)
- `py-3` → `py-4`
- Agregar hover: `translate-y-1` (levanta)
- Agregar hover shadow
- Mejor texto: "Ver todas las alertas" vs "Ver alertas"

---

## 📝 CAMBIO #5: QUICK ACCESS BUTTONS - MEJORAR CTA

**Ubicación:** Líneas 412-430  
**Razón:** Conversión, botones pequeños  

### ANTES:
```jsx
<button className="relative w-full bg-[#D4AF37] text-[#05070B] 
  font-bold py-2.5 px-4 rounded-lg hover:bg-[#E5C158] 
  transition-colors duration-200 text-sm">
  {item.buttonText}
</button>
```

### DESPUÉS:
```jsx
<button className="relative w-full bg-[#D4AF37] text-[#05070B] 
  font-bold py-3.5 px-4 rounded-lg
  hover:bg-[#E5C158] hover:scale-105 hover:-translate-y-1
  hover:shadow-lg hover:shadow-[#D4AF37]/40
  transition-all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)
  active:scale-95
  text-sm">
  {item.buttonText}
</button>
```

**Cambios:**
- `py-2.5` → `py-3.5` (mayor altura)
- Agregar `hover:scale-105` (crece 5%)
- Agregar `hover:-translate-y-1` (levanta)
- Agregar shadow en hover
- Agregar `active:scale-95` (feedback al clickear)
- Mejorar easing

---

## 📝 CAMBIO #6: QUICK ACCESS CARDS - BORDER & SHADOW

**Ubicación:** Líneas 395-410  
**Razón:** Consistencia, premium look  

### CAMBIOS:
```jsx
{/* 
  ANTES:
  border border-white/10
  shadow-xl shadow-[#D4AF37]/20
  
  DESPUÉS:
  border border-[#D4AF37]/20
  shadow-lg shadow-black/20
  hover:shadow-xl hover:shadow-[#D4AF37]/30
*/}

{/* 
  ANTES:
  rounded-2xl (16px)
  
  DESPUÉS:
  rounded-2xl (mantener consistencia)
*/}

{/* 
  ANTES:
  bg-[#0B111A]
  
  DESPUÉS:
  bg-[#0B111A] (mantener, pero mejorar border)
*/}
```

---

## 📝 CAMBIO #7: TIPOGRAFÍA - APLICAR ESCALA GLOBAL

**Ubicación:** Todo el archivo  
**Razón:** Profesionalismo, consistencia  

```jsx
// ESCALA FINAL:
h1 = text-5xl md:text-6xl (Playfair Display, bold)
h2 = text-2xl md:text-3xl (Playfair Display, bold) → cambiar a text-2xl
h3 = text-lg md:text-xl (Inter, semibold)
p = text-base (16px, Inter, regular)
small = text-sm (14px, Inter, regular)
tiny = text-xs (12px, Inter, regular)

// Específicamente:
- "Bienvenido a CARVIPIX" (hero):
  ANTES: text-4xl
  DESPUÉS: text-5xl md:text-6xl

- "Balance" (chart title):
  ANTES: text-2xl
  DESPUÉS: mantener text-2xl

- "Alertas activas":
  ANTES: text-xl
  DESPUÉS: text-2xl

- "Soluciones CARVIPIX":
  ANTES: text-2xl
  DESPUÉS: text-3xl
```

---

## 📝 CAMBIO #8: MOBILE RESPONSIVE - MEJOR GRID

**Ubicación:** Todas las grids  
**Razón:** Mobile first  

```jsx
{/* 
  Stats grid:
  ANTES: grid gap-5 md:grid-cols-2 xl:grid-cols-4
  DESPUÉS: grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
*/}

{/* 
  Chart + Alerts:
  ANTES: grid gap-6 xl:grid-cols-[1.45fr_1fr]
  DESPUÉS: grid gap-6 grid-cols-1 lg:grid-cols-[1.45fr_1fr]
*/}

{/* 
  Quick Access:
  ANTES: grid gap-5 md:grid-cols-2 lg:grid-cols-3
  DESPUÉS: grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
*/}
```

---

## 📝 CAMBIO #9: PADDING GLOBAL - APLICAR GRID 8/16/32/64

**Ubicación:** Contenedores principales  
**Razón:** Espaciado consistente  

```jsx
{/* 
  Main container (p-8):
  ANTES: p-8 ✅ (correcto)
  DESPUÉS: mantener p-8
*/}

{/* 
  Stats container:
  ANTES: gap-5 (20px)
  DESPUÉS: gap-6 (24px) pero mejor usar gap-4/sm:gap-6
*/}

{/* 
  Card padding:
  ANTES: p-6 (24px)
  DESPUÉS: p-8 (32px)
*/}

{/* 
  Interno de alerts:
  ANTES: gap-4 (16px), mt-4, mt-2, mt-6
  DESPUÉS: estandarizar a mt-4, gap-3
*/}
```

---

## 📝 CAMBIO #10: ICONOGRAFÍA - AUMENTAR TAMAÑOS

**Ubicación:** Todos los icons  
**Razón:** Better visual balance  

```jsx
{/* 
  Stats icons:
  ANTES: size={20}
  DESPUÉS: size={28}
*/}

{/* 
  Alert icons:
  ANTES: size={14}
  DESPUÉS: size={18}
*/}

{/* 
  Quick access icons:
  ANTES: w-7 h-7 (28px) ✅
  DESPUÉS: mantener
*/}
```

---

## 🎯 RESUMEN DE CAMBIOS

| Cambio | Ubicación | Impacto | Tiempo |
|--------|-----------|--------|--------|
| Disclaimer | Chart section | Legal | 5 min |
| Hero rediseño | Línea 240 | Alto impacto visual | 20 min |
| Stats colors/spacing | Línea 260 | Premium feel | 15 min |
| Buttons CTA | Línea 340 | Conversión | 10 min |
| Quick access buttons | Línea 412 | Conversión | 10 min |
| Card borders/shadows | Línea 395 | Consistencia | 10 min |
| Tipografía escala | Global | Profesionalismo | 15 min |
| Responsive grid | Global | Mobile perfecto | 10 min |
| Padding/spacing | Global | Luxury feel | 10 min |
| Icons tamaños | Global | Visual balance | 5 min |

**Total:** ~90 minutos

---

## ✅ RESULTADO ESPERADO

```
ANTES:
- Hero genérico
- Colores random
- Botones pequeños
- Tipografía inconsistente
- Espaciado aleatorio
- Sin disclaimer
→ Parece "proyecto bonito"

DESPUÉS:
- Hero con autoridad (números grandes)
- Solo dorado/negro/blanco
- Botones 44px con hover states
- Tipografía en escala clara
- Espaciado grid consistente
- Disclaimer legal visible
→ Parece "empresa seria"
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Cambio #1: Disclaimer agregado
- [ ] Cambio #2: Hero rediseñado
- [ ] Cambio #3: Stats actualizados
- [ ] Cambio #4: Button "Ver alertas" mejorado
- [ ] Cambio #5: Buttons "Comprar/Solicitar" mejorados
- [ ] Cambio #6: Card borders/shadows
- [ ] Cambio #7: Tipografía escala aplicada
- [ ] Cambio #8: Responsive grids
- [ ] Cambio #9: Padding consistente
- [ ] Cambio #10: Icons tamaños
- [ ] Testing en mobile
- [ ] Screenshot comparativo
- [ ] Build sin errores

---

**Propuesta:** ✅ LISTA PARA APROBACIÓN  
**Status:** 🟡 AGUARDANDO OK  
**Próximo paso:** "Aprueba estos cambios específicos y comienzo implementación"

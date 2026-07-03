# 💎 GUÍA DE ESTILOS PREMIUM - CARVIPIX

**Objetivo:** Definir exactamente qué es "premium" para CARVIPIX

---

## 🎨 PALETA DE COLORES (OFICIAL)

### Colores Permitidos
```
Negro:      #000000 (fondos, texto fuerte)
Dorado:     #D4AF37 (accents, highlights, lujo)
Blanco:     #FFFFFF (fondo, espacios, respirable)
Gris:       #F5F5F5 (subtle backgrounds)
Gris Oscuro: #1A1A1A (texto sobre dorado)
```

### Colores PROHIBIDOS (Hoy los usas)
```
❌ Green-400    (crypto feel, no premium)
❌ Purple-400   (infantil, no serio)
❌ Blue-600     (banco genérico, no CARVIPIX)
❌ Rojo neón    (advertencia pobre, no lujo)
```

### Uso Correcto
```
Botones CTA:       Dorado + hover = escala 1.05
Links:             Dorado en texto, subrayado en hover
Alertas buenas:    Verde suave + icono dorado
Warnings:          Ámbar suave + icono dorado
Errores:           Rojo suave + icono dorado
Stats positivas:   Dorado o blanco
Stats negativas:   Rojo suave
```

---

## ✍️ TIPOGRAFÍA PREMIUM

### Fuentes Recomendadas

**Headers (Elegancia):**
```
Font-family: "Playfair Display", serif
Weights: 700 (bold)
Tamaños:
  h1 = 48px / 64px (hero)
  h2 = 32px
  h3 = 24px
  h4 = 20px
Spacing: 1.2 (line-height)
Letter-spacing: -0.5px (hermético, premium)
```

**Body (Legibilidad):**
```
Font-family: "Inter", sans-serif
Weights: 400 (regular), 500 (medium), 600 (semibold)
Tamaños:
  p = 16px
  small = 14px
  tiny = 12px
Spacing: 1.6 (line-height, respirable)
Letter-spacing: 0px
```

**Monospace (Números/Data):**
```
Font-family: "IBM Plex Mono", monospace
Tamaños: 14px-16px
Para: balances, trades, números exactos
```

### Escala Tipográfica (Máximas)

```
Permitido:  48 | 40 | 32 | 28 | 24 | 20 | 16 | 14 | 12 | 10px
Prohibido:  11 | 13 | 15 | 18 | 22 | 26 | 30 | 36 | 42 | 50px
```

**Por qué:** Escala consistente parece profesional. Múltiples tamaños = caos.

---

## 🎯 SPACING & LAYOUT (Respirable)

### Grid de Spacing

```
8px    (micro, entre elementos)
16px   (pequeño, entre grupos)
32px   (medio, entre secciones)
64px   (grande, entre bloques principales)
128px  (hero espaciado)

PERMITIDO: 8, 16, 32, 64, 128
PROHIBIDO: 10, 12, 15, 20, 24, 40, 80px (inconsistente)
```

### Ejemplos Correctos

```jsx
/* Entre card y card */
<div className="gap-4">  {/* 16px */}

/* Entre secciones */
<section className="my-8">  {/* 32px arriba/abajo */}

/* Hero section */
<div className="pt-16 pb-16">  {/* 64px cada lado */}

/* Máximo content width */
max-width: 1200px
```

### Breathing (Espacio Blanco)

```
Premium = mucho espacio blanco
Mediocre = contenido apretado

Regla de oro:
- Cards: padding 24-32px mínimo
- Secciones: margen 64px mínimo
- Mobile: padding 16px mínimo

NO HACER:
```css
padding: 8px;   /* Apretado, pobre */
gap: 4px;       /* Sufocante */
```

```

---

## 🔘 COMPONENTES PREMIUM

### Botones

```jsx
// PRIMARY CTA (Dorado = Compra)
<button className="
  bg-[#D4AF37]
  text-[#1A1A1A]
  px-8 py-3
  rounded-lg
  font-semibold
  text-16px
  hover:scale-105
  hover:shadow-lg
  transition-all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)
">
  Compra ahora
</button>

// SECONDARY (Blanco / Dorado border)
<button className="
  bg-white
  border-2 border-[#D4AF37]
  text-[#D4AF37]
  px-8 py-3
  rounded-lg
  font-semibold
  hover:bg-[#D4AF37]
  hover:text-[#1A1A1A]
  transition-colors 200ms
">
  Más información
</button>

// TERTIARY (Dorado text, no background)
<button className="
  text-[#D4AF37]
  font-semibold
  underline
  hover:text-white
  transition-colors 200ms
">
  Crear cuenta
</button>
```

**Reglas:**
- Mínimo 44px de altura (accesibilidad)
- Minimum 16px de horizontal padding
- Hover siempre visible (scale + shadow)
- Sin animaciones bruscas

### Cards

```jsx
<div className="
  bg-white
  border border-[#F5F5F5]
  rounded-xl
  p-8
  shadow-sm
  hover:shadow-lg
  transition-shadow 300ms
">
  {content}
</div>
```

**Reglas:**
- Border sutil (gris)
- Padding mínimo 24px
- Shadow suave (hover levanta)
- Border-radius: 12-16px

### Inputs

```jsx
<input
  className="
    w-full
    px-4 py-3
    border border-[#D4AF37]
    rounded-lg
    bg-white
    text-[#000000]
    focus:outline-none
    focus:ring-2
    focus:ring-[#D4AF37]
    transition-all 200ms
  "
  placeholder="Tu email..."
/>
```

**Reglas:**
- Border dorado = premium
- Focus con ring dorado (no blue default)
- Altura mínimo 44px
- Padding 12-16px

---

## 📊 ICONOGRAFÍA

### Dónde Usarla

```
✓ Antes de texto (align left)
✓ En botones (left o center)
✓ En listas
✓ En stats
✓ En badges

✗ Como única comunicación
✗ En texto corrido
✗ Demasiado pequeño (< 20px)
```

### Tamaños Premium

```
Buttons:      24px
Headers:      32px
Lists:        24px
Stats:        48px
Hero:         64px+
```

### Color Icons

```
✓ Dorado (#D4AF37)
✓ Blanco (#FFFFFF)
✓ Negro (#000000)
✓ Gris suave

✗ Verde neón
✗ Azul crypto
✗ Rojo fuerte
```

---

## 🎬 ANIMACIONES PREMIUM

### Recomendadas

```jsx
// Fade in on scroll
@keyframes fadeInUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

// Hover elevate
@keyframes elevate {
  from { transform: translateY(0); }
  to { transform: translateY(-8px); }
}

// Smooth transitions
transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Velocidades Correctas

```
Microinteractions:  150-200ms
Hover states:       200ms
Page transitions:   300-400ms
Scroll animations:  800-1200ms

PROHIBIDO:
- Animaciones > 1s en hover
- Instant (0ms) en todo
- Easing lineal (usar cubic-bezier)
```

---

## 📱 RESPONSIVE PREMIUM

### Breakpoints

```css
Mobile: 320px - 767px
Tablet: 768px - 1023px
Desktop: 1024px+
```

### Mobile First Rules

```
1. Padding: 16px en mobile, 24-32px en desktop
2. Font: 16px body en mobile, 16px en desktop
3. Buttons: 44px altura SIEMPRE
4. Stack vertical en mobile, grid en desktop
5. No truncar texto importante
```

### Ejemplos

```jsx
// ❌ POBRE (rompe en mobile)
<div className="grid-cols-4 gap-2 p-2">

// ✅ PREMIUM (responsive)
<div className="
  grid
  grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
  gap-4 sm:gap-6 lg:gap-8
  p-4 sm:p-6 lg:p-8
">
```

---

## 📊 PÁGINAS PREMIUM vs MEDIOCRE

### MEDIOCRE (Actual)
```
❌ Tipografía inconsistente
❌ Colores random (green, purple, blue)
❌ Spacing apretado
❌ Hover states faltantes
❌ "Coming Soon" en todas partes
❌ Links rotos
❌ Sin social proof
❌ Datos simulados sin disclaimer
❌ CTA débiles ("Aprende más")
❌ Mobile roto
```

### PREMIUM (Objetivo)
```
✅ Tipografía en escala clara
✅ Solo dorado, negro, blanco
✅ Respirable, mucho espacio blanco
✅ Hover states hermosos
✅ Contenido completo y funcional
✅ Todos los links funcionan
✅ Social proof destacado
✅ Disclaimer visible y legal
✅ CTA fuertes ("Compra ahora")
✅ Responsive perfecto
```

---

## 🎯 CHECKLIST VISUAL ANTES DE SUBIR

### Typography
- [ ] h1 = 48px Playfair Display
- [ ] h2 = 32px Playfair Display
- [ ] body = 16px Inter
- [ ] Line-height coherente (1.2 headers, 1.6 body)
- [ ] No hay tamaños random (13px, 15px, 18px)

### Color
- [ ] Solo dorado, negro, blanco usados
- [ ] No hay green-400, purple-400, blue-600
- [ ] Botones CTA en dorado
- [ ] Links en dorado

### Spacing
- [ ] Grid 8/16/32/64/128px
- [ ] Cards padding 24-32px mínimo
- [ ] Secciones margen 64px
- [ ] No hay padding 10px, 12px, 15px random

### Components
- [ ] Botones 44px+ altura
- [ ] Inputs 44px altura
- [ ] Cards con shadow hover
- [ ] Icons 24-64px según contexto
- [ ] Badges con icono

### Animations
- [ ] Hover 200ms cubic-bezier
- [ ] Scroll fade-in 800ms
- [ ] Page transitions 300-400ms
- [ ] No instant (0ms)

### Responsive
- [ ] Mobile < 768px responsive
- [ ] Tablet 768-1024px
- [ ] Desktop 1024px+
- [ ] Touch targets 44px
- [ ] Readable en todos tamaños

### UX
- [ ] Links no rotos (#)
- [ ] CTA claros y fuertes
- [ ] Disclaimer visible si datos simulados
- [ ] Social proof visible
- [ ] Footer con contacto
- [ ] Mobile menu si needed

### Trust
- [ ] SSL badge visible
- [ ] Certificaciones mostradas
- [ ] Email soporte visible
- [ ] No hay "Coming Soon" innecesario
- [ ] Datos reales o disclaimer

---

## 🎓 REFERENCIAS PREMIUM (No copiar, inspiración)

**Empresas que transmiten autoridad:**
- Apple (minimalismo, espacio blanco)
- Tesla (contraste, tipografía fuerte)
- Stripe (blue/white, claro)
- Luxury brands (dorado, negro, elegancia)

**Lo que NO hacer:**
- Copiar colores exactos
- Copiar layouts exactos
- Copiar logos/branding
- Copiar copy

**Lo que SÍ hacer:**
- Inspirarse en filosofía (limpio, premium, autoridad)
- Mantener identidad CARVIPIX
- Dorado único (no es azul como Stripe)
- Voz propia

---

## ✅ CONCLUSIÓN

**Premium = Menos pero mejor**

```
Menos:        Más:
Colores       Espaciado
Features      Atención al detalle
Animaciones   Propósito
Distracción   Confianza
Desorden      Autoridad
```

Cuando un visitante entre:
- Primeros 3 segundos: "Empresa seria" ✅
- Primeros 30 segundos: "Exclusiva" ✅
- Primeros 2 minutos: "Confianza" ✅
- Al terminar: "Quiero comprar" ✅

---

**Guía creada:** 2 Julio 2026  
**Aplicable a:** Todo componente, página, interacción  
**Meta:** Ser "empresa de millones" visualmente  
**Status:** ✅ Listo para usar

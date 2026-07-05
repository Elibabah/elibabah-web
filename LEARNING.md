# Notas de aprendizaje — elibabah-web

> Bitácora de conceptos técnicos aprendidos mientras se construye el sitio.
> Este archivo es **solo de agregar** (append-only): no se borra contenido viejo al sumar uno nuevo,
> aunque algo quede desactualizado se anota como tal en vez de eliminarse.
>
> Pensado también como banco de repaso para entrevistas técnicas.

---

## Server Components vs Client Components

Un **Server Component** no es "un componente que corre en un servidor" en el sentido clásico
(Express renderizando HTML). Es una arquitectura de **React** (no de Next.js — Next.js la implementa
primero, pero el concepto es de React mismo: React Server Components / RSC).

La diferencia real no es *dónde* corre, sino **qué payload genera**:

- Un Server Component se ejecuta **una sola vez**, en el servidor o en build time, y su resultado se
  serializa como **RSC Payload** (una representación del árbol ya resuelto, no HTML).
- Su código **nunca se manda como JS al navegador**. El navegador no puede re-ejecutarlo ni
  re-renderizarlo. Por eso reduce el bundle de JS.
- Puede ser `async` directamente (`async function Page()`), con `await fetch(...)` o `await db.query(...)`
  sin hooks como `useEffect`, porque no tiene "ciclo de vida" del lado cliente — se ejecuta una vez.

Un **Client Component** (`"use client"` al inicio del archivo) es el React de siempre: se hidrata en el
navegador, tiene estado (`useState`), efectos (`useEffect`), event handlers, y su JS sí viaja al cliente.

**Por defecto, todo componente dentro de `app/` es Server Component.** Solo se vuelve Client Component
si el archivo declara `"use client"` explícitamente.

> **Pregunta de entrevista**: ¿RSC reemplaza a SSR?
> No. SSR es una técnica de *cómo se genera el HTML inicial* (existe desde Next.js 1, Pages Router).
> RSC es una arquitectura distinta sobre *qué componentes existen en el cliente en absoluto*.
> Se puede tener SSR sin RSC, y viceversa.

### El límite `"use client"` se define por el module graph, no por la posición en el JSX

Si un archivo tiene `"use client"`, **todo lo que ese archivo importa y renderiza directamente** entra
al bundle del cliente. Pero los `children` que recibe como prop **no** cuentan como import de ese
archivo — si vienen de un Server Component padre, ya llegan resueltos (su HTML/RSC ya se generó en el
servidor antes de pasarlos).

Esto permite el patrón:

```
Server Component (layout.tsx)
  └── Client Component (ThemeProvider, "use client")
        └── children (pueden ser Server Components, renderizados aparte y pasados como prop)
```

Es decir: un Client Component puede "envolver" Server Components sin convertirlos en Client Components.

---

## Context API y por qué no funciona en Server Components

**Context** (`createContext`) es el mecanismo de React para pasar datos a través del árbol de
componentes sin pasarlos manualmente como props en cada nivel ("prop drilling"):

```tsx
const ThemeContext = createContext(defaultValue) // 1. crear
;<ThemeContext.Provider value={...}>              // 2. proveer (componente padre)
useContext(ThemeContext)                          // 3. consumir (cualquier descendiente)
```

Funciona porque React mantiene un **árbol de fibers vivo en memoria** en el cliente: cuando el
`Provider` cambia su `value`, React recorre el árbol y vuelve a renderizar a los consumidores
suscritos. Es un mecanismo **reactivo**, ligado al ciclo de vida de React en el navegador.

**Por qué no funciona en Server Components**: un Server Component se ejecuta una vez, genera su
payload, y termina. No existe un árbol de fibers vivo en el servidor esperando cambios para volver a
renderizar esa parte puntual. Context depende de esa maquinaria reactiva para propagar cambios — no
existe en el modelo de ejecución de RSC. Por eso React tira error si se intenta `createContext` /
`<Context.Provider>` en un archivo sin `"use client"`.

**Solución estándar** (no es un workaround específico de una librería, es el patrón general):
crear un Client Component chico cuyo único trabajo es envolver el `Provider`, e importarlo desde el
Server Component. Ejemplo real de este proyecto: [components/theme-provider.tsx](components/theme-provider.tsx)
envuelve `next-themes`, e [app/layout.tsx](app/layout.tsx) (Server Component) lo importa y usa.

---

## Hidratación (Hydration) y `suppressHydrationWarning`

**Hidratación** = proceso donde React, en el navegador, toma el HTML estático que llegó del servidor y
le "engancha" event listeners y estado, sin regenerar el DOM desde cero. React compara lo que el
servidor generó vs. lo que él generaría en el cliente — si no coinciden, tira un *hydration mismatch
warning*.

Caso real: el servidor genera `<html lang="en">` sin saber el tema del usuario (no tiene acceso a
`localStorage` ni a `prefers-color-scheme` del navegador). En cuanto el JS de `next-themes` corre en el
cliente, escribe `data-theme="dark"` (o `"light"`) **antes de que React hidrate**. Esto genera un
mismatch intencional y esperado entre servidor y cliente.

`suppressHydrationWarning` en el `<html>` le dice a React "en este nodo puntual, ignora discrepancias
de atributos" — no es un silenciador global, solo aplica a ese elemento.

> **Pregunta de entrevista**: ¿qué pasa si no se pone `suppressHydrationWarning` en este caso?
> La app sigue funcionando (React no rompe nada), pero tira un warning ruidoso en consola en cada
> carga, porque detecta que `data-theme` cambió entre el render del servidor y el primer render del
> cliente.

---

## CSS Custom Properties como mecanismo de theming

El cambio de tema claro/oscuro se implementó con **variables CSS nativas** (`--background`,
`--color-accent`), que cambian de valor según el selector de atributo `[data-theme="dark"]`, en vez de
JS calculando colores y pasándolos por props.

Por qué importa: el cambio de tema es **puramente CSS** — cambiar `data-theme` en el `<html>` no
dispara ningún re-render de React, solo hace que el navegador recalcule estilos. Es más performante que
tener el color en un objeto JS de estado.

---

## Tailwind CSS v4 — "CSS-first config"

A diferencia de Tailwind v3 (que usa `tailwind.config.js` con un objeto `theme`), **Tailwind v4 define
tokens directamente en CSS** con un bloque `@theme { ... }`. Las variables declaradas ahí generan
automáticamente clases utilitarias.

Ejemplo real del proyecto ([app/globals.css](app/globals.css)):

```css
@theme inline {
  --color-accent: var(--color-accent);
  --font-heading: var(--font-heading);
}
```

Esto genera gratis las clases `bg-accent`, `text-accent`, `border-accent`, `font-heading`, etc.

`@theme inline` (vs `@theme` simple) le dice a Tailwind que las variables ya están definidas afuera
(en `:root` / `[data-theme="dark"]`) y solo las "reexporta" como tokens de Tailwind — no las redefine.

---

## `next/font/google`

Optimiza fuentes en **build time**: descarga los archivos de fuente y los sirve **self-hosted** desde
el propio dominio del sitio, en vez de hacer un request a Google Fonts en tiempo de ejecución. Mejora
performance (sin round-trip extra a un servidor externo) y privacidad (el navegador del usuario no le
hace un request directo a Google).

Cada fuente se instancia con una variable CSS propia:

```tsx
const sourceSerif = Source_Serif_4({ variable: "--font-heading", subsets: ["latin"] })
```

y esa variable se inyecta en el `className` del `<html>`, quedando disponible para todo el árbol CSS.

---

## App Router — fundamentos (Next.js)

- **File-system based routing**: carpetas = segmentos de URL, archivos especiales = UI para ese
  segmento.
- `page.tsx` hace público un segmento; sin él, la carpeta no es una ruta accesible aunque exista.
- `layout.tsx` es UI compartida que **persiste entre navegaciones** (no se vuelve a renderizar) y se
  anida: el layout raíz envuelve todo, un layout en `app/blog/` envuelve solo `/blog/*`.
- `[slug]` = segmento dinámico de un solo nivel. `[...slug]` = catch-all. `[[...slug]]` = catch-all
  opcional.
- Rutas fijas (`app/editorial/software/`) tienen prioridad sobre rutas dinámicas del mismo nivel
  (`app/editorial/[slug]/`) — por eso esos nombres quedan reservados/prohibidos como slugs de contenido.
- `(grupo)` con paréntesis organiza rutas sin afectar la URL (route groups).

---

## Decisiones de diseño aplicadas en este proyecto (referencia rápida)

- Fondo/texto base coordinados con los tonos del logo (no blanco/negro puro):
  light `#fafafa` / `#20221a`, dark `#20221a` / `#fafafa`.
- Acento (`#0C5566` light / `#4D9FB3` dark) reservado **solo** para links, kickers, pills, CTAs — nunca
  en texto de cuerpo ni headings completos.
- Tres roles tipográficos vía variables con nombre semántico (`--font-heading`, `--font-body`,
  `--font-mono`), no nombres genéricos tipo `--font-serif`.
- Tema controlado por atributo (`data-theme`) vía `next-themes`, no por `prefers-color-scheme` directo,
  para permitir selección manual del usuario además de seguir el sistema.

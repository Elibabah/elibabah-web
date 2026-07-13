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

---

## Pipeline MDX: `gray-matter` + `next-mdx-remote`

Cuando el contenido vive en archivos `.mdx` fuera de `app/` (en `content/`), necesitas leerlos
manualmente con Node.js y procesarlos en dos etapas:

1. **`gray-matter`** separa el archivo en dos partes:
   - `data` — el bloque YAML entre los delimitadores `---`. Devuelve un objeto JS con los campos del
     front matter (`title`, `slug`, `stack`, etc.).
   - `content` — todo lo que viene después del `---` de cierre. Es el cuerpo MDX como string plano.

2. **`next-mdx-remote/rsc`** recibe ese string `content`, lo compila a React en el servidor, y lo
   renderiza como HTML. Por ser del paquete `/rsc`, es un Server Component — no envía JS extra al
   cliente solo para renderizar markdown.

El pipeline completo para una página de detalle:

```
fs.readFileSync(filepath)          → string crudo del archivo
  → matter(raw)                    → { data: front matter, content: cuerpo MDX }
  → getProjectBySlug(slug)         → devuelve ambas partes tipadas
  → <MDXRemote source={content} /> → compila y renderiza el MDX en el servidor
```

Para páginas de listado, solo se usa `data` (front matter) — el `content` se ignora porque solo se
necesitan los metadatos para mostrar la card.

> **Por qué no `@next/mdx`**: ese paquete está optimizado para cuando los archivos `.mdx` son las
> páginas mismas (dentro de `app/`). Para el patrón de `content/` externo con front matter YAML,
> `gray-matter` + `next-mdx-remote` es la combinación estándar.

---

## `generateStaticParams` y `dynamicParams`

### `generateStaticParams`

Exportada desde una página de ruta dinámica (`[slug]/page.tsx`), le dice a Next.js en **build time**
qué valores posibles tiene ese segmento dinámico, para pre-generar todas las páginas como HTML
estático:

```tsx
export async function generateStaticParams() {
  const projects = getAllProjects();
  return projects.map((p) => ({ slug: p.slug }));
}
```

Sin esta función, Next.js renderizaría cada página en runtime (en cada request). Con ella, las páginas
se generan una sola vez al hacer build — carga instantánea, sin servidor involucrado en el request del
usuario.

Conecta directamente con `lib/portfolio.ts`: reutiliza `getAllProjects()` para obtener los slugs,
manteniendo una única fuente de verdad.

### `dynamicParams = false`

```tsx
export const dynamicParams = false;
```

Define qué pasa si alguien pide un slug que **no está** en `generateStaticParams`. Con `false`, Next.js
devuelve 404 automáticamente. Sin esta línea (o con `true`), intentaría renderizar el slug en runtime,
lo que fallaría cuando `fs.readFileSync` no encuentre el archivo.

> **Pregunta de entrevista**: ¿cuándo usarías `dynamicParams = true`?
> Cuando el contenido es demasiado grande para pre-generar todo en build (ej. miles de productos en un
> e-commerce). Los slugs en `generateStaticParams` se pre-generan; el resto se genera en runtime y se
> cachea. Para un sitio de contenido como este, `false` es siempre la respuesta correcta.

---

## `params` asíncrono en Next.js 16 (breaking change)

En Next.js 15 y anteriores, `params` era un objeto sincrónico:

```tsx
// Next.js ≤ 15
export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params; // sincrónico
}
```

En Next.js 16, `params` es una **Promise** — la función del componente debe ser `async`:

```tsx
// Next.js 16
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // asíncrono
}
```

Lo mismo aplica a `searchParams`. Es uno de los breaking changes de Next.js 16 que no refleja la
documentación general de internet — hay que conocerlo para no copiar ejemplos de versiones anteriores.

---

## `@tailwindcss/typography` y las clases `prose`

Plugin oficial de Tailwind que da estilos tipográficos razonables a HTML generado desde fuentes
externas (markdown, MDX, APIs de CMS). Aplica márgenes entre párrafos, tamaños de headings, estilos
para listas, blockquotes, code blocks, etc.

En Tailwind v4, se registra directamente en CSS (sin `tailwind.config.js`):

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

Se usa con la clase `prose` en el contenedor del contenido generado:

```tsx
<article className="prose prose-neutral max-w-none">
  <MDXRemote source={content} />
</article>
```

- `prose` — activa los estilos base.
- `prose-neutral` — variante de color (escala de grises neutros).
- `max-w-none` — elimina el ancho máximo que `prose` aplica por defecto (ya controlamos el ancho con
  el contenedor padre).

> **Nota de diseño**: las clases `prose` aplican estilos a los elementos HTML que genera el MDX
> (`h2`, `p`, `ul`, `code`, etc.) sin que tengas que agregar clases a cada elemento manualmente. Esto
> es especialmente útil porque el contenido MDX lo escribes en markdown plano — no puedes agregar
> clases de Tailwind directamente a cada párrafo.

---

## Rutas fijas y dinámicas coexistiendo en el mismo nivel

En Next.js App Router, dentro de un mismo directorio pueden coexistir carpetas con nombre fijo y
carpetas dinámicas `[slug]`. El router los resuelve con una regla simple:

**Las rutas fijas tienen prioridad sobre las dinámicas.**

Ejemplo real del proyecto (`app/editorial/`):

```
app/editorial/
  page.tsx           → /editorial              (índice)
  software/page.tsx  → /editorial/software     ← ruta FIJA, prioridad
  career/page.tsx    → /editorial/career       ← ruta FIJA, prioridad
  aotearoa/page.tsx  → /editorial/aotearoa     ← ruta FIJA, prioridad
  [slug]/page.tsx    → /editorial/:cualquier-slug  ← ruta DINÁMICA, fallback
```

Si alguien visita `/editorial/software`, Next.js sirve `software/page.tsx` — nunca toca `[slug]/page.tsx`.
Si visita `/editorial/mi-articulo`, no hay carpeta fija que coincida, entonces entra `[slug]/page.tsx`.

**Consecuencia práctica**: los nombres de las carpetas fijas quedan como **slugs prohibidos** para
el contenido dinámico. En este proyecto, ningún artículo puede tener `slug: software`, `slug: career`,
ni `slug: aotearoa` en su front matter — si lo tuviera, la ruta fija lo taparía y el artículo
quedaría inaccesible.

> **Pregunta de entrevista**: ¿cómo resuelve Next.js el conflicto entre una ruta fija y una dinámica
> en el mismo nivel?
> Las rutas estáticas (carpetas con nombre literal) siempre ganan sobre los segmentos dinámicos
> `[slug]`. No hay configuración que invierta esa prioridad — es una regla fija del router.

---

## Union types en TypeScript para valores enumerados

Cuando un campo solo puede tomar un conjunto cerrado de valores de cadena, TypeScript ofrece dos
opciones: `enum` o un **union type de strings literales**.

```typescript
// Opción A: enum (más verboso, genera código JS)
enum ArticleSection {
  Software = "software",
  Career = "career",
  Aotearoa = "aotearoa",
}

// Opción B: union type (recomendada — solo existe en tiempo de compilación, no genera JS)
type ArticleSection = "software" | "career" | "aotearoa";
```

En este proyecto se usa la Opción B. Las ventajas:

- **No genera código JavaScript en el bundle** — es solo una anotación de tipos, desaparece al compilar.
- **Autocompletado y validación**: TypeScript garantiza que `section` solo pueda ser uno de esos tres
  valores. Si escribes `section: "sports"` en el front matter y luego lo tipas como `ArticleSection`,
  TypeScript detecta el error en compile time.
- **Fácil de mantener**: agregar una nueva sección es tan simple como añadir `| "nueva-seccion"` al
  tipo — sin editar un objeto enum.

Se usa en `lib/editorial.ts` para tipar el campo `section` del front matter, y en la firma de
`getArticlesBySection(section: ArticleSection)` para que TypeScript rechace llamadas con secciones
inválidas.

---

## Render condicional en React con `&&`

```tsx
{project.caseStudy && (
  <Link href={`/case-studies/${project.caseStudy}`}>Case Study →</Link>
)}
```

El operador `&&` evalúa la expresión de izquierda a derecha:
- Si `project.caseStudy` es `null`, `undefined`, o `false` → la expresión corta y React no renderiza nada.
- Si tiene un valor truthy (un string con contenido) → React renderiza el elemento de la derecha.

**Trampa común**: si el valor de la izquierda es `0` (número cero), React lo renderiza como texto
`"0"` en vez de no renderizar nada, porque `0` es falsy pero JSX lo trata como nodo de texto válido.
La solución es forzar boolean: `{items.length > 0 && <Lista />}` en vez de `{items.length && <Lista />}`.

> **Pregunta de entrevista**: ¿por qué `{0 && <Component />}` renderiza `0` en pantalla en vez de
> no renderizar nada?
> Porque JSX convierte los valores a nodos de texto cuando son números. `false`, `null`, `undefined`
> se ignoran, pero `0` es un número válido como nodo de texto. Usar `{count > 0 && <Component />}`
> garantiza que la condición sea boolean.

---

## El patrón `mounted` — evitar hydration mismatch en componentes sensibles al tema

Algunos Client Components necesitan renderizar cosas distintas según el tema activo (dark/light). El
problema: en el **primer render** del cliente (justo al hidratar), React no sabe aún qué tema eligió
el usuario — `localStorage` y `prefers-color-scheme` solo están disponibles después de que el JS
corre. Si el componente intenta usar el tema antes de ese momento, genera un **hydration mismatch**
(lo que el servidor generó no coincide con lo que React generaría en el cliente).

**La solución — patrón `mounted`**:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeAwareComponent() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // solo corre en el cliente, después de hidratar
  }, []);

  if (!mounted) {
    // En server render y primer render del cliente: placeholder neutro
    // (mismas dimensiones que el componente real para evitar layout shift)
    return <div className="w-8 h-8" />;
  }

  // A partir de aquí, resolvedTheme tiene el valor real
  return resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />;
}
```

**Por qué funciona**: `useEffect` nunca corre en el servidor — solo en el cliente, después de que
el DOM está listo. Al setear `mounted = true` dentro del efecto, garantizas que el componente no
intenta leer `resolvedTheme` hasta que next-themes ya lo calculó correctamente.

**El placeholder**: debe tener las mismas dimensiones que el componente real. Sin esto, el layout
"salta" (CLS, Cumulative Layout Shift) cuando el componente real aparece.

Ejemplo real en este proyecto: [components/layout/ThemeToggle.tsx](components/layout/ThemeToggle.tsx)
y [components/layout/Logo.tsx](components/layout/Logo.tsx).

> **Pregunta de entrevista**: ¿cuándo necesitas el patrón `mounted`?
> Cuando tu componente toma decisiones de render basadas en información que solo existe en el cliente
> (tema del usuario, idioma del navegador, tamaño de pantalla via JS, etc.). Sin el patrón, el
> servidor genera HTML con el valor por defecto, React hidrata y detecta que el cliente querría un
> valor distinto → warning. El patrón corta el ciclo renderizando algo neutro hasta que el cliente
> tiene la información real.

---

## `resolvedTheme` vs `theme` en next-themes

`useTheme()` de next-themes devuelve dos propiedades relacionadas pero distintas:

```tsx
const { theme, resolvedTheme, setTheme } = useTheme();
```

- **`theme`**: el valor que el *usuario* o el código seleccionó. Puede ser `"light"`, `"dark"`, o
  `"system"` (si next-themes está configurado con `enableSystem`, que es lo habitual). Cuando el
  valor es `"system"`, significa "seguir la preferencia del SO" — pero no dice cuál es esa
  preferencia.

- **`resolvedTheme`**: siempre es `"light"` o `"dark"` — nunca `"system"`. next-themes ya resolvió
  el sistema operativo y te da el tema real que se está aplicando en este momento.

**Por qué importa para lógica condicional**:

```tsx
// ❌ Puede ser "system" — la condición falla si el usuario no cambió el tema manualmente
setTheme(theme === "dark" ? "light" : "dark");

// ✅ Siempre es "light" o "dark" — funciona siempre
setTheme(resolvedTheme === "dark" ? "light" : "dark");
```

Usar `theme` para el toggle hacía que el botón llamara siempre `setTheme("light")` cuando el tema
era `"system"` (ya que `"system" !== "dark"`), aunque el sistema estuviera en dark mode.

> **Regla práctica**: usa `resolvedTheme` para cualquier lógica que dependa del tema actual
> (`if dark, do X`). Usa `theme` solo si necesitas saber si el usuario eligió "seguir al sistema".

---

## El árbol de contexto React con Server y Client Components mezclados

Cuando un Server Component pasa otro Server Component como `children` a un Client Component, los
Client Components anidados dentro de ese Server Component **siguen siendo parte del árbol de React
en el cliente** y pueden consumir context normalmente.

Ejemplo real del proyecto:

```
layout.tsx (Server Component)
  └── ThemeProvider (Client Component — provee contexto)
        └── Nav (Server Component — pasado como children)
              └── ThemeToggle (Client Component — consume contexto con useTheme())
              └── Logo      (Client Component — consume contexto con useTheme())
```

`Nav` es un Server Component: se renderiza en el servidor y su output se pasa como `children` a
`ThemeProvider`. Pero `ThemeToggle` y `Logo` dentro de `Nav` son Client Components — en el cliente,
React los hidrata como parte del árbol React. Ese árbol reconoce que están dentro de `ThemeProvider`,
así que `useTheme()` funciona con normalidad.

**La regla**: lo que determina si un Client Component puede consumir un contexto es su posición en
el **árbol React del cliente**, no en qué archivo Server Component apareció su JSX. El árbol de
componentes que React hidrata en el browser preserva el anidamiento correcto.

> **Pregunta de entrevista**: ¿puede un Client Component consumir un contexto si está anidado dentro
> de un Server Component?
> Sí — siempre que haya un `Provider` ancestor en el árbol React del cliente. El Server Component
> intermedio no "rompe" el contexto: en el cliente, React ve el árbol completo y conecta los
> consumidores con sus providers, independientemente de qué nivel de la cadena fue Server Component.

---

## CSS vs Client Component para theme switching

Hay dos estrategias para que un elemento cambie visualmente con el tema:

### Estrategia A — CSS puro

```css
/* globals.css */
.logo-dark { display: none; }
[data-theme="dark"] .logo-light { display: none; }
[data-theme="dark"] .logo-dark { display: block; }
```

```tsx
{/* Dos imágenes en el DOM; CSS oculta una según data-theme */}
<img src="/logo-light.svg" className="logo-light" />
<img src="/logo-dark.svg"  className="logo-dark"  />
```

- **Ventaja**: sin JS, sin re-renders. El navegador reacciona al cambio de `data-theme` en `<html>`
  inmediatamente, incluso antes de que React hidrate.
- **Desventaja**: ambas imágenes existen en el DOM (doble request). Puede tener conflictos de
  especificidad con Tailwind v4 o con otras clases de display.

### Estrategia B — Client Component con `useTheme()`

```tsx
"use client";
export function Logo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <img
      src={mounted && resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
      alt="Elibabah"
    />
  );
}
```

- **Ventaja**: explícita y predecible — un solo elemento en el DOM, sin CSS de display jugando.
  Más fácil de razonar y depurar.
- **Desventaja**: requiere JS. Hay un momento breve (antes de `mounted = true`) en que siempre
  se muestra el logo light (el fallback).

En este proyecto se empezó con Estrategia A y se migró a B cuando surgieron problemas de
especificidad CSS con Tailwind v4. B es la más robusta para componentes que necesitan lógica
de tema más allá de simples cambios de color.

---

## Metadata en Next.js App Router

Next.js App Router tiene dos mecanismos para definir los metadatos (`<title>`, `<meta
description>`, Open Graph, etc.) de una página. Ambos se exportan desde `page.tsx` o `layout.tsx`.

### Metadata estática — `export const metadata`

Para páginas cuyo contenido no depende de parámetros dinámicos:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Selected projects and technical experiments.",
};
```

### Metadata dinámica — `export async function generateMetadata`

Para rutas `[slug]`, donde el título y descripción vienen del contenido (front matter del MDX):

```tsx
import type { Metadata } from "next";
import { getArticleBySlug } from "@/lib/editorial";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  return {
    title: article.title,
    description: article.excerpt,
  };
}
```

Nota: `params` es `Promise<{ slug: string }>` — el mismo patrón async que ya aplica al componente
`Page` en Next.js 16.

### Title template — evitar repetir el nombre del sitio

En el root `layout.tsx`, en vez de un string fijo, se define una plantilla:

```tsx
export const metadata: Metadata = {
  title: {
    default: "Elibabah — Elías Hernández", // usado cuando la página no define título propio
    template: "%s | Elibabah",              // %s es reemplazado por el título de cada página
  },
  description: "Software developer. Portfolio and editorial.",
};
```

Con esto, una página que exporte `title: "Portfolio"` genera automáticamente `Portfolio | Elibabah`
en el browser tab y en SEO, sin tener que escribir el sufijo en cada página.

**Trampa real de este proyecto**: al implementar metadata en múltiples páginas se copió el bloque
de portfolio sin actualizar el `title` ni la `description`, resultando en que todas las páginas
decían `"Portfolio"`. Además, dos rutas dinámicas (`editorial/[slug]` y `case-studies/[slug]`)
usaban `getProjectBySlug` (la función de portfolio) en vez de sus funciones correctas, lo que
habría causado crashes en runtime. La fuente de verdad siempre debe ser la función de lib que
corresponde a la ruta.

> **Pregunta de entrevista**: ¿cuándo usarías `generateMetadata` en vez de `export const metadata`?
> Cuando el título o descripción dependen de datos que solo se conocen en runtime: el slug de la
> URL, el contenido de una base de datos, o una API externa. Para páginas estáticas (listados,
> about, contacto), `export const metadata` es suficiente.

---

## Favicon en Next.js App Router — convención de archivos

Next.js App Router tiene una **convención de archivos especiales** en la carpeta `app/` para
metadata de íconos. Sin necesidad de configurar nada en `layout.tsx`, si colocas alguno de estos
archivos en `app/`, Next.js genera automáticamente los `<link>` tags correctos en el `<head>`:

| Archivo | Resultado |
|---|---|
| `app/favicon.ico` | `<link rel="icon" href="/favicon.ico">` |
| `app/icon.svg` | `<link rel="icon" href="/icon.svg" type="image/svg+xml">` |
| `app/icon.png` | `<link rel="icon" href="/icon.png" type="image/png">` |
| `app/apple-icon.png` | `<link rel="apple-touch-icon" href="/apple-icon.png">` |

En este proyecto se usa `app/icon.svg`.

### SVG favicon con soporte de dark mode

Los archivos SVG soportan CSS interno, incluyendo `@media (prefers-color-scheme: dark)`. Esto
permite un favicon que cambia de color según el tema del sistema operativo:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 627 358">
  <style>
    path { fill: #20221a; }
    @media (prefers-color-scheme: dark) { path { fill: #fafafa; } }
  </style>
  <path fill-rule="evenodd" d="...paths del logo..." />
</svg>
```

**Puntos clave de la implementación**:
- Se elimina `fill="..."` del elemento `<path>` — el color lo controla el CSS, no el atributo.
- Se eliminan `width` y `height` fijos del `<svg>` — los favicons escalan por `viewBox`.
- Se usa `prefers-color-scheme` (preferencia del OS), **no** `data-theme` (variable del DOM).

**Por qué `prefers-color-scheme` y no `data-theme`**: el favicon vive fuera del árbol HTML del
documento. El atributo `data-theme` en `<html>` es un selector CSS que aplica al árbol del DOM,
pero el SVG del favicon se renderiza en el browser como imagen aislada — no tiene acceso al DOM
de la página. Solo puede leer variables del entorno del navegador, como `prefers-color-scheme`.

> **Pregunta de entrevista**: ¿en qué se diferencian `prefers-color-scheme` y `data-theme`?
> `prefers-color-scheme` es una media query CSS que lee la preferencia del sistema operativo —
> funciona en cualquier contexto (CSS, SVG embebido, etc.) sin JS. `data-theme` es un atributo
> custom en el `<html>` que libraries como next-themes escriben via JS para permitir selección
> manual del usuario. En el DOM del sitio son equivalentes cuando el usuario no cambió el tema;
> pero fuera del DOM (favicon, imágenes SVG externas) solo existe `prefers-color-scheme`.

---

## Especificidad CSS — cómo depurar cuando el tema oscuro no aplica

**El problema real de este proyecto**: `[data-theme="dark"]` no sobreescribía `--background`
aunque el atributo estuviera en `<html>`. La variable seguía resolviendo el valor claro.

**Por qué ocurre**: `:root` y `[data-theme="dark"]` tienen la misma especificidad CSS — ambos son
selectores de pseudo-clase / atributo con valor 0,1,0. Cuando dos reglas tienen la misma
especificidad, **gana la que aparece más tarde en el CSS**. Tailwind v4 procesa y reordena el CSS
al compilar, por lo que el bloque de `:root` puede quedar después del bloque `[data-theme="dark"]`
en el output final, haciendo que `:root` gane.

**La solución**: añadir `html` al selector oscuro para sumar un elemento y elevar la especificidad
de 0,1,0 a 0,1,1:

```css
/* ❌ Especificidad 0,1,0 — puede perder contra :root si el orden CSS cambia */
[data-theme="dark"] {
  --background: #121514;
}

/* ✅ Especificidad 0,1,1 — siempre gana a :root (0,1,0) */
html[data-theme="dark"] {
  --background: #121514;
}
```

**Cómo se diagnostica**: si cambiar el color manualmente en DevTools funciona pero el CSS
automático no, el problema es que la variable CSS no se está sobreescribiendo — no que el
`background` no se aplique. El siguiente paso es verificar si `data-theme="dark"` está realmente
en el `<html>` en el panel Elements de DevTools.

> **Regla práctica para theming**: cuando uses un atributo de `<html>` para controlar variables
> CSS, hacer el selector más específico con `html[data-theme="dark"]` es más robusto que
> `[data-theme="dark"]` solo — te protege de conflictos de orden en el CSS procesado.

---

## Navegación responsive — patrón con Tailwind y `useState`

Un nav responsive con hamburguesa necesita tres responsabilidades separadas en el marcado:

```
1. Brand (logo + nombre) — siempre visible
2. Links desktop         — visible en md+, oculto en mobile
3. Controles mobile      — visible en mobile, oculto en md+
```

Se implementa con dos clases utilitarias de Tailwind para visibilidad responsiva:
- `hidden md:flex` — oculto en mobile, flex en desktop
- `flex md:hidden` — flex en mobile, oculto en desktop

```tsx
"use client"
import { useState } from "react"

export function Nav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header>
      <nav>
        {/* 1. Brand — siempre visible */}
        <div>Logo + nombre</div>

        {/* 2. Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {/* links + ThemeToggle + Contact */}
        </div>

        {/* 3. Mobile */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Panel desplegable — fuera del <nav>, dentro del <header> */}
      {isOpen && (
        <div className="md:hidden border-t border-line px-6 py-6 flex flex-col gap-5">
          <Link href="/portfolio" onClick={() => setIsOpen(false)}>Portfolio</Link>
          {/* ... */}
        </div>
      )}
    </header>
  )
}
```

**Puntos clave**:
- El Nav completo se convierte en Client Component (`"use client"`) para poder usar `useState`.
- El panel va **fuera del `<nav>`** pero dentro del `<header>` — el header es `sticky top-0`, así
  el panel se queda pegado al tope de pantalla junto con el nav.
- Cada `<Link>` del panel llama `onClick={() => setIsOpen(false)}` para cerrar el menú al navegar.
- Los íconos hamburguesa/cierre se implementan con SVG inline para control total del tamaño y
  color (`stroke="currentColor"` hereda el color del texto del tema).

> **Pregunta de entrevista**: ¿por qué el panel del menú móvil va fuera del `<nav>` y no dentro?
> Semánticamente, `<nav>` contiene los links de navegación — el panel los contiene, así que podría
> ir dentro. En la práctica, va fuera porque el `<nav>` tiene `flex items-center justify-between`
> para la fila del header: si el panel es un hijo directo, ese flex lo pondría en línea con el
> logo. Poniéndolo como hermano del `<nav>` (dentro del `<header>`), queda como bloque debajo.

---

## Next.js App Router — convenciones de archivo para SEO y metadata

Además de `page.tsx` y `layout.tsx`, Next.js reserva varios nombres de archivo en `app/` para
generar automáticamente metadata y recursos sin configuración extra:

| Archivo | Genera | URL |
|---|---|---|
| `opengraph-image.tsx` | `<meta property="og:image">` | `/opengraph-image` |
| `twitter-image.tsx` | `<meta name="twitter:image">` | `/twitter-image` |
| `not-found.tsx` | página 404 personalizada | cualquier ruta inexistente |
| `sitemap.ts` | `sitemap.xml` | `/sitemap.xml` |
| `robots.ts` | `robots.txt` | `/robots.txt` |
| `icon.svg` / `icon.png` | `<link rel="icon">` | — |

**Herencia en el árbol de rutas**: un `opengraph-image.tsx` en `app/` aplica a todas las rutas del
sitio. Si una subruta tiene su propio `opengraph-image.tsx`, lo sobreescribe para esa rama. Esto
permite una imagen base global y variantes específicas por sección sin repetir código.

`sitemap.ts` y `robots.ts` exportan funciones que devuelven tipos de Next.js:

```ts
// app/sitemap.ts
import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://elibabah.com" },
    { url: "https://elibabah.com/portfolio" },
    // ... rutas dinámicas desde getAllProjects(), getAllArticles(), etc.
  ]
}

// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://elibabah.com/sitemap.xml",
  }
}
```

> **Por qué importa para un recruiter técnico**: tener sitemap y robots correctamente configurados
> demuestra comprensión del ciclo completo de un producto web — no solo el código, sino también
> cómo los motores de búsqueda lo descubren e indexan.

---

## `ImageResponse` y Satori — generación de imágenes OG en el servidor

`ImageResponse` (de `next/og`) es una función que recibe JSX y genera una imagen PNG en el
servidor. Internamente usa **Satori**, un renderer de JSX-a-SVG desarrollado por Vercel.

```tsx
// app/opengraph-image.tsx
import { ImageResponse } from "next/og"
import { readFileSync } from "fs"
import { join } from "path"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  const fontData = readFileSync(join(process.cwd(), "public/fonts/SourceSerif4-Bold.ttf"))

  return new ImageResponse(
    (<div style={{ backgroundColor: "#121514", width: 1200, height: 630 }}>...</div>),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Source Serif 4", data: fontData, weight: 700 }],
    }
  )
}
```

**Limitaciones de Satori que hay que conocer**:

1. **Solo estilos inline** — no Tailwind, no clases CSS externas. Todo con `style={{}}`.
2. **No `background` shorthand** — usar `backgroundColor` para fondos sólidos. `background` se
   ignora silenciosamente (el fondo queda blanco).
3. **No SVG en `<img>`** — los SVG embebidos como `data:image/svg+xml;base64,...` en una etiqueta
   `<img>` no se renderizan. Solo PNG y JPEG funcionan como fuentes de imagen.
4. **Fuentes explícitas** — Satori no tiene acceso a las fuentes de `next/font/google`. Hay que
   proveer el `.ttf` manualmente en el array `fonts` de `ImageResponse`. Los `.ttf` estáticos
   (weights fijos) son más simples que variable fonts.
5. **Subset de CSS** — Satori implementa un subconjunto de Flexbox. No soporta CSS Grid, `position:
   absolute` limitado, ni todas las propiedades. Diseñar con Flexbox puro.

**Runtime**: sin declarar `export const runtime`, el archivo corre en Node.js serverless — lo que
permite usar `fs.readFileSync` para leer fuentes e imágenes locales con `process.cwd()` como raíz.

> **Pregunta de entrevista**: ¿cuándo generarías imágenes OG dinámicas vs una imagen estática?
> Una imagen estática (un PNG en `app/`) es suficiente cuando todas las páginas comparten la misma
> imagen de preview. Imágenes dinámicas (`opengraph-image.tsx` que lee params) valen la pena cuando
> el título del artículo o el nombre del proyecto deben aparecer en la imagen — mejoran el CTR en
> LinkedIn y Twitter porque el preview ya dice de qué trata el contenido antes de hacer clic.

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

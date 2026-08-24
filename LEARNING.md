# Notas de aprendizaje — elibabah-web

> Bitácora de conceptos técnicos aprendidos mientras se construye el sitio.
> Este archivo es **solo de agregar** (append-only): no se borra contenido viejo al sumar uno nuevo,
> aunque algo quede desactualizado se anota como tal en vez de eliminarse.
>
> Pensado también como banco de repaso para entrevistas técnicas.
>
> **Revisión: 24 de agosto de 2026.** Se contrastaron las afirmaciones del archivo contra el código
> actual. Lo que resultó impreciso **no se borró**: queda marcado con un bloque
> **⚠ Corrección (agosto 2026)** debajo del texto original, para que se vea qué se creía entonces y
> qué resultó ser cierto. Equivocarse y anotarlo es parte de la bitácora.

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

### Import directo dentro de un archivo `"use client"`: dos formas distintas de romperse

Si en vez de recibir un Server Component como `children`, un archivo `"use client"` lo **importa
directamente** (`import ProjectCard from "./ProjectCard"` dentro de `ThemeProvider.tsx`, por ejemplo,
y lo renderiza ahí mismo), ese import queda atrapado en el module graph del cliente — Next.js lo
empaqueta como JS de navegador, sin importar que `ProjectCard` no tenga su propio `"use client"`. A
partir de ahí hay dos escenarios posibles, con síntomas muy distintos:

1. **Si el componente usa APIs exclusivas de servidor** (`fs.readFileSync`, ser `async function` con
   `await getProjectBySlug(...)`, leer variables de entorno privadas) → **error real y visible**. Esas
   APIs no existen en el bundle del navegador, así que la app truena en build o en runtime.
2. **Si el componente es puramente presentacional** (solo props → JSX, sin nada server-only) → **no
   truena, pero pierde su naturaleza de Server Component en silencio**. Sigue funcionando
   visualmente, pero ahora se envía como JS al cliente igual que cualquier Client Component — bundle
   más pesado, sin ningún error que lo delate.

**Por qué `children` no tiene este problema**: cuando el Server Component llega como `children` desde
un padre Server Component, ya fue renderizado y resuelto en el servidor antes de llegar al Client
Component — para éste, `children` es un valor opaco (RSC payload ya resuelto), no un módulo que tenga
que importar y empaquetar. El bundler nunca rastrea su código.

**Regla práctica**: import directo = el bundler tiene que rastrear y empaquetar ese código para el
cliente (con o sin error, según lo que contenga). `children` = el resultado ya viene resuelto desde
afuera, nada que el bundler necesite rastrear.

> **Pregunta de entrevista**: ¿qué pasa si un archivo `"use client"` importa y renderiza directamente
> un Server Component (en vez de recibirlo como `children`)?
> Ese import queda dentro del module graph del cliente, así que Next.js lo trata como código de
> cliente. Si el componente depende de APIs exclusivas de servidor, falla con un error real. Si es
> puramente presentacional, no falla pero pierde su condición de Server Component sin avisar —
> termina enviándose como JS al navegador igual que cualquier otro Client Component.

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

> **Pregunta de entrevista**: si el `ThemeProvider` es un Client Component y envuelve toda la
> aplicación, ¿no queda todo el árbol convertido en cliente?
> No. El límite `"use client"` se propaga por el **grafo de imports**, no por el anidamiento en el
> JSX (ver la sección de más arriba sobre esto). `layout.tsx` sigue siendo Server Component: renderiza
> a sus hijos en el servidor y se los pasa al Provider como la prop `children`, ya convertidos en
> payload. El Provider recibe un resultado, no ejecuta esos componentes. Por eso el patrón funciona:
> solo la cáscara del Provider viaja al navegador.

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

> **Pregunta de entrevista**: si el tema cambia, ¿por qué React no se entera ni re-renderiza?
> Porque el cambio no ocurre en el estado de React. `next-themes` muta un atributo del DOM
> (`data-theme` en `<html>`) por fuera del árbol de fibers; el navegador recalcula estilos y
> repinta, y React ni siquiera participa. La alternativa (guardar el color en `useState` y pasarlo
> por props o contexto) obligaría a re-renderizar a cada consumidor en cada cambio de tema. El
> matiz importante: eso también significa que **el JS de React no puede leer el tema desde el CSS**;
> para eso hace falta `useTheme()`, y ahí sí aparece el problema de hidratación que resuelve el
> patrón `mounted`.

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

**Qué hace `inline` con precisión** (verificado contra la documentación de Tailwind v4): la palabra
clave cambia **qué escribe Tailwind dentro de la clase utilitaria**. Sin `inline`, la utilidad
referencia el token: `background-color: var(--color-background)`. Con `inline`, Tailwind **mete el
valor del token** en la utilidad: `background-color: var(--background)`.

La diferencia importa por una regla de CSS que sorprende: **una `var()` se resuelve donde la variable
se define, no donde se usa**. Sin `inline`, `--color-background` queda definida una sola vez en el
`:root` que genera Tailwind, y ahí dentro `var(--background)` se congela contra el valor de `:root`;
el bloque `html[data-theme="dark"]` que sobreescribe `--background` llega tarde y no cambia nada. Con
`inline` la indirección desaparece: la utilidad apunta directo a `--background`, que se resuelve en el
elemento donde se aplica y por tanto sí ve el valor del tema activo.

> **Verruga real del proyecto**: la mayoría de los tokens mapean un nombre a otro
> (`--color-background: var(--background)`), pero el acento se mapea a **sí mismo**
> (`--color-accent: var(--color-accent)`), porque en `:root` la variable cruda ya se llamó
> `--color-accent` en vez de `--accent`. Funciona por lo mismo que explica el párrafo anterior, pero
> rompe la convención del resto del bloque. Si algún día se renombra, hay que tocar `:root`,
> `html[data-theme="dark"]` y `@theme inline` a la vez.

> **Pregunta de entrevista**: tienes un tema claro/oscuro con variables CSS y las clases de Tailwind
> se quedan siempre con los colores del tema claro. ¿Qué revisas?
> Que el bloque sea `@theme inline` y no `@theme` a secas. Con `@theme` simple, la utilidad
> referencia el token de Tailwind, ese token se define una única vez en `:root`, y la `var()` interna
> se resuelve ahí, contra los valores claros; el selector del tema oscuro nunca entra en juego. El
> segundo sospechoso, si `inline` ya está puesto, es la especificidad del selector oscuro (ver la
> sección sobre `html[data-theme="dark"]` más abajo).

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

> **Pregunta de entrevista**: la tipografía se ve bien en desarrollo pero en producción cae al
> fallback del sistema, sin ningún error en consola. ¿Dónde miras?
> En que la variable de `next/font` esté realmente en el `className` del `<html>`. `next/font`
> **no registra la fuente globalmente**: solo crea una custom property, y si esa property no está
> en un ancestro del elemento, `var(--font-heading)` no resuelve y CSS baja silenciosamente al
> siguiente candidato de la pila. No hay error porque, para el navegador, un `font-family` que no
> resuelve es un caso normal, no un fallo. El síntoma es tipografía equivocada sin diagnóstico, que
> es el peor tipo de fallo.
>
> Corolario que muerde en este proyecto: **Satori no puede leer un objeto de `next/font`**. Las
> imágenes OG generadas con `ImageResponse` necesitan el `.ttf` crudo leído con `fs`, y por eso
> `public/fonts/SourceSerif4-Bold.ttf` existe duplicado a propósito (ver la sección de
> `ImageResponse` más abajo).

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

> **Pregunta de entrevista**: si `layout.tsx` persiste entre navegaciones y no se vuelve a
> renderizar, ¿qué le pasa al estado de un Client Component que vive dentro del layout?
> **Sobrevive a la navegación.** Es exactamente lo que se quiere para un reproductor de audio o un
> scroll de sidebar, y exactamente lo que no se quiere para un menú móvil: al pulsar un enlace la
> ruta cambia, pero el panel se queda abierto encima del contenido nuevo, porque nadie tocó su
> `useState`.
>
> En este proyecto el `Nav` vive en el layout raíz y lo resuelve cerrando el menú a mano en cada
> enlace (`onClick={() => setIsOpen(false)}` en [components/layout/Nav.tsx](components/layout/Nav.tsx)).
> La alternativa es un `useEffect` sobre `usePathname()`, que cierra ante cualquier cambio de ruta
> (incluido el botón atrás del navegador) en vez de solo ante los clicks que uno recordó instrumentar.

---

## Decisiones de diseño aplicadas en este proyecto (referencia rápida)

- Fondo/texto base coordinados con los tonos del logo (no blanco/negro puro):
  light `#fafafa` / `#20221a`, dark `#20221a` / `#fafafa`.

> **⚠ Corrección (agosto 2026)**: esos cuatro hexadecimales quedaron viejos; la paleta se afinó
> después y nadie actualizó esta nota. Los valores vigentes en
> [app/globals.css](app/globals.css) son light `#F6F7F6` / `#15160F` y dark `#121514` / `#ECEEEA`.
> Los acentos (`#0C5566` / `#4D9FB3`) sí siguen siendo correctos.
>
> La lección no es el color: es que **una lista de valores copiados a mano se desincroniza en
> silencio**. `globals.css` es la fuente de verdad, y cualquier documento que repita sus valores
> literales es una copia que envejece. Lo que sí vale la pena documentar aquí es la *regla* (el
> acento solo en links, kickers, pills y CTAs), no el hexadecimal.
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

> **Pregunta de entrevista**: `getAllArticles()` lee **todos** los `.mdx` de la carpeta para pintar
> un listado. ¿Qué pasa si uno solo de esos archivos tiene el front matter mal formado?
> Se cae la colección entera, no ese artículo. `matter()` lanza al parsear YAML inválido, y como la
> lectura ocurre dentro de un `map` sobre el directorio, la excepción sube y tumba el listado, la
> home y cualquier página que llame al loader. Un archivo roto tiene **radio de impacto de
> colección**, no de documento.
>
> Es un fallo de build, así que nunca llega a producción, pero conviene saber leerlo: el error habla
> de YAML y no menciona el archivo culpable de forma obvia. Ver más abajo la sección sobre los dos
> puntos sin comillas, que es la causa concreta con la que se tropezó dos veces aquí.

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

> **Pregunta de entrevista**: ¿por qué convertirían `params` en una Promise? Parece una molestia
> gratuita.
> Porque permite empezar a renderizar el layout **antes** de conocer los params. Si `params` fuera
> sincrónico, Next.js tendría que resolver el segmento dinámico completo antes de emitir una sola
> línea de HTML; siendo una Promise, la parte estática del árbol puede transmitirse ya y la parte que
> depende de los params se suspende hasta que estén. Es la misma idea detrás de `searchParams`
> asíncrono y del streaming en general: **diferir lo que bloquea, en vez de esperar a todo**.
>
> Detalle práctico: el `await` hay que hacerlo, pero no cuesta nada cuando el valor ya está resuelto.
> Y en las rutas prerrenderizadas de este sitio (`generateStaticParams` + `dynamicParams = false`)
> ese await ocurre en build time, no en el request.

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

> **Pregunta de entrevista**: `prose` trae su propia paleta de grises. ¿Cómo la haces respetar los
> tokens de tema del sitio en vez de los suyos?
> Sobreescribiendo las custom properties que el propio plugin expone (`--tw-prose-body`,
> `--tw-prose-headings`, `--tw-prose-links`, `--tw-prose-bold`…) y apuntándolas a los tokens
> propios. El plugin está construido sobre variables justamente para eso, así que no hace falta
> pelear con `prose-p:` ni con `!important` elemento por elemento.
>
> Por qué importa aquí en concreto: sin ese mapeo, en tema oscuro `prose-neutral` seguiría pintando
> el cuerpo en gris oscuro sobre fondo oscuro. Y la regla de color del proyecto (el acento solo en
> links, kickers, pills y CTAs) se aplica exactamente en este punto: `--tw-prose-links` va al acento,
> `--tw-prose-headings` **no**.

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

> **⚠ Corrección (agosto 2026)**: la segunda viñeta afirma que escribir `section: "sports"` en el
> front matter se detecta en compile time. **Es falso**, y conviene entender por qué, porque es un
> malentendido muy común sobre TypeScript.
>
> El YAML no lo lee TypeScript: lo lee `gray-matter` en runtime, y devuelve `data` tipado como `any`.
> El código hace entonces una **aserción de tipo**, no una validación:
>
> ```ts
> // lib/editorial.ts
> const { data, content } = matter(raw);
> return { ...(data as ArticleFrontmatter), readingTime: readingTimeOf(content) };
> ```
>
> `as` no comprueba nada; le promete al compilador que el valor tiene esa forma y el compilador se
> calla. Un `section: "sports"` en el `.mdx` compila sin una sola queja, y lo que ocurre después es
> que el artículo simplemente no aparece en ningún listado, porque ningún `getArticlesBySection()`
> pide esa sección. **Un fallo silencioso, no un error.**
>
> Lo que la viñeta sí describe bien es la otra mitad: dentro del código TypeScript, una llamada
> `getArticlesBySection("sports")` sí se rechaza en compile time. La frontera es el archivo: del
> `.mdx` hacia adentro no hay garantía, del `lib/` hacia adentro sí.
>
> Para cerrar de verdad ese hueco haría falta validar en runtime al leer el archivo (un `zod`, o a
> mano un `if (!SECTIONS.includes(data.section)) throw`), lo que convertiría el fallo silencioso en
> un error de build con el nombre del archivo. No está hecho, y es una decisión razonable para un
> sitio de un solo autor; sería insostenible con varios.

> **Pregunta de entrevista**: ¿en qué se diferencia `as Foo` de una validación, y cuándo es peligroso?
> `as` es una aserción: apaga la comprobación del compilador para esa expresión, sin generar ni una
> línea de código que verifique nada en runtime. Es seguro cuando el valor viene de un sitio que tú
> controlas y el compilador simplemente no puede saberlo (un `querySelector`, por ejemplo). Es
> peligroso justo en la frontera del sistema: JSON de una API, respuestas de red, archivos en disco,
> `process.env`. Ahí `as` no te da tipos, te da la **ilusión** de tipos, y el error reaparece más
> tarde y más lejos del origen. La regla práctica: **validar en el borde, tipar hacia adentro**.

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

> **Pregunta de entrevista**: ¿por qué `resolvedTheme` es `undefined` en el primer render, y por qué
> no basta con darle un valor por defecto?
> Porque en el servidor no existe ni `localStorage` ni `prefers-color-scheme`: el tema real es
> literalmente incognoscible en ese momento. `next-themes` devuelve `undefined` en vez de inventarse
> un valor, que es la respuesta honesta.
>
> Poner un default (`resolvedTheme ?? "light"`) parece arreglarlo y en realidad **fabrica un
> hydration mismatch**: el servidor pinta el árbol en claro, el cliente lo pinta en oscuro, React
> compara y protesta. Por eso el patrón correcto es el de `mounted`: no adivinar el tema, sino
> renderizar un marcador neutro hasta que el cliente pueda responder con certeza. La distinción de
> fondo es entre *no saber todavía* y *saber que es claro*, y son cosas distintas.

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

> **Pregunta de entrevista**: la Estrategia B introduce un parpadeo (el logo claro aparece un
> instante antes de que `mounted` sea `true`). ¿Cómo lo evitarías sin volver a la A?
> La tercera vía es **no cambiar de archivo, sino de tinta**: un solo SVG inline que use
> `fill="currentColor"`, y dejar que el color lo herede del CSS. Desaparecen las dos imágenes de la
> A, desaparece el estado de la B, no hay parpadeo porque no hay JS involucrado, y de paso se ahorra
> un request. Es la opción correcta para un logotipo monocromo como el de este sitio, y por eso
> CLAUDE.md la menciona junto al patrón `<picture>`.
>
> La B sigue siendo la respuesta cuando las dos variantes **no son el mismo dibujo** (distinto
> trazo, distinto contraste, distinta versión), porque ahí ya no basta con recolorear. La pregunta
> real que hay detrás es: ¿esto es un cambio de color o un cambio de contenido? Si es color, resuélvelo
> en CSS; si es contenido, en JS.

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

> **Pregunta de entrevista**: ¿por qué no resolver esto con `!important` y seguir adelante?
> Porque `!important` no arregla la causa (dos selectores empatados a merced del orden del output),
> sino que gana la discusión por la fuerza y deja el problema para el siguiente. En variables CSS
> además escala fatal: cada token que se sobreescriba necesita su propio `!important`, y en cuanto
> algo legítimo tenga que ganarle a ese valor hace falta otro `!important` encima. Subir la
> especificidad de 0,1,0 a 0,1,1 añadiendo `html` cuesta cinco caracteres, es determinista y no
> hipoteca nada.
>
> El razonamiento general que busca esta pregunta: `!important` es una respuesta a *quién gana*
> cuando la pregunta real es *por qué hay empate*. Casi siempre hay una forma barata de deshacer el
> empate.

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

> **⚠ Corrección (agosto 2026)**: la herencia es cierta, pero tiene una condición que este párrafo
> omite y que costó una sesión entera de depuración: **declarar un bloque `openGraph` en
> `generateMetadata` desactiva la herencia de la imagen OG de la raíz**.
>
> ```ts
> // Esto hace que la página deje de heredar app/opengraph-image.tsx
> export async function generateMetadata() {
>   return {
>     openGraph: { type: "article", title, description, url },  // sin images
>   };
> }
> ```
>
> La intuición dice que `openGraph` y la convención de archivo son dos mecanismos independientes que
> se suman. No lo son: al declarar `openGraph` a mano, ese objeto sustituye al heredado en lugar de
> fusionarse con él, y como no trae `images`, la página se queda **sin ninguna** `og:image`. El
> síntoma es un enlace que se comparte sin tarjeta, sin ningún error en el build.
>
> Lo que sí sigue aplicando es el `opengraph-image.tsx` **del mismo segmento**. Por eso la solución
> no fue quitar el bloque `openGraph`, sino añadir el archivo que faltaba en
> `app/research/[slug]/`; el de `app/editorial/[slug]/` ya existía, y por eso una rama funcionaba y
> la otra no, con un `generateMetadata` prácticamente idéntico.
>
> Cómo detectarlo en dos segundos, que es la parte reutilizable:
>
> ```bash
> curl -s https://elibabah.com/research/mi-slug | grep -o 'og:image[^>]*'
> ```
>
> Si no imprime nada, no hay tarjeta. Vale la pena correrlo sobre una URL de cada colección antes de
> compartir cualquier cosa, porque el build no avisa.

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

> **Pregunta de entrevista**: `sitemap.ts` y `robots.ts` son archivos `.ts`, no `.xml` ni `.txt`.
> ¿Cuándo se ejecutan y qué implica eso?
> Se ejecutan en **build time** (siempre que no toquen APIs dinámicas), y su salida se congela como
> un archivo estático. La implicación práctica es que el sitemap puede recorrer el sistema de
> archivos con `getAllProjects()`, `getAllArticles()`, `getAllResearch()` y quedar siempre completo
> sin mantenimiento manual: añadir un `.mdx` lo mete en el sitemap sin tocar código.
>
> La contrapartida es que **el sitemap solo se actualiza al desplegar**. Para un sitio de contenido
> estático como este eso es exactamente lo que se quiere, porque el contenido tampoco cambia sin
> desplegar. Sería la decisión equivocada en un sitio cuyo contenido lo escriben usuarios contra una
> base de datos.

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

---

## Datos estructurados (JSON-LD) para SEO por nombre propio

`meta description` y Open Graph controlan **cómo se ve** tu página en un resultado de búsqueda o al
compartir un link. **JSON-LD** es un mecanismo distinto: le dice al buscador **de qué entidad trata**
la página, en un vocabulario estandarizado (schema.org), sin ambigüedad de lenguaje natural.

El problema que resuelve: si alguien busca tu nombre legal completo, tu nombre profesional, y tu
handle de marca, son tres strings de texto distintos. Sin señal explícita, un buscador no tiene por
qué asumir que las tres apuntan a la misma persona — solo puede matchear texto literal.

Ejemplo real de este proyecto ([app/layout.tsx](app/layout.tsx)):

```ts
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "David Elías Hernández Morales",
  alternateName: ["Elías Hernández", "Elibabah"],
  url: "https://elibabah.com",
  jobTitle: "Frontend Engineer",
  address: {
    "@type": "PostalAddress",
    addressCountry: "NZ",
  },
  sameAs: [
    "https://www.linkedin.com/in/elibabah/",
    "https://github.com/elibabah",
  ],
};
```

- **`name`**: la forma canónica de la entidad.
- **`alternateName`**: variantes válidas de la misma entidad (no es keyword stuffing porque son
  strings reales por las que te buscan, no relleno).
- **`sameAs`**: la señal más fuerte del bloque. Cualquiera puede escribir cualquier texto en su
  propio dominio, pero enlazar perfiles ya verificados en otras plataformas (LinkedIn, GitHub) es
  mucho más difícil de falsear — por eso el buscador le da más peso que al texto propio.

Se renderiza directamente en el JSX, no en un `<head>` manual (el App Router gestiona el `<head>` vía
la Metadata API, no acepta un `<head>` explícito):

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
/>
```

`dangerouslySetInnerHTML` normalmente es riesgo de XSS cuando el HTML viene de una fuente externa o
de input de usuario. Acá es seguro porque `personJsonLd` es un objeto estático que escribe el propio
desarrollador — no hay dato externo ni de usuario involucrado en el string que se inyecta.

**Regla de coherencia**: lo que declara el JSON-LD debe reflejarse también en el texto visible de la
página. En este proyecto, el nombre legal completo se agregó primero solo al schema — hubo que
sumarlo también como texto real en la bio de `/about` para que el markup no describiera algo que un
usuario (o el propio buscador, al comparar) no puede ver en la página.

> **Pregunta de entrevista**: ¿por qué usar JSON-LD en vez de simplemente escribir el texto en la
> página?
> El texto ayuda a que Google indexe esas palabras, pero no le dice explícitamente que "David Elías
> Hernández Morales", "Elías Hernández" y "Elibabah" son la misma entidad, ni conecta el dominio con
> perfiles externos ya establecidos. JSON-LD hace esa relación explícita y estructurada, lo cual es
> la base para que un buscador arme un grafo de conocimiento coherente sobre una persona o marca.

### Validar el JSON-LD: dos herramientas con propósitos distintos

Existen dos herramientas de Google/schema.org para chequear structured data, y **no son
intercambiables**:

- **Rich Results Test** (`search.google.com/test/rich-results`) — solo detecta tipos de schema que
  están en la lista específica de Google de tipos elegibles para "rich results" (resultados con
  mejoras visuales en el buscador: estrellas de reseña, breadcrumbs, FAQs, recetas, eventos...).
  `Person` suelto **no está en esa lista**, así que esta herramienta va a decir "No items detected"
  aunque el JSON-LD esté perfecto — no es un error, es que la pregunta que hace esa herramienta
  ("¿esto genera un rich result?") no aplica a este tipo de schema.
- **Schema Markup Validator** (`validator.schema.org`) — valida la sintaxis y estructura de
  *cualquier* tipo de schema.org, sin filtrar por elegibilidad a rich results. Es la herramienta
  correcta para confirmar que un `Person` (o cualquier tipo no cubierto por rich results) está bien
  formado: campos correctos, tipos anidados válidos, sin errores de sintaxis.

**Regla práctica**: si el tipo de schema que usás no aparece en la lista de rich results de Google
(`Person`, por ejemplo), usá el Schema Markup Validator para confirmar validez — el Rich Results Test
siempre va a reportar "no items detected" para ese caso, sin que eso signifique nada malo.

> **Pregunta de entrevista**: ¿por qué el Rich Results Test de Google puede decir "no items detected"
> para un JSON-LD que en realidad está bien implementado?
> Porque esa herramienta no valida structured data en general — solo detecta los tipos específicos
> que Google soporta como "rich results" visuales en el buscador. Si el tipo de schema (como `Person`
> suelto) no está en esa lista, la herramienta correcta para validar sintaxis y estructura es el
> Schema Markup Validator de schema.org, que sí cubre cualquier tipo del vocabulario.

---

## Falso positivo de hidratación causado por extensiones del navegador

La sección de "Hidratación" más arriba cubre mismatches **reales y esperados**, generados por el
propio código (tema claro/oscuro). Existe una segunda categoría, distinta: mismatches que el buscador
reporta pero que **no los genera tu código en absoluto**.

Caso real de este proyecto: la consola tiraba

```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
```

señalando en el diff atributos como `data-new-gr-c-s-check-loaded` y `data-gr-ext-installed` en el
`<body>`. Ninguno de esos atributos existe en el código del proyecto — los inyecta la extensión
**Grammarly** del navegador, modificando el DOM del lado del cliente antes de que React termine de
hidratar. El servidor nunca los generó, así que al comparar árbol servidor vs. cliente, React los
detecta como diferencia y avisa.

**Cómo diagnosticarlo**: mirar el nombre del atributo marcado en el diff. Prefijos de terceros
conocidos (`data-gr-*` de Grammarly, `data-lt-*` de LanguageTool, `data-darkreader-*`, etc.) que no
aparecen en ningún archivo del proyecto son la pista. El propio mensaje de error de Next.js lo
enumera como causa posible ("It can also happen if the client has a browser extension installed").
Para confirmarlo del todo: reproducir en una ventana de incógnito sin extensiones — si el warning
desaparece, es la extensión, no el código.

**Solución**: `suppressHydrationWarning` en el nodo afectado. Ya se usa en `<html>` para el caso de
`next-themes` ([app/layout.tsx](app/layout.tsx)); puede aplicarse igual al `<body>` si la extensión
inyecta atributos ahí. El prop es local a ese nodo puntual — no oculta mismatches reales en otras
partes del árbol.

**Diferencia clave con el patrón `mounted`**:
- Patrón `mounted` → el mismatch es real y lo genera tu propio código (ej. tema) — hay que resolverlo
  con lógica, no con `suppressHydrationWarning`.
- Extensión de navegador → el mismatch no lo genera tu código — es ruido externo, y silenciarlo con
  `suppressHydrationWarning` es la respuesta correcta, no un parche que esconde un bug real.

> **Pregunta de entrevista**: ¿cómo distinguirías un hydration mismatch real de uno causado por una
> extensión del navegador?
> Mirando qué atributos marca el diff. Si son props que tu propio código controla (`data-theme`,
> clases condicionales, valores que dependen de estado), es un mismatch real que requiere el patrón
> `mounted` o ajustar la lógica. Si son atributos con prefijos de terceros que no existen en ningún
> archivo del proyecto, es una extensión inyectando HTML en el cliente — confirmable reproduciendo en
> una ventana sin extensiones.

---

## Componentes custom dentro de MDX — el prop `components` de `next-mdx-remote`

A diferencia de `@next/mdx` (donde los archivos `.mdx` son las páginas mismas y comparten el árbol de
imports normal de la app), `next-mdx-remote/rsc` compila un string de MDX que llega de **fuera** del
grafo de módulos de Next — viene de `content/*.mdx`, leído con `fs`. Eso significa que un tag como
`<Image src="..." alt="..." />` escrito dentro del MDX **no tiene ningún componente detrás por
default**. Hay que decírselo explícitamente:

```tsx
<MDXRemote source={project.content} components={mdxComponents} />
```

`mdxComponents` es un objeto plano `{ NombreDeTag: Componente }`. Sin ese prop, cualquier tag
capitalizado sin equivalente HTML nativo (`Image`, `Callout`, lo que sea) revienta en runtime con algo
como `ReferenceError: Image is not defined` — porque MDX compila JSX que espera esa referencia en
scope, y nunca la puso ahí nadie.

**Patrón usado en este proyecto**: un mapa único y compartido en vez de repetirlo por ruta.

```tsx
// lib/mdx-components.tsx
import { MdxImage } from "@/components/content/MdxImage";

export const mdxComponents = {
  Image: MdxImage,
};
```

Y las tres rutas de detalle (`portfolio/[slug]`, `editorial/[slug]`, `case-studies/[slug]`) importan
el mismo `mdxComponents` — un componente nuevo (ej. `Callout`) se registra una sola vez y queda
disponible para los tres tipos de contenido.

**Trampa real de este proyecto**: la instrucción era "agrégale el prop `components` a la
`<MDXRemote>` que ya existe". En vez de eso, se copió el snippet completo como una **línea nueva** al
final de las tres páginas, sin adaptarlo:

- En `portfolio/[slug]/page.tsx` compiló, pero el contenido se renderizaba **dos veces** — una dentro
  de `<article className="prose">` (sin `components`) y otra suelta al final (con `components`, pero
  sin los estilos de `prose`).
- En `editorial/[slug]/page.tsx` ni compiló: el snippet copiado decía `project.content`, pero en ese
  archivo la variable se llama `article`. `mdxComponents` tampoco estaba importado.
- En `case-studies/[slug]/page.tsx` tenía el mismo problema de import faltante, más un bug semántico
  extra: `project.content` ahí es el body del *proyecto relacionado*, no el del *case study* — habría
  mostrado el contenido equivocado si hubiera compilado.

**La lección**: copiar un snippet a varios archivos no es pegarlo tal cual — cada archivo tiene su
propia variable local para "el contenido actual" (`project`, `article`, `caseStudy`) y sus propios
imports. Adaptar eso es parte de aplicar el cambio, no un detalle opcional.

> **Pregunta de entrevista**: ¿por qué un tag JSX como `<Image>` dentro de contenido MDX remoto
> necesita registrarse explícitamente, si en un archivo `.tsx` normal `Image` funcionaría con solo
> importarlo?
> Porque el MDX de `next-mdx-remote` se compila desde un string que vive fuera del grafo de módulos de
> la app (viene de `fs`, no de un `import`). El compilador de MDX no tiene forma de resolver a qué
> componente se refiere `<Image>` a menos que se le pase explícitamente en el prop `components` — es
> el puente entre el string MDX y el árbol de React real.

---

## Dimensiones de imagen para `next/image` con archivos locales referenciados por string (`image-size`)

`next/image` necesita conocer el ancho y alto intrínsecos de la imagen para reservar espacio en el
layout (evitar layout shift) — eso es obligatorio, vía `width`/`height` o vía `fill`. Cuando la imagen
se importa de forma estática (`import cover from "./cover.png"`), Next lee esas dimensiones solo con
analizar el archivo en build time, sin que el desarrollador las escriba a mano.

**El caso distinto**: cuando el `src` es un string que apunta a `public/` (`"/images/portfolio/.../
foto.jpg"`) — que es justamente el caso de cualquier imagen que venga de front matter o de contenido
MDX, porque ahí el path es un dato, no un `import` — Next **no puede** inferir las dimensiones. Hay
que dárselas.

**Solución usada**: el paquete `image-size`, leyendo el archivo con `fs` en el servidor (posible
porque `next-mdx-remote/rsc` corre como Server Component):

```tsx
// components/content/MdxImage.tsx
import { readFileSync } from "fs";
import path from "path";
import { imageSize } from "image-size";

const filePath = path.join(process.cwd(), "public", src);
const { width, height } = imageSize(readFileSync(filePath));
```

Esto le evita al autor del contenido (Elías, escribiendo `.mdx` a mano) tener que abrir cada imagen y
copiar sus píxeles exactos al front matter o al JSX — el servidor lo calcula solo, en cada render.

> **Pregunta de entrevista**: ¿por qué `next/image` puede inferir automáticamente las dimensiones de
> una imagen importada (`import x from "./x.png"`) pero no de una referenciada por string desde
> `public/`?
> Porque un `import` de imagen pasa por el loader de Next en build time, que sí puede abrir el archivo
> y leer sus dimensiones como parte del proceso de bundling. Un string (`"/images/x.png"`) es solo un
> valor de dato en runtime — no hay ningún paso de build que lo intercepte para inspeccionar el
> archivo, así que hay que resolverlas explícitamente (leyendo el archivo, como con `image-size`) o
> usar `fill` con un contenedor de aspect-ratio fijo.

---

## Modelar contenido: campos de front matter sin ningún consumidor real

**El caso concreto**: `bait-world-cup.mdx` llegó a tener un campo `gallery` (array de `{src, alt,
caption}`) en el front matter. Pero ni `lib/portfolio.ts` lo declaraba en el tipo `Project`, ni
ninguna página lo leía — no existía ningún componente tipo carrusel que lo consumiera. Además, las
mismas dos imágenes de `gallery` estaban también puestas a mano como `<Image>` dentro del body MDX,
así que si algún día se hubiera construido ese carrusel, las fotos habrían aparecido **duplicadas** en
la página (una vez en el carrusel, otra vez inline en el texto).

**La regla práctica**: antes de agregar un campo nuevo a un front matter model, confirmar quién lo va
a leer — un `grep` rápido del nombre del campo contra `app/` y `lib/`. Si no aparece en ningún lado
fuera del propio `.mdx`, es data modelada pero sin efecto: no rompe nada, pero tampoco hace nada, y es
fácil olvidar que quedó ahí a medio implementar.

**La distinción real, una vez que sí hay implementación**, entre los tres tipos de imagen que puede
tener un mismo item de contenido:

- **`cover`** — una sola imagen representativa, consumida *fuera* de la página de detalle: cards de
  listado, banner hero de la propia página, potencialmente Open Graph.
- **Imágenes inline** (`<Image>` dentro del body MDX) — consumidas *dentro* del artículo, en la
  posición exacta donde el texto las referencia. Su cantidad varía libremente por artículo.
- **`gallery`** (si se llega a construir) — pensada para un carrusel separado del flujo narrativo. No
  debe repetir fotos que ya están puestas inline, porque ambas aparecen en la misma página.

> **Pregunta de entrevista**: ¿cómo detectarías que un campo de front matter quedó sin usar en el
> código?
> Buscando su nombre fuera del propio archivo de contenido — en los tipos de `lib/` (¿el campo está
> en la interfaz TypeScript?) y en los componentes de `app/` (¿algún JSX lo renderiza?). Si el único
> lugar donde aparece es el YAML del `.mdx`, es data sin consumidor: TypeScript no lo va a marcar como
> error porque el objeto parseado de `gray-matter` es un `any` hasta que se castea a un tipo — el
> campo de más simplemente se ignora en silencio.

---

## Organización de imágenes de contenido que crece — un árbol por slug, no dos árboles paralelos

Portfolio y editorial van a acumular imágenes con el tiempo: un cover por item, más un número variable
de imágenes inline por artículo/proyecto. Dos convenciones distintas se probaron en este proyecto:

```
❌ Por tipo primero (probado y descartado)
public/images/
  covers/{section}/{archivo}.png     ← covers agrupados por tipo
  contents/                          ← árbol paralelo, vacío, sin estructura clara

✅ Por slug (convención final)
public/images/{section}/{slug}/
  cover.png
  imagen-inline-descriptiva.jpg
```

**Por qué el segundo gana**: con un árbol por tipo, el cover y las imágenes inline de un mismo
artículo viven en dos lugares distintos del filesystem — hay que mantenerlos sincronizados a mano, y
borrar o mover un item de contenido implica tocar dos carpetas en vez de una. Con un árbol por slug,
todo lo visual de un item vive junto — coincide 1:1 con `content/{section}/{slug}.mdx`.

**El bug real que este cambio expuso** (dos veces, en dos archivos distintos): mover un archivo de
imagen en el filesystem sin actualizar la ruta que apunta a él desde el front matter. Pasó con
`nomina-upgrade.mdx` (`cover: /images/covers/nomina-upgrade.png` apuntando a un archivo que ya se
había movido a `covers/portfolio/`), y otra vez con `bait-world-cup.mdx` (front matter y `<Image>`
inline apuntando a `/images/projects/...`, una carpeta que nunca existió — el árbol real usa
`/images/portfolio/...`).

**Por qué se repite el mismo bug**: la carpeta de `public/` y el string de la ruta en el `.mdx` son
dos fuentes de verdad independientes que nada en el proyecto valida entre sí. `findProjectBySlug` /
`getProjectBySlug` fallan (o devuelven `null`) si el `.mdx` no existe, pero **nada revisa si la imagen
que el `.mdx` referencia existe de verdad en disco** — el 404 solo aparece al renderizar la página en
el navegador, no en build ni en el editor.

> **Pregunta de entrevista**: ¿cómo se detectaría en build time (no en runtime) que un `cover` de
> front matter apunta a un archivo que no existe?
> Un script o chequeo que recorra todo el contenido (`getAllProjects()`, `getAllArticles()`, etc.),
> tome cada campo tipo `cover`/imagen, y confirme con `fs.existsSync(path.join("public", src))` que el
> archivo existe — fallando el build si no. No existe ese chequeo todavía en este proyecto; es la
> extensión natural de la lección de esta sección, pendiente de implementar.

---

## Menú móvil, segunda iteración — solapamiento, cierre externo y foco

Continuación de "Navegación responsive — patrón con Tailwind y `useState`". Aquel patrón dejaba el
menú funcionando, pero con tres carencias que solo aparecen al usarlo de verdad en un móvil: el panel
empujaba el contenido, no se cerraba al tocar fuera, y el teclado no tenía salida.

### 1. `sticky` no saca del flujo

Al abrir el menú, todo el contenido de la página bajaba. El instinto es mirar el `z-index`, y es el
sitio equivocado: no había un problema de apilamiento, había un problema de layout.

`position: sticky` **no saca al elemento del flujo normal** — el `<header>` sigue ocupando su altura
real. Como el panel es hijo del header, al montarse hacía crecer el header, y el header empujaba todo
lo de abajo. El `z-50` no tenía nada que ordenar porque no había solape.

```
❌ El panel crece dentro del header y empuja la página
<header className="sticky top-0 z-50">
  <nav>…</nav>
  {isOpen && <div className="border-t …">…</div>}
</header>

✅ El panel se ancla bajo la barra, fuera del flujo
<header ref={headerRef} className="sticky top-0 z-50">
  <nav>…</nav>
  {isOpen && <div className="absolute top-full inset-x-0 bg-background border-b …">…</div>}
</header>
```

Tres detalles que acompañan al `absolute`:

- **`bg-background` pasa a ser obligatorio.** Dentro del flujo, el panel heredaba visualmente el fondo
  del header. Flotando encima del contenido, sin fondo propio se ve la página a través del menú.
- **`border-t` → `border-b`.** El header ya dibuja su borde inferior bajo la barra; manteniendo el
  `border-t` del panel salían dos líneas pegadas.
- **`relative` en el header sobra.** Se añadió por reflejo, pensando en el bloque contenedor del
  `absolute`. Pero `sticky` ya no es `static`, así que por sí solo establece ese bloque contenedor.
  Peor aún: `sticky` y `relative` son dos utilidades de `position` compitiendo, y cuál gana no lo
  decide el orden en el atributo `class` sino el orden en el CSS generado por Tailwind.

### 2. `pointerdown` vs `click` — el bug que parecía de `Link`

Para cerrar al pulsar fuera, el listener escucha `pointerdown` en `document`. Elegirlo sobre `click`
tiene dos motivos:

- Unifica ratón, táctil y lápiz en un solo evento.
- Evita la reentrada clásica: si escuchas `click`, el mismo clic que abrió el menú puede llegar al
  `document` justo después de que el efecto monte el listener, cerrándolo al instante.

**El bug que costó el rato**: los enlaces del panel dejaron de navegar. Solo cerraban el menú. La
causa era que el `ref` no estaba enganchado al `<header>`, así que `headerRef.current` era `null`,
`headerRef.current?.contains(...)` devolvía `undefined`, y `!undefined` es `true` — *todo* clic
contaba como "fuera", incluidos los del propio panel.

La secuencia exacta al pulsar un enlace:

```
1. pointerdown → el handler cierra el menú
2. React re-renderiza y el panel se desmonta
3. click nunca se emite — el <a> ya no existe
```

El navegador solo emite `click` si `pointerdown` y `pointerup` caen sobre el mismo elemento. Al
desaparecer el enlace entre medias, la navegación se evapora. El síntoma apunta a `Link` o al router,
y el fallo está en un `ref` sin montar.

**Lección de guardas**: el `?.` enmascaró el fallo. Guardando sobre una variable local, el mismo
olvido habría dado un síntoma mucho más legible ("el clic fuera no cierra") en vez de romper la
navegación:

```tsx
function handlePointerDown(event: PointerEvent) {
  const header = headerRef.current;
  if (header && !header.contains(event.target as Node)) {
    setIsOpen(false);
  }
}
```

**Por qué el ref va en el `<header>` y no en el panel**: si la zona "interior" fuese solo el panel, el
botón hamburguesa quedaría fuera. Al pulsarlo con el menú abierto se dispararían dos cosas — el
handler de fuera cierra, y acto seguido el `onClick` del botón vuelve a abrir. El toggle parece
muerto. Metiendo el botón dentro de la zona interior, el problema no existe. De regalo, cambiar de
tema con el `ThemeToggle` tampoco cierra el menú.

### 3. `as Node`, y por qué no `as HTMLElement`

`contains()` está declarado como `contains(other: Node | null): boolean`, pero `event.target` viene
tipado como `EventTarget | null` — el escalón de arriba, que incluye cosas fuera del DOM (`window`,
`WebSocket`, `AbortSignal`). De ahí la aserción, que es puramente de compilación y se borra al
transpilar.

```
EventTarget          ← lo que puede recibir eventos
 └─ Node             ← lo que está en el árbol del DOM
     └─ Element
         ├─ HTMLElement    (<div>, <a>, <button>…)
         └─ SVGElement     (<svg>, <path>…)
```

El detalle concreto de este componente: al pulsar el botón hamburguesa, el `target` real no es el
`<button>` sino el `<path>` del SVG que hay dentro, porque el evento se origina en el elemento más
profundo bajo el puntero y luego burbujea. Un `<path>` es `SVGPathElement`, que **no** es
`HTMLElement`. Escribir `as HTMLElement` sería mentirle al compilador: aquí no rompe nada porque solo
se usa en `contains`, pero habilita que alguien escriba luego `.dataset` y reviente en runtime.

**La regla**: aserta al tipo más estrecho que realmente necesitas, no al más cómodo.

### 4. Bloquear el scroll vs cerrar al hacer scroll

La reacción por defecto ante un menú abierto es bloquear el scroll del body con
`document.body.style.overflow = "hidden"`. Aquí se descartó, y el razonamiento importa más que la
línea de código.

Este panel **no es un overlay a pantalla completa**: es un desplegable anclado bajo la barra con
cuatro enlaces. Congelar la página entera por algo tan pequeño se siente roto. Para un dropdown, la
convención es cerrarlo al hacer scroll, no impedir el scroll.

Además, el bloqueo arrastra problemas propios:

- **iOS Safari ignora `overflow: hidden` en el body** en bastantes situaciones — y es justo la
  plataforma objetivo, porque el menú solo existe en móvil. El apaño es `position: fixed` guardando y
  restaurando el `scrollY`, con su propio riesgo de aterrizar en otro punto de la página.
- **Estado obsoleto al rotar el dispositivo.** Si se cruza el breakpoint `md` con el menú abierto, el
  botón y el panel desaparecen (`md:hidden`) pero `isOpen` sigue en `true`. Sin bloqueo eso es
  inocuo; con bloqueo, el body queda congelado sin ningún control visible para liberarlo, y la página
  está muerta hasta recargar.

Descartado el bloqueo, ese segundo problema se desvanece — no hizo falta el efecto con `matchMedia`
que se había planteado para rescatarlo.

**Sobre el cierre al scroll**: el `pointerdown` ya lo cubría *de rebote*, porque un scroll táctil
empieza con el dedo apoyándose sobre el contenido, fuera del header. Pero es incidental, no
intencionado, y deja tres huecos: el arrastre que empieza sobre el propio panel, la rueda del ratón
(que no emite `pointerdown` en ningún momento) y el scroll por teclado. Un listener explícito los
cierra:

```tsx
window.addEventListener("scroll", handleScroll, { passive: true, once: true });
```

`once: true` encaja bien: el handler solo necesita dispararse una vez y se retira solo, en vez de
quedarse vivo en un evento que se emite decenas de veces por segundo durante la inercia. El
`removeEventListener` de la limpieza sigue haciendo falta para el caso en que el menú se cierre por
otra vía y el scroll nunca llegue — llamarlo sobre un listener ya consumido es inofensivo.
`passive: true` porque el handler no llama a `preventDefault`.

### 5. La caja del ref no es su contenido

Primer intento del retorno de foco: `buttonRef && buttonRef.current?.focus()`. Ese guard no hace
nada, y entender por qué aclara qué es un ref.

`useRef` devuelve una **caja estable**: un objeto `{ current: ... }` que React crea una vez y conserva
entre renders. Esa caja siempre existe — es truthy desde el primer render y para siempre. Lo que
puede ser `null` es su contenido, `.current`, que arranca en `null` y solo se rellena cuando React
monta el elemento y le asigna el nodo del DOM.

```tsx
buttonRef &&                  // ❌ pregunta por algo que nunca es falso
buttonRef.current?.focus()    // ✅ el guard útil está en el contenido
```

Es la misma distinción que en `handlePointerDown`: ahí se hace `const header = headerRef.current` y
*luego* `header &&`. El guard va siempre sobre el contenido, nunca sobre la caja.

### 6. `focus()` fuera del `if` — trampa de foco

Al cerrar con `Escape`, el foco cae a `body` y el siguiente `Tab` reinicia el recorrido desde el
principio de la página. Devolverlo al disparador es lo correcto, pero la primera versión se escribió
sin llaves:

```tsx
❌ function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") setIsOpen(false);
  buttonRef.current?.focus()   // se ejecuta con CUALQUIER tecla
}

✅ function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    setIsOpen(false);
    buttonRef.current?.focus();
  }
}
```

Con la versión rota, el menú abierto atrapa el foco: pulsas `Tab` estando en el botón → el handler lo
devuelve al botón → el `Tab` por defecto avanza al primer enlace. Pulsas `Tab` otra vez → vuelta al
botón → otra vez al primer enlace. Rebotas entre el botón y "Portfolio" sin llegar nunca al resto.
Justo el escenario que el `focus()` pretendía mejorar, invertido.

El retorno de foco va **solo** en el handler de teclado, no en el de puntero: si el usuario cierra
pulsando en otro sitio, ya está interactuando ahí y robarle el foco sería peor.

### 7. `aria-expanded` con nombre estable

El botón tenía `aria-label={isOpen ? "Close menu" : "Open menu"}`. Cambiarlo a nombre fijo más estado
en el atributo:

```tsx
aria-label="Menu"
aria-expanded={isOpen}
```

Con `aria-expanded`, el estado ya lo anuncia el atributo. Cambiar además el nombre accesible hace que
el lector de pantalla comunique lo mismo dos veces con palabras distintas. La convención es nombre
estable + estado en ARIA.

**`aria-controls` no se añadió** a propósito: apuntaría a un `id` que no existe mientras el panel está
desmontado por el render condicional, y referenciar un `id` inexistente es markup inválido.
`aria-expanded` por sí solo está bien soportado.

> **Pregunta de entrevista**: un menú desplegable deja de navegar al pulsar sus enlaces — solo se
> cierra. ¿Por dónde se empieza?
> Por el orden de los eventos, no por el router. Si algo cierra el menú en `pointerdown` o
> `mousedown`, el elemento se desmonta antes de que llegue el `click`, y el navegador solo emite
> `click` cuando `pointerdown` y `pointerup` caen sobre el mismo elemento. La navegación nunca se
> dispara porque el `<a>` ya no existe. La pista que descarta al router: el cierre sí funciona, y
> funciona *demasiado* — se dispara también dentro del panel.

---

## Iconos como datos vs iconos como componentes — `lucide` y `morphicons`

Para animar la transición hamburguesa ↔ cierre se instaló `morphicons`, que interpola entre dos
iconos de trazo con física de muelles. El primer intento no compilaba, y la razón es una distinción
que atraviesa todo el ecosistema de iconos.

**`MorphIcon` no consume componentes, consume datos.** Necesita las coordenadas de los trazos para
poder interpolarlas; un componente React ya renderizado no se las da. Por eso el import va al paquete
`lucide` (datos, `IconNode`) y no a `lucide-react` (componentes):

```tsx
❌ import { Menu, X } from "lucide-react";   // componentes: no interpolables
✅ import { Menu, X } from "lucide";         // datos: IconNode
```

Los dos paquetes coexisten por diseño y ambos hacen tree-shaking, así que una app puede usar
`lucide-react` para iconos estáticos y `lucide` para los que morphean — manteniendo las versiones
alineadas para que dibujen igual.

```tsx
<MorphIcon icon={isOpen ? X : Menu} size={20} strokeWidth={1.75} spring="smooth" />
```

El estado vive fuera; la animación es un detalle de implementación que el componente recoge al
cambiar la prop. No hace falta `AnimatePresence`, ni `key`, ni declarar pares origen/destino.

Detalles que importaron al integrarlo:

- **Rejilla compartida.** Ambos extremos del morph deben vivir en el mismo sistema de coordenadas.
  Lucide, Tabler, Heroicons e Iconoir dibujan en 24×24, por eso los morphs entre librerías funcionan.
  Para un set en otra rejilla (Heroicons *solid* en 20, Carbon en 32) hay que re-encajarlo una vez con
  `fitIcon`. Los bindings asumen `viewBox="0 0 24 24"` y admiten sobreescribirlo por prop.
- **Accesibilidad por defecto.** Emite `aria-hidden` salvo que se le pase `label`. Como el `aria-label`
  ya está en el `<button>`, pasarle `label` duplicaría el anuncio.
- **`currentColor` y caps redondeados** salen de fábrica, igual que en `lucide-react`, así que el
  icono sigue heredando el color del tema sin tocar los tokens.
- **SSR limpio**: el servidor emite el SVG estático exacto y el runtime nace en la hidratación, sin
  parpadeo ni desplazamiento de layout.
- **Presets de muelle**: `smooth` (críticamente amortiguado, sin rebote), `snappy` (rápido, rebote
  sutil) y `bouncy` (juguetón). Aquí se eligió `smooth` por coherencia con la sobriedad del resto.
- **Movimiento reducido**: desde la 1.4.2 los morphs animan siempre por defecto
  (`reducedMotion="never"`), con el argumento de que son micro-transiciones comunicativas.
  `reducedMotion="user"` los degrada a cambio instantáneo mientras el ajuste del sistema esté activo.

> **Pregunta de entrevista**: ¿por qué una librería de morphing de iconos no puede aceptar un
> componente de `lucide-react`?
> Porque el morph necesita la geometría — los comandos del atributo `d` de cada trazo — para
> muestrearla, emparejar los puntos entre origen y destino e interpolarlos frame a frame. Un
> componente React devuelve un elemento ya construido; sus paths son un detalle interno que no expone
> como datos manipulables. De ahí que el ecosistema publique el mismo set en dos formatos: datos para
> quien necesita operar sobre la geometría, componentes para quien solo necesita pintarla.

---

## `metadataBase` — por qué las URLs OG salían a `localhost:3000`

Las etiquetas `og:image` y `twitter:image` **deben llevar una URL absoluta**: quien las consume es un
crawler en otra máquina (LinkedIn, WhatsApp, Slack), y una ruta relativa no significa nada fuera del
navegador que ya está en el sitio.

Next.js construye esa URL absoluta a partir de `metadataBase`. Si no se declara, usa
`http://localhost:3000` como base, y el resultado es que **en producción se publican tarjetas que
apuntan a la máquina de desarrollo**:

```html
<meta property="og:image" content="http://localhost:3000/editorial/mi-post/opengraph-image">
```

La solución es una sola línea en el layout raíz, apoyada en la fuente única de verdad del proyecto:

```tsx
// app/layout.tsx
import { SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // ...
}
```

Lo instructivo es la **forma del fallo**: en local todo funciona, porque `localhost:3000` es
justamente donde estás mirando. El bug solo existe para terceros, y el build lo avisa como mucho con
un warning fácil de pasar por alto. Es el mismo patrón que la `og:image` ausente: fallos que no rompen
la página, solo la representación de la página en otro sitio.

> **Pregunta de entrevista**: ¿por qué `metadataBase` va en el layout raíz y no en cada página?
> Porque la metadata en App Router se **fusiona** de la raíz hacia abajo, y `metadataBase` es
> exactamente el tipo de campo que se quiere heredar: el dominio es el mismo para todo el sitio.
> Declararlo por página sería repetir un dato que solo cambia si cambia el dominio entero. Es el
> contraste exacto con `openGraph`, que **sustituye** en vez de fusionar (ver la corrección de agosto
> de 2026 más arriba); saber qué campos se heredan y cuáles se pisan es la mitad de entender el
> sistema de metadata.

---

## `generateStaticParams` no es solo para `page.tsx`

Una ruta dinámica que genera imágenes también necesita saber, en build time, qué slugs existen. El
archivo `opengraph-image.tsx` acepta las mismas exportaciones de configuración que una página:

```tsx
// app/research/[slug]/opengraph-image.tsx
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return getAllResearch().map((work) => ({ slug: work.slug }))
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const work = getResearchBySlug(slug)
  // ...
}
```

Sin `generateStaticParams`, la imagen se generaría en el primer request de cada crawler en vez de en
el build. Con ella, la tabla de rutas del build lo confirma explícitamente:

```
├ ● /research/[slug]/opengraph-image
│ └ /research/imaginacion-como-salvacion/opengraph-image
```

Conviene mirar esa tabla después de cada build: el punto `●` marca lo prerrenderizado, y es la
confirmación más barata de que una convención de archivo se recogió como se esperaba.

> **Pregunta de entrevista**: `params` también es una Promise aquí. ¿Por qué, si esto no es una
> página?
> Porque no es una excepción de las páginas sino **la firma de cualquier segmento dinámico** en
> Next.js 16: páginas, layouts, route handlers y las convenciones de metadata (`opengraph-image`,
> `twitter-image`, `icon`). La coherencia es el punto; en cuanto se entiende que el segmento dinámico
> se resuelve de forma asíncrona, deja de haber casos particulares que memorizar.

---

## Los dos puntos sin comillas rompen el front matter (y con él, la colección)

Ocurrió dos veces en este proyecto, con dos autores distintos, en dos colecciones distintas. Es el
error de contenido más probable del sitio y merece su propia entrada.

```yaml
# ❌ Rompe el parseo: YAML lee "outcome" y luego no sabe qué hacer con el segundo ":"
outcome: Resultado: 30% menos tiempo de carga

# ✅
outcome: "Resultado: 30% menos tiempo de carga"
```

En YAML, `clave: valor` usa `: ` (dos puntos más espacio) como separador. Un segundo `: ` dentro del
valor hace que el parser intente leer un mapa anidado donde había una cadena, y lanza.

Lo que lo vuelve peligroso no es el error en sí, sino el **radio de impacto**: los loaders de
`lib/` leen el directorio entero para construir un listado, así que un archivo malformado no rompe su
propia página, rompe el listado, la home y todo lo que llame a ese loader. Un artículo tumba la
sección.

**Regla del proyecto**: entrecomillar cualquier valor de front matter que contenga `: `. Es gratis,
no cambia el valor parseado, y elimina la clase entera de fallos. Los sospechosos habituales son
`title`, `excerpt`, `summary`, `outcome` y `abstract`, es decir, precisamente los campos escritos en
prosa.

> **Pregunta de entrevista**: ¿cómo evitarías que este error llegue siquiera a un commit?
> Validando el front matter al leerlo en vez de asertarlo (ver la corrección sobre `as` en la sección
> de union types), y envolviendo la lectura de cada archivo de forma que el error nombre al culpable:
> un `try/catch` alrededor de `matter(raw)` que relance incluyendo la ruta. El mensaje de YAML por sí
> solo habla de líneas y columnas sin decir de qué archivo. Convertir "error de YAML en la línea 4" en
> "error de YAML en content/editorial/mi-post.mdx línea 4" es el arreglo más barato con más retorno.

---

## Modelar para el segundo caso: "una obra, N ediciones"

`/research` nació con una sola tesis, disponible en español y en inglés, y con una segunda tesis (la
del máster) prevista a futuro. La tentación era modelar lo que había: dos campos, `pdfEs` y `pdfEn`.

Se modeló en cambio la **relación**, no los ejemplares:

```ts
export type ResearchEdition = {
  lang: string;      // código ISO
  label: string;     // como se muestra: "Español", "English"
  file: string;      // ruta bajo /public
  pages: number;
  primary?: boolean; // el idioma en que se escribió
};

export function primaryEdition(work: Research): ResearchEdition {
  return work.editions.find((e) => e.primary) ?? work.editions[0];
}
```

Las tres consecuencias que justifican el rodeo:

1. **Añadir un idioma es una entrada de front matter, no un cambio de código.** Con `pdfEs`/`pdfEn`,
   un tercer idioma habría tocado el tipo, el loader, la página y el JSON-LD.
2. **La copia se adapta sola.** La página distingue entre una obra con una edición y otra con varias
   (`editions.length > 1`) y redacta distinto, sin que el `.mdx` configure nada.
3. **`primary` no es lo mismo que "el primero de la lista".** El fallback `?? work.editions[0]` deja
   que una obra monolingüe funcione sin declarar el campo, y que el orden de presentación (en este
   sitio, inglés primero, por audiencia) sea independiente de cuál es el original.

El JSON-LD sale del mismo modelo: un nodo `Thesis` con un `MediaObject` por edición, generado con un
`map` sobre el array. Un modelo que representa la relación se recorre; un par de campos fijos se
enumera a mano en cada consumidor.

> **Pregunta de entrevista**: ¿cuándo *no* generalizarías así? Suena a sobreingeniería para una sola
> tesis.
> El criterio no es "podría haber más algún día", que se cumple siempre y justifica cualquier
> abstracción. Aquí había dos cosas concretas: el segundo caso ya existía en el momento de escribir el
> código (la obra ya venía en dos idiomas, no era hipotético), y el tercero estaba comprometido con
> fecha. Generalizar con **una** instancia y ninguna a la vista es adivinar; hacerlo con dos
> instancias reales es reconocer un patrón que ya está ahí. La prueba honesta se hizo después:
> se añadió un `.mdx` de una obra ficticia con una sola edición y el listado y la página se
> comportaron bien sin tocar nada.

---

## Ampliar un tipo unión: por qué un slot nuevo rompió `MdxImage`

Al añadir el slot `documentCover` a `lib/image-slots.ts` se metió dentro de `imageSlots.body`, que es
donde vivían los slots existentes. El error de TypeScript apareció lejos, en `MdxImage`, y no
mencionaba `documentCover`.

La causa: los slots de `body` no son objetos cualesquiera, son los miembros de una unión que
`MdxImage` consume, y todos comparten un campo `maxWidthClass` que el componente usa para decidir el
ancho. `documentCover` no tiene ancho de cuerpo de texto (es una portada en una ficha lateral), así
que no lo declaraba, y al entrar en la unión la volvió heterogénea: `slot.maxWidthClass` dejó de estar
garantizado para todos los miembros.

La solución fue de modelado, no de tipos: `documentCover` se movió al **nivel superior** de
`imageSlots`, junto a los otros slots que no son de cuerpo. No pertenecía a esa unión.

```ts
export const imageSlots = {
  documentCover: {           // ← nivel superior: no es un slot de cuerpo de texto
    aspectClass: "aspect-17/22",
    sizes: "(min-width: 1024px) 220px, 150px",
    exportPx: { width: 660, height: 854 },
  },
  body: {                    // ← unión que MdxImage consume; todos con maxWidthClass
    // ...
  },
}
```

> **Pregunta de entrevista**: el error de TypeScript apareció en un archivo que no habías tocado.
> ¿Cómo se lee eso?
> Como una señal de que el cambio afectó a un **contrato**, no a una implementación. Cuando el error
> sale donde se *consume* un tipo y no donde se *define*, la pregunta correcta no es "¿cómo callo este
> error?" sino "¿el valor nuevo pertenece de verdad a este conjunto?". Aquí la respuesta era que no, y
> el compilador estaba describiendo un error de modelado con precisión: había metido una portada de
> documento en el conjunto de las imágenes de cuerpo de texto. Añadir `maxWidthClass: ""` para
> silenciarlo habría dejado el modelo mal y el error latente.

---

## Verificar contra un servidor viejo: el falso negativo más caro

Tres veces en una misma sesión de trabajo se llegó a una conclusión equivocada por el mismo motivo:
`curl` contra `localhost:3000` estaba respondiendo desde un proceso `next start` anterior, levantado
con un build previo. Los síntomas fueron un listado al que le "faltaba" una entrada que sí estaba en
el HTML construido, y una ruta que devolvía 404 aunque la tabla del build la declaraba
prerrenderizada.

Un `pkill -f "next start"` no siempre basta: el proceso que atiende el puerto puede llamarse
`next-server`, y el `pkill` retorna antes de que el puerto quede libre.

```bash
pkill -9 -f "next start"; pkill -9 -f "next-server"
sleep 2
lsof -ti:3000 | xargs -r kill -9      # el que de verdad tiene el puerto
```

La lección que trasciende a Next.js: **cuando una verificación contradice al artefacto construido,
sospechar de la verificación antes que del código**. El build es determinista y deja rastro en disco;
el servidor local es estado mutable. Contrastar directamente contra el artefacto sale más barato que
depurar una teoría equivocada:

```bash
grep -o 'og:image[^>]*' .next/server/app/research/mi-slug.html
```

Si el HTML construido contiene lo que se espera y la respuesta HTTP no, el problema está entre el
build y el navegador, no en el código. Hacer esa bifurcación primero habría evitado los tres desvíos.

> **Pregunta de entrevista**: ¿cómo distingues "mi código está mal" de "mi forma de comprobarlo está
> mal"?
> Buscando un punto de observación independiente del que ya usaste. Si la comprobación es una petición
> HTTP, mira el artefacto en disco; si es un test, ejecútalo con el caso invertido para confirmar que
> es capaz de fallar. Una verificación que nunca ha fallado no ha demostrado todavía que sirva para
> algo. El indicio más fuerte de que la culpa es del método, no del código, es la **incoherencia
> interna**: dos fuentes que deberían coincidir y no coinciden, como una tabla de build que anuncia una
> ruta que el servidor devuelve como 404. Un código roto suele fallar de forma consistente; un método
> roto produce contradicciones.

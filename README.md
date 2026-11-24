# 🎁 Amigo Invisible

Web para organizar sorteos de amigo invisible a distancia. El organizador escribe los nombres, hace el sorteo y manda **un único enlace** al grupo. Cada persona entra desde su móvil, toca su nombre y abre un regalo animado que le dice a quién le toca regalar.

- Cuando alguien entra en su nombre, **ese nombre queda bloqueado** para los demás.
- **Nadie puede ver lo que les ha tocado a los otros**, tampoco el organizador. Lo garantizan las reglas del servidor, no solo la página.
- No hace falta registrarse: funciona con un inicio de sesión anónimo e invisible.

**Web publicada:** <https://blux-myoui.github.io/amigo-invisible/>

**Tecnologías:** HTML, CSS y JavaScript sin frameworks ni compilación, más [Firebase](https://firebase.google.com) (Authentication anónima y Cloud Firestore). Se aloja en GitHub Pages.

---

## Índice

1. [Funcionalidades](#funcionalidades)
2. [Cómo se usa](#cómo-se-usa)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Arquitectura](#arquitectura)
5. [El código, archivo por archivo](#el-código-archivo-por-archivo)
6. [Flujos principales](#flujos-principales)
7. [Algoritmos](#algoritmos)
8. [Base de datos](#base-de-datos)
9. [Seguridad y reglas de Firestore](#seguridad-y-reglas-de-firestore)
10. [Diseño y animaciones](#diseño-y-animaciones)
11. [Trabajar en local](#trabajar-en-local)
12. [Publicar en GitHub Pages](#publicar-en-github-pages)
13. [Montar tu propia copia desde cero](#montar-tu-propia-copia-desde-cero)
14. [Guía rápida para editar](#guía-rápida-para-editar)
15. [Limitaciones conocidas](#limitaciones-conocidas)
16. [Solución de problemas](#solución-de-problemas)
17. [Historial del proyecto](#historial-del-proyecto)

---

## Funcionalidades

### Organizador
- Botón **Crear nuevo sorteo**.
- El formulario **solo pide los nombres**: de 3 a 60 personas y hasta 40 caracteres por nombre. Se pueden pegar varios separados por comas, punto y coma o saltos de línea, y avisa si un nombre está repetido (sin distinguir mayúsculas).
- Animación de "papelitos" mezclándose mientras se guarda el sorteo.
- Un **enlace nuevo por cada sorteo**, con botón para copiarlo.
- **Cada sorteo es independiente**: aunque se repitan los nombres, cada uno tiene su propio enlace, sus propios nombres cogidos y sus propios resultados. Los anteriores siguen existiendo hasta que se borren.
- **Tus sorteos**: lista de los sorteos creados desde ese navegador, con los botones *Copiar enlace*, *Abrir* y *Borrar*. Borrar pide confirmación.
- Panel de organizador dentro de cada sorteo, que solo ve quien lo creó:
  - Anillo de progreso y el texto *"Han entrado X de N"*, en directo.
  - Estado de cada persona: *Sin entrar* o *Ha entrado*.
  - **Liberar** un nombre, por si alguien entró por error o cambió de móvil.
  - **Borrar sorteo**.

### Participantes
- Pantalla **¿Quién eres?** con una tarjeta por persona. Cada una lleva una bola de Navidad con sus iniciales.
- Confirmación *"¿Eres X?"* antes de bloquear el nombre.
- **Regalo animado**: hay que tocarlo 3 veces. Echa chispas, brilla y se sacude cada vez más, hasta que sale volando la tapa.
- **Ruleta tipo tragaperras**: los nombres pasan acelerando, nunca sale el mismo dos veces seguidas y se planta **de golpe** en el resultado, con rayos de luz y confeti.
- Los nombres ya usados aparecen apagados con 🔒 *"Ya ha entrado"*. Se actualiza en directo, sin recargar.
- Desde el mismo móvil se puede volver a ver el resultado: la tarjeta propia aparece como *"★ Eres tú"*.

### General
- Estilo navideño moderno: aurora de colores, nieve con profundidad que se inclina con el ratón, guirnalda de luces, colinas nevadas, tarjetas de cristal y bordes de degradado que giran.
- Cuenta atrás *"Faltan X días para Navidad"* en la portada.
- Diseño adaptado a móvil, incluidos los notch con `safe-area-inset`.
- Respeta la opción del sistema *"reducir movimiento"*: quita las animaciones.

---

## Cómo se usa

### Organizador
1. Abre la web y pulsa **Crear nuevo sorteo**.
2. Escribe los nombres y pulsa Intro después de cada uno, o pega varios separados por comas.
3. Pulsa **Hacer el sorteo**.
4. Copia el enlace y mándalo al grupo (WhatsApp, email…).
5. Con **Abrir el sorteo** puedes seguir quién ha entrado. Si también participas, entra en tu nombre igual que los demás.

### Participantes
1. Abre el enlace del grupo.
2. Toca **tu** nombre y confirma **Sí, soy yo**.
3. Toca el regalo 3 veces y descubre a quién le regalas.
4. No se lo cuentes a nadie 🤫

---

## Estructura del proyecto

```
amigo-invisible/
├── index.html          Estructura de la página. Carga los estilos y js/app.js
├── css/
│   └── styles.css      Todo el diseño y las animaciones
├── js/
│   ├── config.js       Configuración de Firebase (firebaseConfig)
│   ├── app.js          Punto de entrada: arranque, navegación y pantallas
│   ├── firebase.js     Conexión con Firebase y operaciones con la base de datos
│   ├── effects.js      Luces, nieve, confeti, chispas, brillo con el ratón, ruleta, árbol y anillo
│   └── ui.js           Utilidades: crear elementos, cambiar de pantalla, avisos, colores, textos
├── firestore.rules     Reglas de seguridad de Firestore (se pegan en la consola de Firebase)
└── README.md           Este documento
```

`firestore.rules` **no hace falta en GitHub para que la web funcione**: las reglas viven en Firebase. Está en el repositorio como copia y documentación.

---

## Arquitectura

```
┌──────────────────────────────┐          ┌──────────────────────────────┐
│  GitHub Pages (estático)     │          │  Firebase (Google)           │
│  index.html                  │  HTTPS   │  · Authentication (Anónimo)  │
│  css/styles.css              │◄────────►│  · Cloud Firestore (datos)   │
│  js/*.js  (módulos ES)       │          │  · Reglas de seguridad       │
└──────────────────────────────┘          └──────────────────────────────┘
```

- **No hay servidor propio.** Toda la lógica corre en el navegador y la seguridad la ponen las **reglas de Firestore**, que se evalúan en los servidores de Google. Por eso el secreto no se puede saltar tocando el código de la página.
- **Autenticación anónima:** cada navegador recibe un identificador único (`uid`) sin pedir nada al usuario. Con él se sabe quién creó cada sorteo y quién ha cogido cada nombre.
- **SDK de Firebase 10.12.2**, cargado como módulos ES desde `https://www.gstatic.com/firebasejs/10.12.2/` con `import()` dinámico. No hay `npm` ni empaquetador.
- **Módulos ES nativos** (`<script type="module">`). Por eso la web **no funciona abriendo `index.html` con doble clic** (`file://`): el navegador bloquea los módulos locales. Hay que servirla por HTTP (ver [Trabajar en local](#trabajar-en-local)).
- **Sin framework:** las pantallas se construyen con un pequeño ayudante `el()` que crea elementos del DOM. Todo el texto se inserta con nodos de texto (nunca `innerHTML` con datos del usuario), así que los nombres no pueden inyectar HTML.

### Dependencias entre módulos

```
app.js ──► ui.js
   │  └──► effects.js ──► ui.js
   └─────► firebase.js ──► config.js
                     └───► ui.js   (solo usa shuffled)
```

### Rutas

La navegación usa la URL con `history.pushState` y el evento `popstate`, sin recargar la página.

| URL | Pantalla | Función |
|---|---|---|
| `/` | Portada y *Tus sorteos* | `screenHome()` |
| `/#crear` | Formulario de nuevo sorteo | `screenCreate()` |
| `/?s=ID_DEL_SORTEO` | *¿Quién eres?* de ese sorteo (el enlace que se comparte) | `screenDraw(id)` |

*¿Eres X?* (`screenConfirm`) y el regalo (`screenGift`) son pantallas internas de un sorteo y no cambian la URL.

---

## El código, archivo por archivo

### `index.html`
Solo la estructura fija:
- `.sky`: fondo de aurora con 3 manchas de color (`.blob`).
- `#snow`: el lienzo `<canvas>` de la nieve.
- `.hills`: SVG de las colinas nevadas.
- `#lights`: la lista de la guirnalda, que se rellena desde JS.
- `#confetti`: el lienzo del confeti.
- `#app`: el contenedor donde se pintan las pantallas.
- `#toast`: el aviso flotante.

Carga las fuentes de Google Fonts (Fraunces para títulos y Manrope para texto), `css/styles.css` y `js/app.js` como módulo.

### `js/config.js`
Exporta `firebaseConfig`. **Es el único archivo que hay que tocar para conectar la web a otro proyecto de Firebase.**

### `js/ui.js`: utilidades de interfaz

| Exporta | Qué hace |
|---|---|
| `reduced` | `true` si el sistema pide reducir movimiento. |
| `el(tag, attrs, ...hijos)` | Crea un elemento. `class`, `style` y `onclick`/`on*` tienen tratamiento especial; los valores `null`/`false` se ignoran. Los hijos pueden ser nodos, textos o arrays; `null`, `false` y `""` se ignoran. ⚠️ El número `0` **sí** se pinta, así que usa `x > 0 && …` y no `x.length && …`. |
| `show(...nodos)` | Sustituye la pantalla actual. Da a cada bloque un índice `--n` para que entren escalonados y sube el scroll arriba. |
| `toast(msg)` | Muestra un aviso abajo durante 2,6 s. |
| `copy(texto, msgOk)` | Copia al portapapeles. Si el navegador no deja, abre un `prompt` con el texto. |
| `sleep(ms)` | Espera. Con movimiento reducido no espera. |
| `colorFor(nombre)` | Color fijo de la paleta según el nombre (siempre el mismo para el mismo nombre). |
| `initials(nombre)` | Hasta 2 iniciales en mayúscula. |
| `shuffled(array)` | Copia barajada (Fisher–Yates). |
| `drawLink(id)` | Enlace completo del sorteo (`…?s=ID`). |
| `fmtDate(timestamp)` | Fecha corta en español. |
| `namesPreview(personas)` / `drawLabel(sorteo)` | Texto tipo *"Ana, Luis, Marta y 3 más"*. Si un sorteo antiguo tiene título, usa el título. |
| `christmasCountdown()` | *"Faltan X días para Navidad"*, *"Mañana es Navidad"* o *"¡Hoy es Navidad!"*. |

### `js/firebase.js`: datos
Es la única parte que habla con Firebase. El resto de la app no importa nada de Firebase directamente.

| Exporta | Qué hace |
|---|---|
| `uid` | `uid` anónimo del navegador. Es un *live binding*: vale `null` hasta que termina `initFirebase()`. |
| `isConfigured()` | Comprueba que `firebaseConfig` tiene datos. |
| `initFirebase()` | Carga el SDK, inicia la app, Firestore y el login anónimo. |
| `createDraw(personas)` | Crea el sorteo y todos sus resultados en **un único batch** (todo o nada). Devuelve el `id`. |
| `deleteDraw(id, n)` | Borra en un batch el sorteo, sus `claims` y sus `secrets`. Usa los índices `0…n-1`, así que no necesita leer los resultados, que el organizador no puede leer. |
| `listMyDraws()` | Sorteos cuyo `ownerUid` es el del navegador, del más nuevo al más viejo. |
| `getDraw(id)` | Datos públicos del sorteo, o `null` si no existe. |
| `watchClaims(id, cb)` | Escucha en directo los nombres cogidos (`onSnapshot`). Devuelve la función para dejar de escuchar. |
| `claim(id, clave)` | Coge un nombre dentro de una **transacción**: si dos personas pulsan a la vez, solo una lo consigue. |
| `freeClaim(id, clave)` | Libera un nombre (solo el organizador). |
| `readSecret(id, clave)` | Lee a quién le regala esa persona (solo quien cogió el nombre). |

### `js/effects.js`: efectos visuales

| Exporta | Qué hace |
|---|---|
| `startLights()` | Crea 60 bombillas en la guirnalda, cada una con un retraso de parpadeo aleatorio. |
| `startSnow()` | 90 copos en `<canvas>` con profundidad: los cercanos son más grandes, rápidos y opacos. El viento sigue la posición horizontal del ratón. |
| `confetti()` | 200 papelitos con gravedad durante 3,4 s. |
| `burst(elemento, n)` | Chispas en forma de estrella que salen del centro de un elemento (Web Animations API). |
| `startPointerFX()` | En dispositivos con ratón: el brillo que sigue al cursor (clase `.spot`) y la inclinación 3D (clase `.tilt`). |
| `spinReel(contenedor, nombres, ganador)` | La ruleta tipo tragaperras. Devuelve una promesa que se resuelve al acabar el giro. Ver [Algoritmos](#algoritmos). |
| `treeSvg()` | El árbol de la portada en SVG. |
| `progressRing(n, total)` | El anillo de progreso del organizador. |

### `js/app.js`: pantallas y navegación
1. Arranca los efectos y comprueba la configuración. Si falta, enseña *"Conecta la base de datos"*.
2. Conecta con Firebase. Si falla, enseña *"No se puede conectar"* con el código de error.
3. `route()` decide la pantalla según la URL. `go(url)` navega. `stopWatching()` cierra la escucha en directo del sorteo anterior.
4. Pantallas:
   - `screenHome()`: portada, cuenta atrás, 3 pasos y *Tus sorteos*.
   - `screenCreate()`: formulario. Las etiquetas de nombres se repintan sin rehacer la pantalla, para no perder el foco del campo.
   - `doCreate()`: anima los papelitos mientras guarda y luego enseña el enlace.
   - `screenDraw(id)`: *¿Quién eres?* y panel del organizador. Se repinta con cada cambio de `watchClaims`.
   - `screenConfirm(id, d, clave)`: *¿Eres X?*. Al confirmar llama a `claim()`.
   - `screenGift(id, d, clave)`: el regalo, la ruleta y el resultado.
   - `askDelete(...)`: confirmación de borrado dentro de la propia página. No usa `confirm()`.

### `css/styles.css`
Ver [Diseño y animaciones](#diseño-y-animaciones).

---

## Flujos principales

### Crear un sorteo
```
screenCreate ──"Hacer el sorteo"──► doCreate
   │ createDraw(personas)   → batch: draws/{id} + secrets/0..n-1
   │ (animación de papelitos en paralelo)
   └─► pantalla "Manda este enlace al grupo"
```

### Entrar como participante
```
?s=ID → screenDraw → toca su nombre → screenConfirm → "Sí, soy yo"
   │ claim(id, clave)        → transacción: crea claims/{clave} con su uid
   │                           (si ya existe → "Alguien ya ha entrado como X")
   └─► screenGift → readSecret(id, clave) → 3 toques → spinReel → resultado
```

### Volver a ver el resultado
Con el mismo navegador, la tarjeta propia sale como *"★ Eres tú"* y lleva directamente a `screenGift`.

### Liberar un nombre (organizador)
`freeClaim()` borra `claims/{clave}`. Quien lo tenía pierde el acceso a su resultado y otra persona puede cogerlo.

### Borrar un sorteo (organizador)
`deleteDraw()` borra en un solo batch el sorteo, sus nombres cogidos y sus resultados. Quien abra el enlace verá *"Sorteo no encontrado"*.

---

## Algoritmos

### El sorteo: un único círculo
En `makePairs(n)`, dentro de `firebase.js`:
1. Se barajan los índices de las personas con Fisher–Yates.
2. Cada persona le regala a la **siguiente** de la lista barajada, y la última a la primera.

Así se forma un único círculo, y queda garantizado que:
- **nadie se toca a sí mismo**;
- **cada persona regala a una y recibe de una**: nadie recibe dos regalos ni se queda sin regalo.

Comprobado con 100.000 sorteos simulados de 9 personas: 0 fallos.

### La ruleta: `spinReel()`
- **Tira de 5 filas** (`.reel-row`) dentro de una ventana de 3 filas de alto. Una posición continua `pos` avanza a velocidad `v` (nombres por segundo). La parte decimal mueve la tira con `translate3d` y la parte entera decide qué nombres se ven. Las filas lejos del centro se hacen más pequeñas y transparentes.
- **Aceleración**: `v` va de `V0 = 3` a `V1 = 17` nombres por segundo con una curva suave (*smoothstep* en escala exponencial). Llega al máximo al 75 % del tiempo (`DURATION = 2800` ms) y se mantiene. A 17 nombres por segundo, cada uno dura unos 60 ms (casi 4 fotogramas), así que **siempre se ve cómo cambian**.
- **Sin repeticiones seguidas**: los nombres salen por rondas barajadas, con todos los nombres una vez por ronda. Si el primero de una ronda coincide con el último de la anterior, se manda al final de la ronda. Comprobado con 10.000 ruletas: 0 repeticiones.
- **Final instantáneo**: cuando se acaba el tiempo se resuelve la promesa y `screenGift` sustituye la ruleta por el nombre ganador (`.name.land`) de golpe, sin frenar, con rayos, chispas y confeti.
- La ruleta solo muestra los **otros** nombres (nunca el tuyo).

---

## Base de datos

```
draws/{drawId}                     ← un documento por sorteo
  people:     ["Ana", "Luis", "Marta", ...]
  keys:       ["0", "1", "2", ...]          ← índice de cada persona (las reglas lo usan)
  ownerUid:   "<uid del organizador>"
  createdAt:  <fecha del servidor>
  (title, budget, date)                     ← solo en sorteos antiguos; la web los sigue mostrando

draws/{drawId}/claims/{índice}     ← nombre ya cogido
  uid:  "<uid de quien entró>"
  at:   <fecha del servidor>

draws/{drawId}/secrets/{índice}    ← a quién le regala esa persona
  receiver: "Marta"
```

- `drawId` es un identificador aleatorio de 20 caracteres generado por Firestore, imposible de adivinar.
- Los nombres se guardan tal cual en `people`; las subcolecciones usan el **índice** (`"0"`, `"1"`…) como identificador.

---

## Seguridad y reglas de Firestore

Las reglas están en `firestore.rules` y se publican en **Firebase → Firestore → Reglas**.

| Acción | Quién puede |
|---|---|
| Ver un sorteo (nombres) | Cualquiera con el enlace (con sesión anónima) |
| Listar sorteos | Solo el organizador, y solo los suyos |
| Crear un sorteo | Cualquiera, siempre a su propio nombre y con 3 a 60 personas |
| Modificar un sorteo | Nadie |
| Borrar un sorteo | Solo el organizador |
| Coger un nombre | Cualquiera, **solo si nadie lo ha cogido antes**, solo para sí mismo y solo si el nombre existe en el sorteo |
| Ver qué nombres están cogidos | Cualquiera con el enlace |
| Liberar un nombre | Solo el organizador |
| **Ver a quién le regala una persona** | **Solo quien ha cogido ese nombre** |
| Crear los resultados | Solo el organizador, y solo en el mismo batch que crea el sorteo |
| Modificar los resultados | Nadie |
| Borrar los resultados | Solo el organizador |

Detalles que conviene saber si se tocan las reglas:
- Los resultados solo se pueden crear si el sorteo **todavía no existía** (`!exists(...)`) y **sí existirá** al terminar el batch, a nombre de quien escribe (`getAfter(...)`). Por eso nadie puede añadir o cambiar resultados después.
- Al borrar, `get()` lee el estado **anterior** al batch, así que en una sola operación se pueden borrar el sorteo y sus subcolecciones.
- Si cambias las reglas, **hay que publicarlas en la consola de Firebase**; cambiar el archivo del repositorio no basta.

> **Sobre la `apiKey` de `js/config.js`**: es normal que sea pública. La configuración web de Firebase es pública por diseño; lo que protege los datos son las reglas.

> **Lo que no se puede evitar**: el organizador crea el sorteo desde su navegador, así que alguien con conocimientos técnicos podría ver los resultados justo en ese momento. Si el organizador participa y se quiere máxima confianza, puede crear el sorteo otra persona.

---

## Diseño y animaciones

### Variables (`:root` en `styles.css`)

| Variable | Uso |
|---|---|
| `--bg`, `--bg2` | Fondo verde noche |
| `--fg`, `--muted` | Texto principal (crema) y secundario |
| `--line`, `--glass`, `--glass2` | Bordes y fondos de cristal |
| `--red`, `--red2` | Botón principal y regalo |
| `--gold`, `--gold2` | Acentos dorados, títulos y ruleta |
| `--green` | Estados "ha entrado" |
| `--display`, `--body` | Fuentes: Fraunces (títulos) y Manrope (texto) |
| `--ease-out`, `--ease-spring` | Curvas de animación comunes |

Los colores de las bolas de las personas están en `PALETTE`, dentro de `js/ui.js`.

### Componentes (clases CSS)

| Clase | Qué es |
|---|---|
| `.card` | Tarjeta de cristal con desenfoque de fondo |
| `.card.glow` | Tarjeta con borde de degradado que gira (`@property --ang`) |
| `.spot` | Brillo que sigue al ratón (lo controla `startPointerFX`) |
| `.tilt` | Inclinación 3D con el ratón |
| `.primary`, `.ghost`, `.danger`, `.big`, `.sm`, `.shine` | Botones: principal, secundario, peligro, grande, pequeño y destello automático |
| `.hero`, `.eyebrow`, `.badge`, `.steps` | Cabeceras, antetítulo con ✦, cuenta atrás y los 3 pasos |
| `.chips` | Etiquetas de nombres en *Crear* |
| `.people`, `.person`, `.avatar` | Tarjetas de *¿Quién eres?* con la bola de Navidad |
| `.list`, `.status`, `.ring` | Listas, estados y anillo de progreso |
| `.stage`, `.gift`, `.taps` | Escenario del regalo, el regalo y los 3 puntos |
| `.reel`, `.reel-row`, `.reel-frame`, `.name.land` | Ruleta y nombre final |
| `.lights`, `.sky`, `.hills` | Decoración de fondo |

### Animaciones principales (`@keyframes`)
- `rise`: entrada de bloques (suben, aparecen y se enfocan), escalonada con `--n`.
- `popin` y `chipin` / `chipout`: tarjetas de personas y etiquetas.
- `shake`, `lidoff`, `squash`, `bob`, `pulse`: el regalo.
- `land`: el nombre ganador.
- `angle`: el borde que gira. `shimmer`: el brillo de los títulos. `shine`: el destello de los botones.
- `twinkle`, `starpulse`, `float`, `drift`, `ping`: luces, estrella, árbol, aurora y cuenta atrás.

Con *reducir movimiento* activado, una regla al final del CSS deja todas las animaciones casi a 0, y los efectos de JS (nieve, confeti, chispas, ruleta) no se ejecutan.

---

## Trabajar en local

La web usa módulos ES, así que hay que servirla por HTTP. Desde la carpeta del proyecto:

```bash
python -m http.server 8765
```

y abre <http://localhost:8765>. Si cambias un archivo, recarga con **Ctrl + Shift + R**.

> ⚠️ En local se usa la **misma base de datos real** de Firebase. Los sorteos que crees en local son de verdad; bórralos al acabar de probar.

`localhost` ya está autorizado por defecto en Firebase Authentication.

---

## Publicar en GitHub Pages

1. En el repositorio: **Add file → Upload files**.
2. Arrastra `index.html` **y las carpetas `css` y `js` enteras** (en Chrome se pueden arrastrar carpetas).
3. **Commit changes**.
4. Espera 1–2 minutos y recarga con **Ctrl + Shift + R**.

GitHub Pages deja guardada cada página hasta **10 minutos** (`Cache-Control: max-age=600`), así que una recarga normal puede enseñar la versión anterior durante ese tiempo.

Configuración de Pages: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)`**.

---

## Montar tu propia copia desde cero

### 1. Firebase
1. Entra en <https://console.firebase.google.com> y **crea un proyecto**. Google Analytics no hace falta; el plan gratuito *Spark* basta.
2. **Authentication → Comenzar → Método de acceso → Anónimo → Habilitar → Guardar.**
3. **Firestore Database → Crear base de datos.**
   - ID: `(default)`.
   - Ubicación: una de Europa, por ejemplo `europe-southwest1` (Madrid). No se puede cambiar después.
   - Modo: **producción**.
   - Si el desplegable de ubicación no se abre, créala desde <https://console.cloud.google.com/firestore> con el mismo proyecto seleccionado.
4. En Firestore, pestaña **Reglas**: borra lo que haya, pega `firestore.rules` y pulsa **Publicar**.
5. **⚙️ Configuración del proyecto → General → Tus apps → `</>` (Web)**: registra una app web, sin Hosting, y copia el bloque `firebaseConfig`.

### 2. Configurar la web
Pega esos valores en `js/config.js`:

```js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

Si se deja vacío, la página muestra *"Conecta la base de datos"*.

### 3. GitHub Pages
1. Crea un repositorio **público** (por ejemplo `amigo-invisible`).
2. Sube `index.html` y las carpetas `css` y `js` (y si quieres `firestore.rules` y este `README.md`).
3. **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)` → Save.**
4. En 1 o 2 minutos estará en `https://TU-USUARIO.github.io/amigo-invisible/`. Si usas un dominio propio, añádelo en **Firebase → Authentication → Configuración → Dominios autorizados**.

---

## Guía rápida para editar

| Quiero cambiar… | Dónde |
|---|---|
| Colores generales | Variables de `:root` en `css/styles.css` |
| Colores de las bolas de las personas | `PALETTE` en `js/ui.js` |
| Fuentes | Enlace de Google Fonts en `index.html` y `--display` / `--body` en el CSS |
| Textos de las pantallas | Funciones `screen…` en `js/app.js` |
| Mínimo o máximo de personas | `js/app.js` (`screenCreate`: `>= 3`, `>= 60`) **y** `firestore.rules` (`size() >= 3`, `<= 60`). Hay que cambiar los dos y volver a publicar las reglas. |
| Largo máximo de un nombre | `.slice(0, 40)` en `screenCreate` |
| Duración o velocidad de la ruleta | `DURATION`, `V0` y `V1` en `spinReel()` (`js/effects.js`). No subas `V1` mucho de 17 o los nombres dejarán de distinguirse. |
| Toques para abrir el regalo | `taps` en `screenGift()` (`js/app.js`), y los 3 `<i>` de `.taps` |
| Cantidad de nieve, confeti o luces | `startSnow()` (90), `confetti()` (200) y `startLights()` (60) en `js/effects.js` |
| Reglas de seguridad | `firestore.rules`, y luego **publicarlas en la consola de Firebase** |

Convenciones del código:
- Crea los elementos con `el()`. No uses `innerHTML` con datos que escriba el usuario.
- Cualquier acceso a Firebase va en `js/firebase.js`.
- Si una pantalla escucha datos en directo, guarda la función de cancelar en `unsub` y llama a `stopWatching()` al salir.

---

## Limitaciones conocidas

- **Cada nombre queda unido al móvil y navegador** donde se abrió. Si alguien cambia de móvil, usa otro navegador o borra los datos del navegador, no podrá volver a ver su resultado. Solución: el organizador pulsa **Liberar** y la persona vuelve a entrar.
- **"Tus sorteos" depende del navegador.** El organizador debe gestionar sus sorteos desde el mismo navegador. Si lo pierde, los participantes pueden seguir usando el enlace, pero nadie podrá liberar nombres ni borrar el sorteo.
- **Una misma persona puede coger varios nombres** desde su navegador y ver varios resultados. Las reglas no lo impiden todavía. La pantalla *"¿Eres X?"* ayuda a evitar errores, pero no a alguien que quiera cotillear.
- **Si alguien entra en un nombre que no es el suyo**, ya habrá visto ese resultado. El organizador puede liberar el nombre, pero el secreto ya se ha descubierto.
- No hay exclusiones (por ejemplo, que las parejas no se toquen entre sí).
- Los sorteos no se pueden editar una vez creados. Si hay un error en los nombres, se crea otro y se borra el anterior con **Borrar**.
- **No funciona abriendo `index.html` con doble clic**; hay que servirlo por HTTP.
- El plan gratuito de Firebase permite unas 50.000 lecturas y 20.000 escrituras al día, mucho más de lo que necesita un amigo invisible.

---

## Solución de problemas

| Lo que pasa | Causa probable | Solución |
|---|---|---|
| Se queda cargando al abrir `index.html` con doble clic | El navegador bloquea los módulos en `file://` | Ábrela desde GitHub Pages o con `python -m http.server` |
| Tras subir cambios sigue saliendo la versión vieja | Caché de GitHub Pages y del navegador (hasta 10 min) | **Ctrl + Shift + R**, una pestaña de incógnito o esperar unos minutos |
| *"Conecta la base de datos"* | `firebaseConfig` vacío | Pega la configuración en `js/config.js` |
| *"No se puede conectar"* con `auth/operation-not-allowed` o `auth/admin-restricted-operation` | El inicio de sesión anónimo no está activado | Authentication → Método de acceso → Anónimo → Habilitar |
| *"No se ha podido guardar el sorteo"* con `permission-denied` | Faltan las reglas o están mal pegadas | Vuelve a pegar `firestore.rules` y pulsa Publicar |
| *"Sin permiso para borrar"* | Las reglas publicadas son antiguas | Publica el `firestore.rules` actual |
| *"Sorteo no encontrado"* | Enlace cortado, o el sorteo se borró | Copia el enlace del sorteo actual desde *Tus sorteos* |
| Los nombres salen como *"Ya ha entrado"* en un sorteo recién creado | Se está abriendo el enlace de un sorteo anterior | Usa el enlace nuevo; cada sorteo tiene el suyo (`?s=…`). Borra los viejos con **Borrar** para evitar líos. |
| *"No se puede abrir tu regalo"* | El nombre se cogió en otro móvil o navegador | El organizador pulsa **Liberar** |
| El desplegable de ubicación de Firestore no se abre | Fallo de carga de la consola | Recarga, desactiva el bloqueador de anuncios o créala desde Google Cloud Console |

---

## Historial del proyecto

1. **Versión 1: enlaces individuales (Claude Artifact).** La página generaba un enlace distinto para cada persona, con el resultado codificado dentro. Sin base de datos.
2. **Versión 2: enlace único y animaciones (Claude Artifact).** Llegaron la pantalla *¿Quién eres?*, el regalo, la ruleta, el confeti y la nieve. Problemas: la página era privada por defecto y cualquiera podía tocar el nombre de otro y ver su resultado.
3. **Versión 3: archivo HTML independiente.** Se exportó con un sorteo fijo de 8 personas para alojarlo fuera de claude.ai, en GitHub Pages.
4. **Versión 4: GitHub Pages + Firebase.** Sorteos ilimitados, un enlace por sorteo, **bloqueo real de nombres** y **resultados protegidos por el servidor**. Probada con los emuladores de Firebase.
5. **Versión 5 (actual): rediseño navideño y código separado.**
   - El código se separó en `index.html`, `css/` y `js/`, en módulos.
   - Formulario de crear solo con nombres.
   - Borrar sorteos.
   - Ruleta nueva tipo tragaperras: acelera, sin nombres repetidos seguidos y con final instantáneo.
   - Diseño navideño moderno: aurora, luces, nieve con profundidad, tarjetas de cristal, bordes animados, chispas y anillo de progreso.

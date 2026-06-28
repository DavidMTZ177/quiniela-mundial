# ⚽ Quiniela Mundial 2026 — Fase Eliminatoria

App de quiniela multijugador para la fase eliminatoria del Mundial 2026.
Marcador exacto = **3 pts**, atinarle al resultado (gana/empata) = **1 pt**.

🔗 **En vivo:** https://davidmtz177.github.io/quiniela-mundial/

## Cómo funciona
- Cada jugador entra con **su nombre + contraseña** (la 1ª vez se registra).
- Llena los marcadores de la fase abierta y le da **Enviar**. Al enviar, esa fase **se bloquea** y ya no puede cambiarla.
- El **admin** (tú) entra con la contraseña de admin para: capturar resultados reales, abrir las siguientes fases (octavos, cuartos…) y ver lo de todos.
- La pestaña **Posiciones** muestra la tabla en vivo con 1°/2°/3°.

## Modo demo vs multijugador
- **Sin Supabase** (config.js vacío): MODO DEMO, los datos viven solo en tu navegador. Sirve para probar la interfaz tú solo.
- **Con Supabase**: multijugador real, todos comparten datos y tabla.

## Conectar Supabase (5 min, una sola vez)
1. Crea una cuenta gratis en **https://supabase.com** y un proyecto nuevo.
2. En el proyecto: **SQL Editor → New query**, pega el contenido de [`supabase_setup.sql`](supabase_setup.sql) y dale **Run**.
3. Ve a **Project Settings → API** y copia:
   - **Project URL**
   - **anon public key**
4. Pégalas en [`config.js`](config.js) y haz commit. Listo.

## Admin
- Contraseña de admin en `config.js` (`adminPassword`). Cámbiala.
- Desde la pestaña **Admin** abres fases, capturas resultados y editas equipos (en octavos+ reemplazas "Ganador 73" por el equipo real).

## Archivos
- `index.html` — la app completa (UI + lógica).
- `config.js` — configuración (admin password + claves Supabase).
- `supabase_setup.sql` — crea las tablas en Supabase.

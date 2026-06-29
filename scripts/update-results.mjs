/* =====================================================================
   Robot que actualiza resultados de la quiniela automáticamente.
   - Lee fixtures.json (partidos id + equipos + fecha)
   - Consulta la API de ESPN los partidos terminados
   - Escribe los marcadores en la tabla `estado` de Supabase
   Corre desde GitHub Actions (cron). No requiere dependencias externas.
   ===================================================================== */
import fs from 'node:fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY'); process.exit(1); }

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=';

// ESPN (inglés) -> nuestro nombre (español, como en fixtures.json)
const MAP = {
  'South Africa':'Sudafrica','Canada':'Canada','Brazil':'Brasil','Japan':'Japon',
  'Germany':'Alemania','Paraguay':'Paraguay','Netherlands':'Paises Bajos','Morocco':'Marruecos',
  'Ivory Coast':'Costa de Marfil',"Cote d'Ivoire":'Costa de Marfil','Norway':'Noruega',
  'France':'Francia','Sweden':'Suecia','Mexico':'Mexico','Ecuador':'Ecuador',
  'England':'Inglaterra','Congo DR':'RD Congo','DR Congo':'RD Congo','Belgium':'Belgica',
  'Senegal':'Senegal','United States':'Estados Unidos','USA':'Estados Unidos',
  'Bosnia & Herzegovina':'Bosnia','Bosnia and Herzegovina':'Bosnia','Bosnia-Herzegovina':'Bosnia',
  'Spain':'Espana','Austria':'Austria','Portugal':'Portugal','Croatia':'Croacia',
  'Switzerland':'Suiza','Algeria':'Argelia','Australia':'Australia','Egypt':'Egipto',
  'Argentina':'Argentina','Cape Verde':'Cabo Verde','Cabo Verde':'Cabo Verde',
  'Colombia':'Colombia','Ghana':'Ghana'
};
const tr = n => MAP[n] || n;

const fixtures = JSON.parse(fs.readFileSync(new URL('../fixtures.json', import.meta.url))).matches;
const dates = [...new Set(fixtures.map(f => f.date.replaceAll('-','')))];

function findFixture(homeEs, awayEs){
  return fixtures.find(f =>
    (f.home===homeEs && f.away===awayEs) || (f.home===awayEs && f.away===homeEs));
}

const results = {};
for (const d of dates){
  let data;
  try { const r = await fetch(ESPN + d); data = await r.json(); } catch(e){ console.error('fetch', d, e.message); continue; }
  for (const e of (data.events || [])){
    const st = e.status?.type || {};
    if (!st.completed) continue;                       // solo terminados
    const comp = e.competitions[0];
    const H = comp.competitors.find(x => x.homeAway==='home');
    const A = comp.competitors.find(x => x.homeAway==='away');
    const hEs = tr(H.team.displayName), aEs = tr(A.team.displayName);
    const hS = parseInt(H.score), aS = parseInt(A.score);
    if (Number.isNaN(hS) || Number.isNaN(aS)) continue;
    const fx = findFixture(hEs, aEs);
    if (!fx){ console.log('sin fixture:', H.team.displayName, 'vs', A.team.displayName); continue; }
    // orientar al home/away de NUESTRO fixture
    if (fx.home === hEs) results[fx.id] = { l:hS, v:aS };
    else                 results[fx.id] = { l:aS, v:hS };
    console.log('OK', fx.id, fx.home, results[fx.id].l + '-' + results[fx.id].v, fx.away);
  }
}

if (Object.keys(results).length === 0){ console.log('No hay partidos terminados nuevos.'); process.exit(0); }

// Leer estado actual y mezclar
const headers = { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY, 'Content-Type':'application/json' };
const cur = await (await fetch(`${SUPABASE_URL}/rest/v1/estado?id=eq.1&select=data`, { headers })).json();
const estado = (cur[0] && cur[0].data) || { results:{}, open:{}, teams:{} };
estado.results = Object.assign({}, estado.results || {}, results);

const up = await fetch(`${SUPABASE_URL}/rest/v1/estado?id=eq.1`, {
  method:'PATCH', headers: { ...headers, Prefer:'return=representation' },
  body: JSON.stringify({ data: estado })
});
if (!up.ok){ console.error('Error al guardar:', up.status, await up.text()); process.exit(1); }
console.log('Guardados', Object.keys(results).length, 'resultados. Total en estado:', Object.keys(estado.results).length);

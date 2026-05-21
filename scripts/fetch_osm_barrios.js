/**
 * fetch_osm_barrios.js
 *
 * Consulta Overpass API para obtener barrios de Soledad mapeados en OSM,
 * los cruza con tu lista de 204, y genera un SQL con coordenadas refinadas.
 *
 * Uso:
 *   node fetch_osm_barrios.js
 *
 * Salidas:
 *   - osm_barrios.json       (lista cruda de barrios encontrados en OSM)
 *   - coordenadas_osm_v3.sql (UPDATEs solo para los que matchean)
 *   - reporte_matches.txt    (qué matcheó y qué no, para diagnóstico)
 */

const fs = require('fs');

// ============================================================================
// CONFIG
// ============================================================================

// Bounding box de Soledad, Atlántico
const BBOX = {
  south: 10.870,
  west:  -74.810,
  north: 10.945,
  east:  -74.735,
};

// Tus 204 barrios actuales (los que generamos del OCR)
// Solo necesito el nombre para hacer match — el ID en BD se resuelve por UPPER(nombre)
const BARRIOS_BD = [
  'Antonio Nariño','Normandia','Bella Murillo','Costa De Oro','El Encanto',
  'El Exito','Elparque','La Alianza','La Arboleda','La Farruca','La Ilusion',
  'La Inmaculada','La Puerta De Oro','Las Colonias','Las Colonias Ii',
  'Las Gaviotas','Las Gaviotas Ii','Las Nubes','Las Trinitarias','Los Balkanes',
  'Los Fundadores','Los Rosales','Muvdi','Normandia Norte','Nueva Jerusalen',
  'Nuevo Milenio','Portal De Las Moras','Rios De Agua Viva','Tajamar','Tajamar Ii',
  'Terminal','Urb Parque Muvdi','Urb. Las Moras','Villa Cecilia','Villa De Aragon',
  'Villa Del Carmen','Villa Estefany','Villa Katanga','Villa Katanga Ii',
  'Villa Las Moras I','Villa Linda I','Villa Lozano','Villa Merly','Villa Monaco',
  'Villa Muvdi','Villa Rosa','Villa Severa','Villa Soledad','Villa Viola',
  'Villa Zambrano','Altos De La Villa','Altos De Los Almendros','Altos De Los Robles',
  'Altos De Sevilla','Ciudad Trasnmetro','Conj Res Los Robles','Cuchilla De Los Angeles',
  'El Manantial','Jardin De Villa Estadio','Los Almendros','Los Almendros Ii',
  'Los Almendros Iii','Los Almendros Iv','Los Campanos','Los Cedros','Los Cerezos',
  'Los Robles','Los Robles Iv','Los Robles Ix','Los Robles Viii','Los Robles X',
  'Maria De Los Angeles','Moras Iv Etapa','Moras Norte','Moras Occidente',
  'Nuevo Horizonte','Nuevo Horizonte Ii','Portal De Los Manantiales','Portal De Los Nogales',
  'Reserva De Los Almendros','Terranova','Transmetro','Villa Angelita',
  'Villa Campanos Ii','Villa Estadio','Villa Estadio Ii','Villa Estadio Norte',
  'Villa Las Moras Ii','Villa Sevilla','12 De Octubre','16 De Junio','20 De Julio',
  '7 De Agosto','Centro','Cachimbero','Calle De Las Flores','Costa Hermosa',
  'Cruz De Mayo','El Cabrera','El Carnero','El Centenario','El Cortijo',
  'El Ferrocarril','El Hipodromo','El Oriental','El Pasito','El Porvenir',
  'El Rio','El Triunfo','El Tucan','Juan D Romero','La Esperanza','La Floresta I',
  'La Floresta Plan Ii','La Loma','La Maria','La Rivera','La Victoria','Las Ferias',
  'Las Margaritas','Los Arayanes','Los Mangos','Nuevo Triunfo','Primero De Mayo',
  'Pumarejo','Rigoberta Menchu','Salamanca','Salcedo','San Antonio','Santana',
  'Sitio Hermoso','Soluciones Minimas','Urb. Salamanca','Urb. Sol Real','Villa Salamar',
  'Villa Sofia','Vista Hermosa','Zona Industrial','23 De Noviembre','Aeropuerto',
  'Altos De Jesus','Bella Jerusalen','Ciudad Bolivar','Ciudad Del Parque',
  'Ciudad Paraiso','Ciudadela Metropolitana','Doña Manuela','El Esfuerzo','El Oasis',
  'El Recuerdo','Granabastos','La Bonanza','La Candelaria','La Fe','Linda Maria',
  'Linda Maria Ii','Manuela Beltran','Martha Gisella','Montecarmelo','Portal De S Antonio',
  'Prado De Soledad','Prado Soledad Iii','Renacer','San Juan Eudes','San Vicente',
  'Soledad Dos Mil','Villa Adela I','Villa Adela Ii','Villa Anita','Villa Del Rey',
  'Villa Esther','Villa Gladis','Villa Maria','Villa Monika','Villa Sol',
  'Viñas Del Rey','Zarabanda','Altos De La Metropolitana','Bello Horizonte',
  'Ciudad Bonita','Ciudad Camelot','Ciudad Caribe','Ciudad Caribe Iv','Ciudad Fallace',
  'Ciudad Salitre','Don Bosco','La Central','La Candelaria I','La Candelaria Ii',
  'Las Cometas','Los Cusules','Los Loteros','Nueva Esperanza','Portal De Jordan',
  'San Bernardo','Si Nos Dejan','Terranova Ii','Villa Carmen I','Villa Carmen Ii',
  'Villa Karla I','Villa Maria Silena','Villa Murillo','Villa Santa','Villa Valentina'
];

// ============================================================================
// HELPERS
// ============================================================================

function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // quita acentos
    .replace(/[^a-z0-9\s]/g, ' ')      // quita puntuación
    .replace(/\s+/g, ' ')              // colapsa espacios
    .replace(/^(barrio|urb|urbanizacion|conj|conj res|conjunto residencial)\s+/, '')
    .trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({length: a.length + 1}, () => new Array(b.length + 1));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);
    }
  }
  return dp[a.length][b.length];
}

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1.0;
  if (na.includes(nb) || nb.includes(na)) {
    return Math.min(na.length, nb.length) / Math.max(na.length, nb.length);
  }
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return 1 - (dist / maxLen);
}

// ============================================================================
// PASO 1: Consultar Overpass
// ============================================================================

async function fetchOverpass() {
  console.log('Consultando Overpass API...');
  const query = `
    [out:json][timeout:60];
    (
      node["place"~"neighbourhood|suburb|quarter|hamlet"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
      way["place"~"neighbourhood|suburb|quarter|hamlet"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
      relation["place"~"neighbourhood|suburb|quarter|hamlet"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
      way["landuse"="residential"]["name"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
      relation["landuse"="residential"]["name"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
    );
    out center tags;
  `;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'User-Agent': 'BISS-Soledad-Geocoder/1.0',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'data=' + encodeURIComponent(query),
  });

  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const data = await res.json();

  const found = [];
  for (const el of data.elements || []) {
    const name = el.tags?.name;
    if (!name) continue;
    const lat = el.type === 'node' ? el.lat : el.center?.lat;
    const lng = el.type === 'node' ? el.lon : el.center?.lon;
    if (!lat || !lng) continue;
    found.push({
      name,
      lat: +lat.toFixed(6),
      lng: +lng.toFixed(6),
      type: el.type,
      osm_id: el.id,
      place: el.tags.place || el.tags.landuse,
      alt_name: el.tags.alt_name,
    });
  }

  // Dedup
  const seen = new Set();
  const unique = found.filter(b => {
    const k = normalize(b.name);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  console.log(`  ✓ ${unique.length} barrios únicos encontrados en OSM\n`);
  return unique;
}

// ============================================================================
// PASO 2: Matching contra BD
// ============================================================================

function matchBarrios(barriosOSM) {
  const matches = [];     // matches con score >= 0.85
  const dudosos = [];     // 0.70 - 0.85 (revisión humana)
  const sinMatch = [];    // < 0.70

  // Para no asignar el mismo OSM a 2 barrios diferentes
  const osmUsado = new Set();

  // Generar todos los pares con score
  const pares = [];
  for (const bd of BARRIOS_BD) {
    for (const osm of barriosOSM) {
      const score = similarity(bd, osm.name);
      if (score >= 0.65) {
        pares.push({ bd, osm, score });
      }
    }
  }

  // Greedy 1-a-1: priorizar por score
  pares.sort((a, b) => b.score - a.score);
  const bdAsignado = new Set();
  for (const { bd, osm, score } of pares) {
    if (bdAsignado.has(bd) || osmUsado.has(osm.osm_id)) continue;
    if (score >= 0.85) {
      matches.push({ bd, osm, score });
      bdAsignado.add(bd);
      osmUsado.add(osm.osm_id);
    } else if (score >= 0.70) {
      dudosos.push({ bd, osm, score });
      bdAsignado.add(bd);
      osmUsado.add(osm.osm_id);
    }
  }

  // Sin match
  for (const bd of BARRIOS_BD) {
    if (!bdAsignado.has(bd)) {
      sinMatch.push(bd);
    }
  }

  return { matches, dudosos, sinMatch };
}

// ============================================================================
// PASO 3: Generar SQL y reporte
// ============================================================================

function generarSQL(matches, dudosos) {
  const lines = [
    '-- ============================================================',
    '-- Coordenadas refinadas desde OpenStreetMap (Overpass API)',
    `-- Generado: ${new Date().toISOString()}`,
    `-- Matches confiables (score >= 0.85): ${matches.length}`,
    `-- Matches dudosos (score 0.70-0.85): ${dudosos.length}`,
    '-- ============================================================',
    '',
    'BEGIN;',
    '',
    '-- ─── MATCHES CONFIABLES (score >= 0.85) ─────────────────────────',
  ];

  for (const m of matches) {
    const safe = m.bd.replace(/'/g, "''");
    lines.push(
      `UPDATE barrios SET coord_lat = ${m.osm.lat}, coord_lng = ${m.osm.lng} ` +
      `WHERE UPPER(nombre) = UPPER('${safe}');  -- OSM: "${m.osm.name}" (score ${m.score.toFixed(2)})`
    );
  }

  lines.push('');
  lines.push('-- ─── MATCHES DUDOSOS (score 0.70-0.85) — revisar antes de aplicar ─');
  lines.push('-- Descomenta las líneas que quieras aplicar después de verificar.');
  lines.push('');

  for (const m of dudosos) {
    const safe = m.bd.replace(/'/g, "''");
    lines.push(
      `-- UPDATE barrios SET coord_lat = ${m.osm.lat}, coord_lng = ${m.osm.lng} ` +
      `WHERE UPPER(nombre) = UPPER('${safe}');  -- OSM: "${m.osm.name}" (score ${m.score.toFixed(2)}) ⚠️`
    );
  }

  lines.push('');
  lines.push('COMMIT;');
  lines.push('');
  lines.push('-- Verificación');
  lines.push('SELECT COUNT(*) FROM barrios WHERE coord_lat IS NOT NULL;');

  return lines.join('\n');
}

function generarReporte(matches, dudosos, sinMatch, totalOSM) {
  const lines = [
    '═══════════════════════════════════════════════════════════════',
    '         REPORTE DE MATCHING: BD vs OpenStreetMap',
    '═══════════════════════════════════════════════════════════════',
    '',
    `Total barrios en BD:           ${BARRIOS_BD.length}`,
    `Total barrios en OSM/Soledad:  ${totalOSM}`,
    '',
    `✓ Matches confiables:    ${matches.length}  (score >= 0.85)`,
    `⚠ Matches dudosos:        ${dudosos.length}  (score 0.70-0.85)`,
    `✗ Sin match en OSM:      ${sinMatch.length}  (se quedan con coords OCR)`,
    '',
    '───────────────────────────────────────────────────────────────',
    '✓ MATCHES CONFIABLES',
    '───────────────────────────────────────────────────────────────',
  ];

  matches.sort((a, b) => a.bd.localeCompare(b.bd));
  for (const m of matches) {
    lines.push(`  ${m.bd.padEnd(35)} → ${m.osm.name.padEnd(35)} [${m.score.toFixed(2)}]`);
  }

  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('⚠ MATCHES DUDOSOS (revisar manualmente)');
  lines.push('───────────────────────────────────────────────────────────────');
  dudosos.sort((a, b) => a.bd.localeCompare(b.bd));
  for (const m of dudosos) {
    lines.push(`  ${m.bd.padEnd(35)} → ${m.osm.name.padEnd(35)} [${m.score.toFixed(2)}]`);
  }

  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('✗ SIN MATCH EN OSM (se quedan con coordenadas del OCR)');
  lines.push('───────────────────────────────────────────────────────────────');
  sinMatch.sort();
  for (const b of sinMatch) {
    lines.push(`  ${b}`);
  }

  return lines.join('\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    const barriosOSM = await fetchOverpass();
    fs.writeFileSync('osm_barrios.json', JSON.stringify(barriosOSM, null, 2));
    console.log('✓ osm_barrios.json guardado\n');

    const { matches, dudosos, sinMatch } = matchBarrios(barriosOSM);

    const sql = generarSQL(matches, dudosos);
    fs.writeFileSync('coordenadas_osm_v3.sql', sql);

    const reporte = generarReporte(matches, dudosos, sinMatch, barriosOSM.length);
    fs.writeFileSync('reporte_matches.txt', reporte);

    console.log('═══════════════════════════════════════════════════════');
    console.log(`✓ Matches confiables:  ${matches.length}`);
    console.log(`⚠ Matches dudosos:      ${dudosos.length}`);
    console.log(`✗ Sin match:           ${sinMatch.length}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nArchivos generados:');
    console.log('  - osm_barrios.json          (raw data de OSM)');
    console.log('  - coordenadas_osm_v3.sql    (aplicar a Supabase)');
    console.log('  - reporte_matches.txt       (revisar antes de aplicar)');
    console.log('\n→ Abre reporte_matches.txt primero para ver qué se va a actualizar.');
  } catch (e) {
    console.error('\n❌ Error:', e.message);
    process.exit(1);
  }
}

main();
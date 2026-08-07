// One-off/rerunnable data-collection script: builds src/data/spells.json from
// the D&D 5E spell compendium at critical20.com.br. Raw HTML is cached under
// temp/ so a failed run can resume without re-downloading pages already fetched.
//
// Usage: npm run scrape:spells [-- --limit=10]

import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as cheerio from 'cheerio'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const TEMP_DIR = path.join(ROOT, 'temp')
const DETAIL_DIR = path.join(TEMP_DIR, 'magias')
const INDEX_CACHE = path.join(TEMP_DIR, 'magias-index.html')
const OUTPUT = path.join(ROOT, 'src', 'data', 'spells.json')

const BASE = 'https://www.critical20.com.br'
const INDEX_URL = `${BASE}/blog/dnd5/magias`
const USER_AGENT = 'Mozilla/5.0 (compatible; DedFichaSpellCompendiumBot/1.0; personal/offline use)'
const DELAY_MS = 350

const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.slice('--limit='.length), 10) : Infinity
const slugArg = process.argv.find((a) => a.startsWith('--slugs='))
const ONLY_SLUGS = slugArg ? new Set(slugArg.slice('--slugs='.length).split(',')) : null

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fileExists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'pt-BR,pt;q=0.9' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const html = await res.text()
  if (!html || html.length < 500) throw new Error(`Resposta vazia/curta demais para ${url}`)
  return html
}

async function getIndexHtml() {
  if (await fileExists(INDEX_CACHE)) {
    console.log('Usando índice em cache:', path.relative(ROOT, INDEX_CACHE))
    return readFile(INDEX_CACHE, 'utf-8')
  }
  console.log('Baixando página de índice...')
  const html = await fetchHtml(INDEX_URL)
  await writeFile(INDEX_CACHE, html, 'utf-8')
  return html
}

async function getDetailHtml(slug) {
  const cachePath = path.join(DETAIL_DIR, `${slug}.html`)
  if (await fileExists(cachePath)) return readFile(cachePath, 'utf-8')
  const html = await fetchHtml(`${BASE}/blog/dnd5/magias/${slug}`)
  await writeFile(cachePath, html, 'utf-8')
  await sleep(DELAY_MS)
  return html
}

function textOf($el) {
  return $el.text().replace(/\s+/g, ' ').trim()
}

/** Finds a label/value pair shaped as `<div>LABEL</div><div>VALUE...</div>` (siblings), matching LABEL exactly. */
function findValueByLabel($, $scope, label) {
  let value = null
  $scope.find('div').each((_, el) => {
    if (value !== null) return
    const $el = $(el)
    if ($el.children().length === 0 && textOf($el) === label) {
      const $val = $el.next()
      if ($val.length) value = textOf($val)
    }
  })
  return value
}

function parseIndex(html) {
  const $ = cheerio.load(html)
  const spells = []
  $('a[href^="/blog/dnd5/magias/"]').each((_, a) => {
    const $a = $(a)
    const h3 = $a.find('h3').first()
    if (h3.length === 0) return // not a spell card (nav/breadcrumb link, etc.)
    const href = $a.attr('href') || ''
    const slug = href.replace('/blog/dnd5/magias/', '').split(/[?#]/)[0]
    if (!slug) return

    const namePt = textOf(h3)
    const ps = $a.find('p')
    const nameEn = ps.length > 0 ? textOf(ps.eq(0)) : ''
    const summary = ps.length > 1 ? textOf(ps.eq(1)) : ''

    const badgeSpans = h3.prev().children('span')
    const levelRaw = badgeSpans.length > 0 ? textOf(badgeSpans.eq(0)) : ''
    const school = badgeSpans.length > 1 ? textOf(badgeSpans.eq(1)) : ''
    let concentration = false
    let ritual = false
    badgeSpans.slice(2).each((__, s) => {
      const t = textOf($(s))
      if (t === 'Conc.') concentration = true
      if (t === 'Ritual') ritual = true
    })
    const level = /^truque$/i.test(levelRaw) ? 0 : parseInt(levelRaw, 10) || 0

    const statsGrid = $a.find('div.grid').first()
    const castingTime = findValueByLabel($, statsGrid, 'Conjuração') ?? ''
    const range = findValueByLabel($, statsGrid, 'Alcance') ?? ''
    const duration = findValueByLabel($, statsGrid, 'Duração') ?? ''

    spells.push({ slug, namePt, nameEn, level, school, castingTime, range, duration, concentration, ritual, summary })
  })
  return spells
}

const MECH_LABELS = { Dano: 'damage', Resistência: 'save', 'Alvo / Área': 'areaOrTarget', Escalonamento: 'scaling' }

function parseDetail(html) {
  const $ = cheerio.load(html)
  const $body = $('body')

  // Componentes: the page shows both an abbreviated stat card ("V, S, M") and,
  // further down, a detailed <ul> with the material text — prefer the detailed one.
  const components = { verbal: false, somatic: false, material: false, materialText: undefined }
  let componentsAbbrev = null
  let foundDetailedComponents = false
  $body.find('div').each((_, el) => {
    if (foundDetailedComponents) return false
    const $el = $(el)
    if ($el.children().length === 0 && textOf($el) === 'Componentes') {
      const $val = $el.next()
      const lis = $val.find('li')
      if (lis.length > 0) {
        lis.each((__, li) => {
          const t = textOf($(li))
          if (/^Verbal/i.test(t)) components.verbal = true
          else if (/^Som[aá]tico/i.test(t)) components.somatic = true
          else if (/^Material/i.test(t)) {
            components.material = true
            const idx = t.indexOf(':')
            components.materialText = idx >= 0 ? t.slice(idx + 1).trim() : undefined
          }
        })
        foundDetailedComponents = true
      } else if (componentsAbbrev === null) {
        componentsAbbrev = textOf($val)
      }
    }
  })
  if (!foundDetailedComponents && componentsAbbrev) {
    components.verbal = /\bV\b/.test(componentsAbbrev)
    components.somatic = /\bS\b/.test(componentsAbbrev)
    components.material = /\bM\b/.test(componentsAbbrev)
  }

  const ritualValue = findValueByLabel($, $body, 'Ritual')
  const ritual = ritualValue !== null ? /^sim/i.test(ritualValue) : undefined

  const source = findValueByLabel($, $body, 'Fonte') ?? undefined

  const tags = []
  $('a[href^="/blog/dnd5/tag/"]').each((_, a) => {
    const t = textOf($(a)).replace(/^#/, '')
    if (t && !tags.includes(t)) tags.push(t)
  })

  const classes = []
  $body.find('div').each((_, el) => {
    const $el = $(el)
    if ($el.children().length === 0 && textOf($el) === 'Classes') {
      const $val = $el.next()
      $val.find('a').each((__, a) => {
        const $a = $(a)
        const href = $a.attr('href') || ''
        const m = href.match(/[?&]class=([^&]+)/)
        // Chip markup is <a><span class="chip"><span>emoji</span><span>Name</span></span></a> —
        // use direct-children traversal, not .find(), which would also match the outer chip span.
        const innerSpans = $a.children('span').first().children('span')
        const emoji = innerSpans.length > 0 ? textOf(innerSpans.eq(0)) : ''
        const name = innerSpans.length > 1 ? textOf(innerSpans.eq(1)) : textOf($a)
        if (name) classes.push({ slug: m ? decodeURIComponent(m[1]) : name.toLowerCase(), name, emoji })
      })
      return false
    }
  })

  // Full description: every <p> inside the "Como esta magia funciona" section.
  let description = ''
  $('h2').each((_, h2) => {
    if (textOf($(h2)) !== 'Como esta magia funciona') return
    const $section = $(h2).closest('section')
    const $scope = $section.length ? $section : $(h2).parent()
    description = $scope
      .find('p')
      .map((__, p) => textOf($(p)))
      .get()
      .filter(Boolean)
      .join('\n\n')
    return false
  })

  // Optional mechanics callouts (Dano / Resistência / Alvo-Área / Escalonamento).
  const mechanics = {}
  $('span').each((_, el) => {
    const label = textOf($(el))
    const field = MECH_LABELS[label]
    if (!field) return
    const $labelRow = $(el).parent()
    const $value = $labelRow.next()
    if (!$value.length) return
    mechanics[field] = textOf($value)
    if (field === 'damage') {
      const $sub = $value.next()
      if ($sub.length) mechanics.damageType = textOf($sub).replace(/^de\s+/i, '')
    }
  })

  // Optional "Modificada no D&D 5.5" callout.
  let revision55
  $body.find('div').each((_, el) => {
    const $el = $(el)
    if ($el.children().length === 0 && /modificada no d&d 5\.5/i.test(textOf($el))) {
      revision55 = { status: textOf($el), note: textOf($el.next('p')) }
      return false
    }
  })

  return {
    components,
    ritual,
    source,
    tags,
    classes,
    description,
    mechanics: Object.keys(mechanics).length > 0 ? mechanics : undefined,
    revision55,
  }
}

async function main() {
  await mkdir(DETAIL_DIR, { recursive: true })

  const indexHtml = await getIndexHtml()
  let indexSpells = parseIndex(indexHtml)
  console.log(`Índice: ${indexSpells.length} magias encontradas.`)
  if (ONLY_SLUGS) {
    indexSpells = indexSpells.filter((s) => ONLY_SLUGS.has(s.slug))
    console.log(`(--slugs ativo: processando só ${indexSpells.length})`)
  } else if (Number.isFinite(LIMIT)) {
    indexSpells = indexSpells.slice(0, LIMIT)
    console.log(`(--limit ativo: processando só ${indexSpells.length})`)
  }

  const results = []
  const failures = []

  for (let i = 0; i < indexSpells.length; i++) {
    const base = indexSpells[i]
    const sourceUrl = `${BASE}/blog/dnd5/magias/${base.slug}`
    process.stdout.write(`\r[${i + 1}/${indexSpells.length}] ${base.slug}                              `)
    try {
      const html = await getDetailHtml(base.slug)
      const detail = parseDetail(html)
      results.push({
        ...base,
        ritual: detail.ritual ?? base.ritual,
        components: detail.components,
        classes: detail.classes,
        tags: detail.tags,
        source: detail.source,
        description: detail.description || base.summary,
        mechanics: detail.mechanics,
        revision55: detail.revision55,
        sourceUrl,
      })
    } catch (err) {
      failures.push({ slug: base.slug, error: String(err?.message ?? err) })
    }
  }
  process.stdout.write('\n')

  await mkdir(path.dirname(OUTPUT), { recursive: true })
  await writeFile(OUTPUT, JSON.stringify(results), 'utf-8')

  console.log(`\nConcluído: ${results.length} magias salvas em ${path.relative(ROOT, OUTPUT)}.`)
  if (failures.length > 0) {
    console.log(`${failures.length} falharam:`)
    for (const f of failures) console.log(`  - ${f.slug}: ${f.error}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

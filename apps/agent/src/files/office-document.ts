import { unzip, zipStore } from './zip-archive'

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const SHEET_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'
const CT_NS = 'http://schemas.openxmlformats.org/package/2006/content-types'
const WORKBOOK_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet'
const OFFICE_REL =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument'

export function extractOfficeText(kind: 'docx' | 'xlsx', bytes: Uint8Array) {
  const entries = unzip(bytes)
  if (kind === 'docx') return docxPlainText(textOf(entries.get('word/document.xml')))
  return xlsxPlainText(entries)
}

export function editOfficeText(
  bytes: Uint8Array,
  oldString: string,
  newString: string,
  replaceAll: boolean
) {
  const entries = unzip(bytes)
  let occurrences = 0
  const next = new Map(entries)
  for (const [path, content] of entries) {
    if (!path.endsWith('.xml')) continue
    const xml = new TextDecoder().decode(content)
    const replaced = replaceXmlText(xml, oldString, newString, replaceAll)
    if (!replaced) continue
    occurrences += replaced.occurrences
    next.set(path, new TextEncoder().encode(replaced.xml))
    if (!replaceAll) break
  }
  if (occurrences === 0) return { error: '没有找到要替换的原文' }
  return { bytes: zipStore(next), occurrences }
}

export function createExportDocument(name: string, content: string) {
  if (name.endsWith('.xlsx')) return { bytes: createWorkbook(parseTable(content)) }
  if (name.endsWith('.docx')) return { bytes: createDocx(content.split('\n')) }
  return { bytes: new TextEncoder().encode(name.endsWith('.csv') ? `\uFEFF${content}` : content) }
}

function docxPlainText(xml: string) {
  return xml
    .split(/<\/w:p>/)
    .map((part) => joinNodes(part, /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g))
    .filter((line) => line.length > 0)
    .join('\n')
}

function xlsxPlainText(entries: Map<string, Uint8Array>) {
  const strings = sharedStrings(textOf(entries.get('xl/sharedStrings.xml')))
  const sheets = [...entries.keys()]
    .filter((path) => /^xl\/worksheets\/sheet\d+\.xml$/.test(path))
    .sort()
  if (sheets.length === 0) return ''
  return sheets
    .map((path, index) => {
      const grid = sheetGrid(textOf(entries.get(path)), strings)
      const body = grid.map((row) => row.join('\t')).join('\n')
      return sheets.length > 1 ? `# sheet${index + 1}\n${body}` : body
    })
    .join('\n\n')
}

function sharedStrings(xml: string) {
  return [...xml.matchAll(/<si\b[\s\S]*?<\/si>/g)].map((item) =>
    joinNodes(item[0] ?? '', /<t\b[^>]*>([\s\S]*?)<\/t>/g)
  )
}

function sheetGrid(xml: string, strings: string[]) {
  return [...xml.matchAll(/<row\b[\s\S]*?<\/row>/g)].map((row) =>
    [...(row[0] ?? '').matchAll(/<c\b[\s\S]*?<\/c>/g)].map((cell) =>
      cellText(cell[0] ?? '', strings)
    )
  )
}

function cellText(cell: string, strings: string[]) {
  const type = / t="([^"]+)"/.exec(cell)?.[1]
  const value = /<v>([\s\S]*?)<\/v>/.exec(cell)?.[1] ?? ''
  if (type === 's') return strings[Number(value)] ?? ''
  if (type === 'inlineStr') return joinNodes(cell, /<t\b[^>]*>([\s\S]*?)<\/t>/g)
  return decodeXml(value)
}

function replaceXmlText(xml: string, oldString: string, newString: string, replaceAll: boolean) {
  const pattern = /<((?:w:)?t)\b([^>]*)>([\s\S]*?)<\/\1>/g
  let occurrences = 0
  const next = xml.replace(pattern, (full, tag: string, attrs: string, raw: string) => {
    const decoded = decodeXml(raw)
    if (!decoded.includes(oldString) || (!replaceAll && occurrences > 0)) return full
    const count = replaceAll ? countOf(decoded, oldString) : 1
    occurrences += count
    const replaced = replaceAll
      ? decoded.replaceAll(oldString, newString)
      : decoded.replace(oldString, newString)
    return `<${tag}${attrs}>${encodeXml(replaced)}</${tag}>`
  })
  if (occurrences > 0) return { xml: next, occurrences }
  return replaceAcrossNodes(xml, oldString, newString, replaceAll)
}

function replaceAcrossNodes(
  xml: string,
  oldString: string,
  newString: string,
  replaceAll: boolean
) {
  const pattern = /<((?:w:)?t)\b([^>]*)>([\s\S]*?)<\/\1>/g
  const nodes = [...xml.matchAll(pattern)]
  const decoded = nodes.map((node) => decodeXml(node[3] ?? ''))
  const joined = decoded.join('')
  if (!joined.includes(oldString)) return undefined
  const updated = replaceAll
    ? joined.replaceAll(oldString, newString)
    : joined.replace(oldString, newString)
  const first = nodes[0]
  if (!first) return undefined
  let xmlNext = xml
  for (const [index, node] of nodes.entries()) {
    const full = node[0] ?? ''
    const tag = node[1] ?? 't'
    const attrs = node[2] ?? ''
    const value = index === 0 ? updated : ''
    xmlNext = replaceFirst(xmlNext, full, `<${tag}${attrs}>${encodeXml(value)}</${tag}>`)
  }
  return { xml: xmlNext, occurrences: replaceAll ? countOf(joined, oldString) : 1 }
}

function createWorkbook(rows: string[][]) {
  const strings: string[] = []
  const indexOf = (value: string) => {
    const found = strings.indexOf(value)
    if (found >= 0) return found
    strings.push(value)
    return strings.length - 1
  }
  const sheetRows = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, column) => {
          const ref = `${columnName(column)}${rowIndex + 1}`
          return `<c r="${ref}" t="s"><v>${indexOf(value)}</v></c>`
        })
        .join('')
      return `<row r="${rowIndex + 1}">${cells}</row>`
    })
    .join('')
  const entries = new Map<string, Uint8Array>([
    ['[Content_Types].xml', xml(contentTypes())],
    ['_rels/.rels', xml(rootRels('xl/workbook.xml'))],
    ['xl/workbook.xml', xml(workbookXml())],
    ['xl/_rels/workbook.xml.rels', xml(workbookRels())],
    ['xl/sharedStrings.xml', xml(sharedStringsXml(strings))],
    ['xl/worksheets/sheet1.xml', xml(sheetXml(sheetRows))]
  ])
  return zipStore(entries)
}

function createDocx(lines: string[]) {
  const paragraphs = (lines.length > 0 ? lines : ['']).map((line) => {
    return `<w:p><w:r><w:t xml:space="preserve">${encodeXml(line)}</w:t></w:r></w:p>`
  })
  const entries = new Map<string, Uint8Array>([
    ['[Content_Types].xml', xml(docxContentTypes())],
    ['_rels/.rels', xml(rootRels('word/document.xml'))],
    ['word/document.xml', xml(docxXml(paragraphs.join('')))]
  ])
  return zipStore(entries)
}

function parseTable(content: string) {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/)
  const tabbed = lines.filter((line) => line.includes('\t')).length
  const commad = lines.filter((line) => line.includes(',')).length
  if (tabbed > commad) return lines.map((line) => line.split('\t'))
  return lines.map(parseCsvLine)
}

function parseCsvLine(line: string) {
  const cells: string[] = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        quoted = !quoted
      }
      continue
    }
    if (char === ',' && !quoted) {
      cells.push(current)
      current = ''
      continue
    }
    current += char ?? ''
  }
  cells.push(current)
  return cells
}

function contentTypes() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="${CT_NS}">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`
}

function docxContentTypes() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="${CT_NS}">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
}

function rootRels(target: string) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${REL_NS}">
<Relationship Id="rId1" Type="${OFFICE_REL}" Target="${target}"/>
</Relationships>`
}

function workbookXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="${SHEET_NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
</workbook>`
}

function workbookRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${REL_NS}">
<Relationship Id="rId1" Type="${WORKBOOK_REL}" Target="worksheets/sheet1.xml"/>
</Relationships>`
}

function sharedStringsXml(strings: string[]) {
  const items = strings
    .map((value) => `<si><t xml:space="preserve">${encodeXml(value)}</t></si>`)
    .join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="${SHEET_NS}" count="${strings.length}" uniqueCount="${strings.length}">${items}</sst>`
}

function sheetXml(rows: string) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="${SHEET_NS}"><sheetData>${rows}</sheetData></worksheet>`
}

function docxXml(body: string) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${WORD_NS}"><w:body>${body}<w:sectPr/></w:body></w:document>`
}

function xml(value: string) {
  return new TextEncoder().encode(value)
}

function textOf(bytes: Uint8Array | undefined) {
  return bytes ? new TextDecoder().decode(bytes) : ''
}

function joinNodes(source: string, pattern: RegExp) {
  return [...source.matchAll(pattern)].map((item) => decodeXml(item[1] ?? '')).join('')
}

function encodeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function decodeXml(value: string) {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
}

function replaceFirst(source: string, search: string, replacement: string) {
  const index = source.indexOf(search)
  if (index < 0) return source
  return source.slice(0, index) + replacement + source.slice(index + search.length)
}

function countOf(text: string, needle: string) {
  if (!needle) return 0
  let count = 0
  let index = 0
  while (index <= text.length) {
    const found = text.indexOf(needle, index)
    if (found < 0) break
    count += 1
    index = found + needle.length
  }
  return count
}

function columnName(index: number) {
  let current = index + 1
  let name = ''
  while (current > 0) {
    const remainder = (current - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    current = Math.floor((current - 1) / 26)
  }
  return name
}

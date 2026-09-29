import JSZip from 'jszip'
import { SaxesParser } from 'saxes'

const SPREADSHEET_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const escapeText = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escapeAttribute = value => escapeText(value).replace(/"/g, '&quot;').replace(/\r/g, '&#13;').replace(/\n/g, '&#10;').replace(/\t/g, '&#9;')

// ExcelJS 4.4's worksheet/workbook transforms match literal tag names rather
// than XML namespace + local name. Normalize only SpreadsheetML element names;
// namespace-aware parsing leaves text, attributes and foreign elements intact.
export function normalizeSpreadsheetXml(xml) {
  const parser = new SaxesParser({ xmlns: true })
  const output = []
  let changed = false
  const elementName = node => node.uri === SPREADSHEET_NS ? node.local : node.name
  parser.on('opentag', node => {
    const name = elementName(node)
    if (name !== node.name) changed = true
    const attributes = Object.values(node.attributes).map(attribute => [attribute.name, attribute.value])
    if (!name.includes(':')) {
      const existing = attributes.find(attribute => attribute[0] === 'xmlns')
      if (existing) existing[1] = node.uri
      else attributes.push(['xmlns', node.uri])
    }
    output.push('<' + name + attributes.map(([key,value]) => ' ' + key + '="' + escapeAttribute(value) + '"').join('') + (node.isSelfClosing ? '/>' : '>'))
  })
  parser.on('closetag', node => { if (!node.isSelfClosing) output.push('</' + elementName(node) + '>') })
  parser.on('text', text => output.push(escapeText(text)))
  parser.on('cdata', text => output.push(escapeText(text)))
  parser.on('comment', text => output.push('<!--' + text + '-->'))
  parser.on('processinginstruction', node => output.push('<?' + node.target + ' ' + node.body + '?>'))
  parser.on('doctype', () => { throw new Error('This workbook contains unsupported XML declarations. Save it as a standard .xlsx workbook and try again.') })
  parser.write(xml).close()
  return changed ? output.join('') : xml
}

export async function prepareWorkbookForExcelJs(buffer) {
  const zip = await JSZip.loadAsync(buffer)
  let changed = false
  for (const entry of Object.values(zip.files)) {
    if (entry.dir || !/^xl\/.*\.xml$/.test(entry.name)) continue
    const xml = await entry.async('string')
    // Ordinary ExcelJS/Excel files take the unchanged path.
    if (!xml.includes(SPREADSHEET_NS)) continue
    const normalized = normalizeSpreadsheetXml(xml)
    if (normalized !== xml) { zip.file(entry.name, normalized); changed = true }
  }
  return changed ? zip.generateAsync({ type: 'uint8array' }) : buffer
}

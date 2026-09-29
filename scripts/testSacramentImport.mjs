// Offline regression checks. No live Firestore writes or Calendar calls.
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import JSZip from 'jszip'
import BrowserExcel from 'exceljs/dist/exceljs.min.js'

const state = { existing: [], writes: [], audits: [], attempts: 0, failAt: 0, failRead: false }
globalThis.__sacramentImportTest = state
const server = await createServer({
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, include: [] },
  plugins: [{
    name: 'offline-import-test', enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/sacramentImportService.js')) return
      return code.replace("from 'firebase/firestore'", "from 'test-import-firestore'").replace("from '../firebase/config'", "from 'test-import-auth'").replace("from './auditLogService'", "from 'test-import-audit'")
    },
    resolveId(id) { if (id.startsWith('test-import-')) return '\0' + id.slice(5) },
    load(id) {
      if (id === '\0import-firestore') return `
        const state = globalThis.__sacramentImportTest;
        export const collection = (_, name) => name;
        export const getDocs = async () => { if (state.failRead) throw Error('Simulated read failure'); return { docs: state.existing.map(data => ({data: () => data})) }; };
        export const serverTimestamp = () => 'SERVER_TIME';
        export const addDoc = async (ref, data) => { state.attempts++; if (state.attempts === state.failAt) throw Error('Simulated write failure'); state.writes.push({ref,data}); return {id: String(state.writes.length)}; };
      `
      if (id === '\0import-auth') return `export const db = {}; export const auth = {currentUser: {email:'test@example.invalid'}};`
      if (id === '\0import-audit') return `export const createAuditLog = async data => { globalThis.__sacramentImportTest.audits.push(data); if(globalThis.__sacramentImportTest.failAudit) throw Error('Simulated audit failure'); };`
    },
  }],
})
try {
  const service = await server.ssrLoadModule('/src/services/sacramentImportService.js')
  const configs = await server.ssrLoadModule('/src/services/sacramentImportConfig.js')
  const places = await server.ssrLoadModule('/src/utils/philippinePlaces.js')
  const province = places.getAllProvinces().find(p => places.getCitiesByProvince(p.prov_code).some(c => places.getBarangaysByCity(c.mun_code).length))
  const city = places.getCitiesByProvince(province.prov_code).find(c => places.getBarangaysByCity(c.mun_code).length)
  const barangay = places.getBarangaysByCity(city.mun_code)[0]
  const region = places.getRegions().find(r => r.reg_code === province.reg_code)
  const location = {regionName: region.name, provinceName: province.name, cityName: city.name, barangayName: barangay.name}
  for (const module of ['baptism','confirmation','marriage','death','conversion']) {
    const config = configs.getImportConfig(module)
    const values = Object.fromEntries(config.columns.map(c => {
      let value = c.required ? 'Juan' : ''
      if (c.type === 'place') value = [location.barangayName,location.cityName,location.provinceName].join(', ')
      else if (c.type === 'name') value = 'Juan Dela Cruz Jr.'
      else if (c.type === 'people') value = 'Mark Juven Neypes; Renz Dela Cruz; Ana Reyes'
      else if (c.type === 'date') value = /birth/i.test(c.key) ? '1990-01-01' : '2020-01-01'
      else if (c.type === 'number') value = c.key === 'recordYear' ? '2020' : ['age','groomAge','brideAge'].includes(c.key) ? '30' : '1'
      else if (c.options) value = c.options[0]
      else if (c.type === 'boolean') value = 'Yes'
      else if (c.key === 'bookNumber') value = 'iv'
      return [c.key, value]
    }))
    const workbook = await service.createImportWorkbook(module)
    const sheet = workbook.worksheets[0]
    for (const worksheet of workbook.worksheets) worksheet.eachRow(row => row.eachCell(cell => {
      assert.ok(!/JSON|Firestore|\[\{|firstName|lastName/.test(String(cell.value || '')), 'Workbook must use staff-friendly language')
    }))
    assert.equal(sheet.name, 'Records')
    assert.equal(sheet.views[0].ySplit, 1)
    console.log(config.title + ' HEADERS (' + config.columns.length + '): ' + config.columns.map(c=>c.header).join(' | '))
    assert.equal(sheet.getRow(1).getCell(1).font.bold, true)
    assert.equal(sheet.rowCount, 1, 'No sample rows in data sheet')
    const add = data => sheet.addRow(config.columns.map(c => data[c.key]))
    add(values)
    add({...values, recordNumber:'2', lineNumber:'2', pageNumber:'12345'})
    add({...values, recordNumber:'3', lineNumber:'3', recordYear:'bad'})
    add({...values, recordNumber:'4', lineNumber:'4'})
    const bytes = await workbook.xlsx.writeBuffer()
    // Reproduce the valid namespace-prefixed workbook that broke ExcelJS 4.4.
    const zip = await JSZip.loadAsync(bytes)
    const mainNs = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
    for (const entry of Object.values(zip.files)) {
      if (entry.dir || !/^xl\/.*\.xml$/.test(entry.name)) continue
      const xml = await entry.async('string')
      if (!xml.includes('xmlns="' + mainNs + '"')) continue
      zip.file(entry.name, xml.replace('xmlns="' + mainNs + '"', 'xmlns:x="' + mainNs + '"').replace(/(<\/?)([A-Za-z][\w.-]*)(?=[\s/>])/g, '$1x:$2'))
    }
    const prefixedBytes = await zip.generateAsync({type:'uint8array'})
    await assert.rejects(new BrowserExcel.Workbook().xlsx.load(prefixedBytes), /sheets|sheetNo/, 'Reproduce upstream browser-parser failure')
    const compatibility = await server.ssrLoadModule('/src/services/excelWorkbookCompatibility.js')
    const browserWorkbook = new BrowserExcel.Workbook()
    await browserWorkbook.xlsx.load(await compatibility.prepareWorkbookForExcelJs(prefixedBytes))
    assert.equal(browserWorkbook.getWorksheet('Records').getRow(2).getCell(1).value, values.recordNumber)
    const prefixedRows = await service.parseImportWorkbook(module, prefixedBytes)
    const rows = await service.parseImportWorkbook(module, bytes)
    assert.deepEqual(prefixedRows, rows, 'Namespace normalization must preserve all parsed values and mappings')
    const prefixedFile = new File([prefixedBytes], config.title + '_Edited.xlsx', {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})
    const prefixedPreview = await service.previewImport(module, prefixedFile)
    assert.equal(prefixedPreview[0].state, 'Valid')
    assert.equal(state.writes.length,0, 'Actual File/ArrayBuffer preview must never write')
    console.log('PASS ' + module + ': browser ExcelJS reproduction, namespaced XLSX File parsing and preview without writes.')
    assert.deepEqual(rows[0].errors, [], module + ' valid row')
    assert.deepEqual(rows[1].errors, [], module + ' second valid row')
    assert.ok(rows[2].errors.length)
    const repeatedGroup = module === 'baptism' ? 'godparents' : module === 'marriage' ? 'principalSponsors' : null
    if (repeatedGroup) {
      const people = rows[0].document[repeatedGroup]
      assert.deepEqual(people.map(p=>p.firstName), ['Mark Juven','Renz','Ana'])
      assert.deepEqual(people.map(p=>p.lastName), ['Neypes','Dela Cruz','Reyes'])
      assert.ok(people.every(p=>!('id' in p)))
      if (module === 'baptism') assert.ok(people.every(p=>p.residence === ''))
      const invalid = configs.mapImportRow(config,{...values,[repeatedGroup]:'Juan; Ana Reyes'})
      assert.ok(invalid.errors.length)
      const emptyPerson = configs.mapImportRow(config,{...values,[repeatedGroup]:'Juan Cruz;;Ana Reyes'})
      assert.ok(emptyPerson.errors.length)
      assert.ok(rows[0].mapping[repeatedGroup].includes('3. Given names: Ana'))
    }
    assert.equal(rows[0].document.bookNumber, 'IV')
    assert.equal(rows[0].document.pageNumber, 1)
    assert.equal(rows[1].document.pageNumber, 12345)
    state.existing = [{recordNumber:4,recordYear:2020,archived:true}]
    const preview = service.markImportConflicts(rows, state.existing)
    assert.deepEqual(preview.map(r=>r.state), ['Valid','Valid','Invalid','Conflict'])
    assert.equal(state.writes.length, 0, 'Preview must not write')
    state.failAt = 2; state.attempts = 0; state.failAudit = true
    const result = await service.saveHistoricalImport(module, preview)
    assert.deepEqual(result.summary, { imported:1, invalid:1, duplicates:1, failed:1 })
    assert.equal(state.audits.length, 1)
    assert.equal(state.audits[0].action, `Imported ${config.title} Records`)
    const saved = state.writes[0].data
    assert.equal(saved.recordType, 'old')
    assert.equal(saved.recordNumber, 1)
    assert.equal(saved.status, module === 'confirmation' ? 'active' : module === 'death' ? 'Single' : undefined)
    if (module === 'confirmation') assert.equal('dateOfBirth' in saved, false)
    assert.ok(!saved.eventId)
    assert.ok(!saved.time, 'Historical imports must not assign a schedule time')
    assert.equal(saved.recordYear, 2020, 'Keep the entered historical registry year')
    assert.ok(!config.columns.some(c => c.key === 'time'), 'No schedule-time input')
    if (module === 'baptism') {
      assert.equal('status' in saved, false, 'Do not infer a lifecycle status for history')
      assert.equal('status' in rows[0].document, false, 'Preview and save use the same historical representation')
      const { mapBaptismDocToUi } = await server.ssrLoadModule('/src/services/baptismService.js')
      assert.equal(mapBaptismDocToUi(saved).status, undefined, 'Reading must not infer scheduled')
    }
    const duplicates = service.markImportConflicts([rows[0],{...rows[0], rowNumber:10}], [])
    assert.ok(duplicates.every(r=>r.state==='Conflict'))
    const bad = configs.mapImportRow(config, {...values, bookNumber:'IIII', lineNumber:'-1', pageNumber:'0'})
    assert.ok(bad.errors.length >= 3)
    if (module === 'conversion') assert.ok(configs.mapImportRow(config, {...values, originalBaptismDenomination:'1'}).errors.some(e=>e.includes('letters')))
    if (module === 'confirmation') assert.ok(configs.mapImportRow(config, {...values, age:'12'}).errors.length)
    // A late conflict must be skipped, and successful rows still get one summary.
    state.writes=[];state.audits=[];state.attempts=0;state.failAt=0;state.failAudit=false
    state.existing=[{recordNumber:1,recordYear:2020,archived:true}]
    const late = await service.saveHistoricalImport(module, preview)
    assert.deepEqual(late.summary, {imported:1,invalid:1,duplicates:2,failed:0})
    assert.equal(state.writes[0].data.recordNumber, 2)
    assert.equal(state.audits.length, 1)
    // Multiple successful writes produce a single audit entry, not per-row entries.
    state.writes=[];state.audits=[];state.attempts=0;state.existing=[]
    const multiple = await service.saveHistoricalImport(module, preview)
    assert.deepEqual(multiple.summary, {imported:2,invalid:1,duplicates:1,failed:0})
    assert.equal(state.audits.length, 1)
    assert.ok(state.audits[0].details.includes('Bulk imported 2 historical'))
    assert.ok(state.writes.every(write => write.ref === config.collection))
    // No successful writes means no success audit. Failed reads block all writes.
    state.writes=[];state.audits=[];state.attempts=0;state.failAt=1
    const one = await service.saveHistoricalImport(module, [preview[0]])
    assert.deepEqual(one.summary, {imported:0,invalid:0,duplicates:0,failed:1})
    assert.equal(state.audits.length, 0)
    state.failRead=true
    await assert.rejects(service.saveHistoricalImport(module, preview), /read failure/)
    assert.equal(state.writes.length, 0)
    state.failRead=false;state.failAt=0;state.attempts=0
    // Preview validates files without writing, including mixed input and blank rows.
    const file = {name: 'records.xlsx', size: bytes.byteLength, arrayBuffer: async () => bytes}
    const filePreview = await service.previewImport(module, file)
    assert.equal(filePreview.length, 4)
    assert.equal(state.writes.length, 0)
    await assert.rejects(service.previewImport(module, {...file,name:'records.csv'}), /xlsx/)
    await assert.rejects(service.previewImport(module, {...file,size:service.MAX_IMPORT_BYTES+1}), /5 MB/)
    await assert.rejects(service.parseImportWorkbook(module, new Uint8Array([1,2,3])), /./)
    const empty = await service.createImportWorkbook(module)
    await assert.rejects(service.parseImportWorkbook(module, await empty.xlsx.writeBuffer()), /no records/)
    empty.worksheets[0].name = 'Wrong Module'
    await assert.rejects(service.parseImportWorkbook(module, await empty.xlsx.writeBuffer()), /template/)
    const malformed = await service.createImportWorkbook(module)
    const row = malformed.worksheets[0].addRow(config.columns.map(c=>values[c.key]))
    const dateIndex=config.columns.findIndex(c=>c.type==='date')
    row.getCell(dateIndex+1).value='2024-02-30'
    const malformedRows=await service.parseImportWorkbook(module, await malformed.xlsx.writeBuffer())
    assert.ok(malformedRows[0].errors.some(e=>e.includes('Invalid calendar date')))
    malformed.worksheets[0].addRow(config.columns.map(()=>''))
    assert.equal((await service.parseImportWorkbook(module,await malformed.xlsx.writeBuffer())).length, 1)
    const optional = {...values,bookNumber:'',lineNumber:'',pageNumber:''}
    for (const c of config.columns) if (!c.required) optional[c.key]=''
    const optionalResult=configs.mapImportRow(config,optional)
    assert.deepEqual(optionalResult.errors,[], 'Optional fields must remain optional')
    assert.equal(optionalResult.document.lineNumber,null)
    assert.equal(optionalResult.document.pageNumber,null)
    assert.equal(optionalResult.document.bookNumber,'')
    if (repeatedGroup) assert.deepEqual(optionalResult.document[repeatedGroup], [])
    const requiredKey = config.columns.find(c=>c.required && c.type === 'name').key
    assert.ok(configs.mapImportRow(config,{...values,[requiredKey]:''}).errors.length)
    const placeColumn = config.columns.find(c=>c.type==='place')
    if(placeColumn) {
      assert.ok(configs.mapImportRow(config,{...values,[placeColumn.key]:'Unknown unmatched location'}).errors.length)
      assert.ok(configs.mapImportRow(config,{...values,[placeColumn.key]:'Street, ' + values[placeColumn.key]}).errors.length, 'Never discard an extra address component')
      assert.ok(configs.mapImportRow(config,{...values,[placeColumn.key]:values[placeColumn.key] + ', Incorrect Region'}).errors.length)
      assert.ok(rows[0].mapping[placeColumn.key].includes(location.barangayName))
    }
    if (module === 'marriage') {
      const occupation = configs.mapImportRow(config,{...values,groomOccupation:'Bookbinder'})
      assert.deepEqual(occupation.errors,[])
      assert.equal(occupation.document.groomOccupation,'Others')
      assert.equal(occupation.document.groomOccupationOther,'Bookbinder')
      assert.equal(occupation.document.groomAge,30)
    }
    assert.equal(service.markImportConflicts([rows[0]], [{recordNumber:99,recordYear:2020,bookNumber:'iv',pageNumber:'001',lineNumber:'01',archived:true}])[0].state,'Conflict')
    console.log('PASS ' + module + ': stale conflicts, multi-success summary, failed reads/all failed, file errors, optional values and registry conflict.')
    sheet.getRow(1).getCell(1).value = 'Renamed Header'
    await assert.rejects(service.parseImportWorkbook(module, await workbook.xlsx.writeBuffer()), /Headers/)
    console.log(`PASS ${module}: ${config.columns.length} columns; XLSX round trip, required/registry validation, archived/workbook conflicts, partial writes, status, one best-effort audit.`)
    state.existing=[];state.writes=[];state.audits=[];state.attempts=0
  }
  for (const [input, firstName, lastName, suffix] of [
    ['Mark Juven Neypes','Mark Juven','Neypes',''],
    ['Renz Dela Cruz','Renz','Dela Cruz',''],
    ['Juan Miguel De los Santos III','Juan Miguel','De los Santos','III'],
    ['Maria Ana De Guzman Jr.','Maria Ana','De Guzman','Jr.'],
    ['Dela Cruz, Juan Miguel Sr.','Juan Miguel','Dela Cruz','Sr.'],
  ]) assert.deepEqual(configs.splitHistoricalName(input), {firstName,middleName:'',lastName,suffix})
  assert.throws(()=>service.dateCell('2024-02-30'), /Invalid calendar/)
  assert.throws(()=>service.dateCell('01/02/2024'), /YYYY-MM-DD/)
  assert.equal(service.dateCell(new Date('2024-02-29T00:00:00Z')), '2024-02-29')
  assert.throws(()=>service.readImportCell({value:{formula:'1+1',result:2}}, {type:'number'}), /plain values/)
  assert.throws(()=>service.readImportCell({value:'9007199254740992'}, {type:'number'}), /whole number/)
  console.log('PASS invalid dates, formula cells and unsafe integers.')
} finally {
  await server.close()
  delete globalThis.__sacramentImportTest
}

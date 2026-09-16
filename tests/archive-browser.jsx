// Browser fixture: real React/MUI components, isolated authentication and storage.
import React from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom'
import ArchivedRecords from '../src/pages/ArchivedRecords'
import PasswordVerificationDialog from '../src/components/PasswordVerificationDialog'

const state = window.archiveTest
const root = createRoot(document.getElementById('root'))
const pause = () => new Promise((resolve) => setTimeout(resolve, 30))
const check = (value, message) => { if (!value) throw new Error(message) }
async function waitFor(predicate, message) {
  for (let i = 0; i < 100; i++) { if (predicate()) return; await pause() }
  throw new Error(message)
}
const button = (text) => [...document.querySelectorAll('button')].find((item) => item.textContent.trim() === text)
async function click(text) { check(button(text), `Missing button: ${text}`); button(text).click(); await pause() }
async function input(selector, value) {
  const element = document.querySelector(selector)
  check(element, `Missing input: ${selector}`)
  const prototype = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value)
  element.dispatchEvent(new Event('input', { bubbles: true }))
  await pause()
}
export function App() {
  return <MemoryRouter initialEntries={['/records/archived']}>
    <Link to="/">Leave</Link>
    <Routes>
      <Route path="/" element={<Link to="/records/archived">Open archive</Link>} />
      <Route path="/records/archived" element={<ArchivedRecords />} />
    </Routes>
  </MemoryRouter>
}
async function mountArchive() {
  root.render(null)
  await pause()
  root.render(<App />)
  await waitFor(() => document.querySelector('input[type=password]'), 'Archive password popup missing')
}
async function unlock() {
  await input('input[type=password]', 'correct-password')
  await click('Verify')
  await waitFor(() => document.querySelector('[role=tab]'), 'Archive did not unlock')
  await waitFor(() => !document.querySelector('input[type=password]'), 'Password dialog did not close')
}

try {
  await mountArchive()
  check(state.reads === 0, 'Direct route queried archives before verification')
  check(!document.body.textContent.includes('Private Baptism'), 'Private name leaked before verification')
  await input('input[type=password]', 'wrong')
  await click('Verify')
  check(document.body.textContent.includes('Incorrect password'), 'Wrong-password error missing')
  check(state.reads === 0, 'Wrong password loaded archives')
  await unlock()
  for (const type of ['Baptism', 'Confirmation', 'Marriage', 'Death', 'Conversion']) {
    document.querySelectorAll('[role=tab]')[[ 'Baptism', 'Confirmation', 'Marriage', 'Death', 'Conversion' ].indexOf(type)].click()
    await waitFor(() => document.body.textContent.includes(`Private ${type}`), `${type} data missing`)
    await click('Recover')
    await waitFor(() => document.querySelector('[role=dialog]')?.textContent.includes(`Private ${type}`), 'Recovery identity missing')
    check(!document.querySelector('input[type=password]'), 'Recovery requested a second password')
    await input('textarea', '  \n ')
    await click('Confirm Recovery')
    check(document.body.textContent.includes('Recovery Reason is required'), 'Blank recovery reason accepted')
    check(!state.recoveries.some((entry) => entry.type === type.toLowerCase()), 'Blank reason wrote recovery')
    await input('textarea', '  Corrected archival error  ')
    await click('Confirm Recovery')
    await waitFor(() => !document.body.textContent.includes(`Private ${type}`), `${type} row remained after recovery`)
    check(state.recoveries.at(-1).reason.trim() === 'Corrected archival error', 'Recovery reason missing')
  }
  state.results.push('All five archive tabs: identity, required recovery reason, successful recovery, no second password')
  const reads = state.reads
  ;[...document.querySelectorAll('a')].find((element) => element.textContent === 'Leave').click()
  await pause()
  ;[...document.querySelectorAll('a')].find((element) => element.textContent === 'Open archive').click()
  await waitFor(() => document.querySelector('input[type=password]'), 'Re-entry did not lock')
  check(state.reads === reads, 'Re-entry read archives before verification')
  await unlock()
  await mountArchive()
  check(!document.querySelector('[role=tab]'), 'Fresh mount retained access')
  await unlock()
  state.auth.currentUser = { uid: 'different', email: 'different@example.test' }
  state.listeners.forEach((listener) => listener(state.auth.currentUser))
  await waitFor(() => document.querySelector('input[type=password]'), 'Account change did not lock')
  check(!document.querySelector('[role=tab]'), 'Account change retained private UI')
  await unlock()
  state.auth.currentUser = null
  state.listeners.forEach((listener) => listener(null))
  await waitFor(() => document.querySelector('input[type=password]'), 'Logout did not lock')
  state.results.push('Direct route/wrong password: zero archive reads; re-entry, remount, account change, logout: locked')

  state.auth.currentUser = { uid: 'staff', email: 'staff@example.test' }
  for (const type of ['Baptism', 'Confirmation', 'Marriage', 'Death', 'Conversion']) {
    let archivedReason = null
    root.render(<PasswordVerificationDialog key={type} open requireReason title={`Archive ${type}`}
      onVerified={(reason) => { archivedReason = reason }} />)
    await pause()
    await input('input[type=password]', 'correct-password')
    await input('textarea', '  \n ')
    await click('Verify')
    check(archivedReason === null && document.body.textContent.includes('Archive Reason is required'), 'Blank archive reason accepted')
    await input('textarea', '  Duplicate entry  ')
    await input('input[type=password]', 'wrong')
    await click('Verify')
    check(archivedReason === null, 'Wrong password archived record')
    await input('input[type=password]', 'correct-password')
    await click('Verify')
    check(archivedReason === 'Duplicate entry', 'Archive reason not trimmed/passed after verification')
  }
  state.results.push('Archive dialog for five types: blank reason blocked, wrong password blocked, trimmed reason delivered')
  document.getElementById('result').textContent = JSON.stringify({ passed: true, results: state.results })
} catch (error) {
  document.getElementById('result').textContent = JSON.stringify({ passed: false, error: error.stack })
}

// SPDX-FileCopyrightText: 2026 AG Technology Group LLC
// SPDX-License-Identifier: Apache-2.0

import { handlers } from "@/api/handlers"
import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, vi } from "vitest"

// Mock Web Storage (localStorage + sessionStorage).
//
// Node 26 ships its own Web Storage implementation and registers both globals,
// which shadow jsdom's under vitest (where `window === globalThis`). They fail
// in two different ways:
//
//   localStorage   — evaluates to `undefined` unless `--localstorage-file` is
//                    passed, so anything reading it throws
//                    `Cannot read properties of undefined` mid-render.
//   sessionStorage — works, but it is Node's `Storage`, not jsdom's. It is not
//                    `instanceof Storage`, so `vi.spyOn(Storage.prototype, ...)`
//                    silently never fires and assertions on it pass without
//                    testing anything.
//
// Fixing this in source (`window.localStorage.getItem`) does not help — the
// globals are the same objects — so both are replaced here.
//
// The implementation lives on `Storage.prototype` rather than a bespoke class
// so prototype spies keep working; a class mock would shadow it and reintroduce
// the silent-spy failure above. Backing stores are per-instance so the two
// storages stay independent.
const storageBackings = new WeakMap<Storage, Map<string, string>>()
const backing = (instance: Storage) => {
  let store = storageBackings.get(instance)
  if (!store) {
    store = new Map<string, string>()
    storageBackings.set(instance, store)
  }
  return store
}

Storage.prototype.getItem = function (this: Storage, key: string) {
  return backing(this).get(key) ?? null
}
Storage.prototype.setItem = function (
  this: Storage,
  key: string,
  value: string
) {
  backing(this).set(key, String(value))
}
Storage.prototype.removeItem = function (this: Storage, key: string) {
  backing(this).delete(key)
}
Storage.prototype.clear = function (this: Storage) {
  backing(this).clear()
}
Storage.prototype.key = function (this: Storage, index: number) {
  return Array.from(backing(this).keys())[index] ?? null
}
Object.defineProperty(Storage.prototype, "length", {
  configurable: true,
  get(this: Storage) {
    return backing(this).size
  },
})

const localStorageMock: Storage = Object.create(Storage.prototype)
const sessionStorageMock: Storage = Object.create(Storage.prototype)
for (const [name, value] of [
  ["localStorage", localStorageMock],
  ["sessionStorage", sessionStorageMock],
] as const) {
  Object.defineProperty(window, name, { writable: true, value })
  Object.defineProperty(globalThis, name, { writable: true, value })
}

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterAll(() => server.close())
afterEach(() => {
  localStorageMock.clear()
  sessionStorageMock.clear()
  server.resetHandlers()
  cleanup()
})

// Mock window.scrollTo
window.scrollTo = vi.fn()

// Mock Element.prototype.scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = ResizeObserverMock

// Mock IntersectionObserver
class IntersectionObserverMock {
  readonly root: Element | null = null
  readonly rootMargin: string = ""
  readonly thresholds: ReadonlyArray<number> = []
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn().mockReturnValue([])
}
global.IntersectionObserver = IntersectionObserverMock

// Mock URL.createObjectURL and URL.revokeObjectURL
URL.createObjectURL = vi.fn(() => "blob:mock-url")
URL.revokeObjectURL = vi.fn()

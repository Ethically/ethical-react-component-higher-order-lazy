import fs from 'fs'
import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'
import ethicalServer from 'ethical-utility-server'
import moduleSupplier from 'ethical-server-middleware-module-supplier'
import enableBrowserRequire from 'ethical-utility-require-browser'
import lazy from '../../src/index.js'

const startServer = ({ request = () => {} }) => (
    ethicalServer()
    .use(moduleSupplier({}))
    .listen()
    .then(destroyServer => {
        return new Promise(async resolve => {
            await request()
            resolve(destroyServer)
        })
    })
    .then(destroyServer => destroyServer())
)

const { window } = new JSDOM('')
const { document, navigator } = window

global.window = window
global.document = document
global.navigator = navigator
global.window.fetch = (path, options) => {
    nodefy()
    const url = 'http://localhost:8080' + path
    return (
        fetch(url, options)
        .then(response => {
            unnodefy()
            return response
        })
    )
}

const React = require('react')
const { mount } = require('enzyme')
const { renderToString } = require('react-dom/server')
const nodeProcess = process
const unnodefy = () => {
    process = { ...nodeProcess, versions: null }
    global.window = window
    global.document = document
    global.navigator = navigator
}
const nodefy = () => {
    process = nodeProcess
    global.window = null
}

describe('lazy()', () => {
    beforeAll(() => {
        enableBrowserRequire()
        unnodefy()
    })
    afterAll(() => {
        nodefy()
        delete global.document
        delete global.navigator
    })
    it('should lazily render a component', (done) => {
        const Lazy = lazy('~/test/files/dist/lazy.js')
        const request = () => {
            let lazyPromise
            const lazy = Lazy.prototype.loadComponent
            Lazy.prototype.loadComponent = function () {
                return lazyPromise = lazy.apply(this, arguments)
            }
            const wrapper = mount(<Lazy/>)
            expect(wrapper.html()).toBe(null)
            return (
                lazyPromise
                .then(() => {
                    expect(wrapper.html())
                    .toBe('<page>I was lazily loaded!</page>')
                })
            )
        }

        startServer({ request })
        .then(done)
        .catch(e => console.error(e))
    })
    it('should throw error if component is missing', (done) => {
        const consoleError = console.error
        console.error = jasmine.createSpy('consoleError')
        const Noop = lazy('~/test/files/dist/noop.js')
        const request = () => {
            let noopPromise
            const noop = Noop.prototype.loadComponent
            Noop.prototype.loadComponent = function () {
                return noopPromise = noop.apply(this, arguments)
            }
            mount(<Noop/>)
            return (
                noopPromise
                .then(({ message }) => {
                    expect(message.startsWith('Cannot find module')).toBe(true)
                    expect(console.error).toHaveBeenCalledTimes(2)
                    console.error = consoleError
                })
            )
        }

        startServer({ request })
        .then(done)
        .catch(e => console.error(e))
    })
    it('should accept a custom module path', (done) => {
        global.window.fetch = (path, options) => {
            expect(path.startsWith('/custom')).toBe(true)
            const mockModules = [{
                id: 0,
                key: '~/test/files/dist/noop.js',
                source: 'var hello = "World!"'
            }]
            return Promise.resolve({ json: () => mockModules })
        }

        const options = { path: 'custom' }
        const Noop = lazy('~/test/files/dist/noop.js', options)
        const request = () => mount(<Noop/>)

        startServer({ request })
        .then(done)
        .catch(e => console.error(e))
    })
})

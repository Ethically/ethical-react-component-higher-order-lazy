import React from 'react'
import { renderToString } from 'react-dom/server'
import asyncComponent from '../../src/index.js'

describe('asyncComponent()', () => {
    it('should render an asynchronous component', () => {
        const Lazy = asyncComponent('~/test/files/dist/lazy.js')
        const HTML = renderToString(<Lazy />)
        expect(HTML).toBe(
            '<page ' +
                'data-reactroot="" ' +
                'data-reactid="1" ' +
                'data-react-checksum="651171617"' +
            '>' +
                'I was lazily loaded!' +
            '</page>'
        )
    })
    it('should throw error if component is missing', () => {
        const Noop = asyncComponent('~/test/files/dist/noop.js')
        try {
            renderToString(<Noop />)
        } catch (e) {
            expect(e.message.startsWith('Cannot find module')).toBe(true)
        }
    })
})

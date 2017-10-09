import React from 'react'
import PropTypes from 'prop-types'
import isNode from 'ethical-utility-is-node'
import { requireModule, getRequire } from 'ethical-utility-resolve-module'

const lazy = (filename, config = { path: 'module' }) => {

    class Lazy extends React.Component {
        state = {
            Component: null,
            loading: null
        }
        loadComponent() {
            const { path } = config
            const { ids } = getRequire()
            return (
                getRequire()
                .load(`/${path}?entry=${filename}&exclude=${ids.toString()}`)
                .then(() => this.resolveComponent())
                .catch(e => {
                    console.error(e)
                    return e
                })
            )
        }
        resolveComponent() {
            try {
                const module = requireModule(filename)
                const Component = module.default
                Lazy.Component = Component
                this.setState({ Component })
            } catch (e) {
                if (!isNode() && e.code === 'MODULE_NOT_FOUND') {
                    const { loading } = this.state
                    if (loading === filename) {
                        throw e
                    }
                    this.setState({ loading: filename })
                    return this.loadComponent()
                }
                throw e
            }
        }
        componentWillMount() {
            this.resolveComponent()
        }
        render() {
            const { Component } = this.state
            if (!Component) return null
            return <Component {...this.props} />
        }
    }

    Lazy.contextTypes = {
        promises: PropTypes.func
    }

    return Lazy
}

export default lazy

const hypercore = require('hypercore')

const callbackMethods = require('./callback-methods')

const kHypercore = Symbol('kHypercore')

class HypercorePromise {
  constructor (...args) {
    let feed
    if (args.length === 1 && args[0].get && args[0].append) {
      feed = args[0]
    } else {
      feed = hypercore(...args)
    }

    this._cache = {}

    return new Proxy(feed, this)
  }

  get (target, propKey) {
    if (propKey === kHypercore) return target

    const value = Reflect.get(target, propKey)
    if (typeof value === 'function') return this._callFunction(target, propKey, value)
    return value
  }

  _callFunction (target, propKey, func) {
    let handler = this._cache[propKey]

    if (handler) return handler

    if (callbackMethods.includes(propKey)) {
      handler = (...args) => {
        // We keep suporting the callback style if we get a callback.
        if (typeof args[args.length - 1] === 'function') {
          return Reflect.apply(func, target, args)
        }

        return new Promise((resolve, reject) => {
          args.push((err, ...result) => {
            if (err) return reject(err)
            if (result.length > 1) {
              resolve(result)
            } else {
              resolve(result[0])
            }
          })

          Reflect.apply(func, target, args)
        })
      }
    } else {
      handler = (...args) => Reflect.apply(func, target, args)
    }

    this._cache[propKey] = handler

    return handler
  }
}

module.exports = (...args) => new HypercorePromise(...args)
module.exports.HypercorePromise = HypercorePromise
module.exports.getHypercore = hypercorePromise => hypercorePromise[kHypercore]

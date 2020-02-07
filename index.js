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

    return new Proxy(feed, this)
  }

  get (target, propKey) {
    if (propKey === kHypercore) return target

    const value = Reflect.get(target, propKey)
    if (callbackMethods.includes(propKey)) return this._buildCallbackPromise(target, propKey, value)
    if (typeof value === 'function') return (...args) => Reflect.apply(value, target, args)
    return value
  }

  _buildCallbackPromise (target, propKey, func) {
    return (...args) => {
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
  }
}

module.exports = (...args) => new HypercorePromise(...args)
module.exports.getHypercore = hypercorePromise => hypercorePromise[kHypercore]

//jshint -W033
//jshint -W018
//jshint  esversion: 11
const pull = require('pull-stream')
const win = require('pull-window')

module.exports = function(deltaT) {
  let current = null
  let next = []

  return win(startf, mapf)

  function startf(data, cb) {
    if (current) return 
    current = next

    return function add(end, data) {
      if (end) return cb(end, current)
      if (!current.length) return current.push(data)

      const [ts0] = current[0]
      const [ts] = data
      
      if (ts - ts0 <= deltaT) {
        current.push(data)
      } else {
        next = [data]
        cb(null, current)
        current = null
      }
    }
  }

  function mapf(start, data) {
    return data
  }
}

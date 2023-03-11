//jshint -W033
//jshint -W018
//jshint  esversion: 11
const pull = require('pull-stream')
const deepEqual = require('deep-equal')

module.exports = function(equal) {
  if (!equal) equal = defaultEqual
  return pull.map(items=>{
    return items.reduce( (acc, item)=>{
      const slot = acc.find(x=>equal(x, item))
      if (!slot) {
        if (acc.length) {
          // force the new slot's timestamp
          // to be the same as the first's
          item[0] = acc[0][0]
        }
        acc.push(item)
        return acc
      }
      const n = slot.slice(-1)[0] + item.slice(-1)[0]
      slot[slot.length-1] = n
      return acc
    }, [])
  })
}

function defaultEqual(x, y) {
  const a = x.slice(1, x.length-1)
  const b = y.slice(1, y.length-1)
  return deepEqual(a, b)
}

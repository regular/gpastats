//jshint -W033
//jshint  esversion: 11
const Reduce = require('flumeview-reduce')
const fingerprint = require('code-fingerprint')

function FPReduce(f) {
  const sha = fingerprint(`${f}`)
  return Reduce(sha, f)
}

const viewName = 'gpa_status'

module.exports = function(db, routes) {

  db.use(viewName, FPReduce((acc, item) => {
    acc = acc || {}
    const {timestamp} = item.data
    if (!timestamp) return acc

    if (item.type == '__since') {
      acc.latest_update = timestamp
    } else {
      acc.newest_record = timestamp
    }
    const count = item.data.count || 1
    acc.events = (acc.events || 0) + count
    acc.records = (acc.records || 0) + 1
    return acc
  }))

  routes.add('/status', (req, res)=>{
    db[viewName].get((err, value) => {
      if (err) return res.end(500, err.message)
      const s = JSON.stringify(value, null, 2)
      res.end(s)
    })
  })
}

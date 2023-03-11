//jshint -W033
//jshint  esversion: 11
const Reduce = require('flumeview-reduce')
const fingerprint = require('code-fingerprint')

function FPReduce(f) {
  const sha = fingerprint(`${f}`)
  return Reduce(sha, f)
}

module.exports = function(db, routes, conf) {
  const u = require('./util')(conf)

  db.use('gpa_devices', FPReduce((acc, item) => {
    if (item.type !== 'appInfo') return acc
    const key = item.data.device || 'n/a'
    return u.add(acc, item.data, key)
  }))

  routes.add('/devices', (req, res)=>{
    db.gpa_devices.get((err, value) => {
      if (err) return res.end(500, err.message)
      const key = u.keyFromPath(req.url)
      value = value[key] || []
      res.end(u.format(value, {
        comment: `Device used (${key})`,
        sort: (a,b)=>b[1]-a[1]
      }))
    })
  })
}

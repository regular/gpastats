//jshint -W033
//jshint  esversion: 11
const Reduce = require('flumeview-reduce')
const fingerprint = require('code-fingerprint')

function FPReduce(f) {
  const sha = fingerprint(`${f}`)
  return Reduce(sha, f)
}

module.exports = function(db, routes) {

  db.use('gpa_devices', FPReduce((acc, item) => {
    if (item.type !== 'appInfo') return acc
    acc = acc || {}
    const device = item.data.device || 'n/a'
    acc[device] = (acc[device] || 0) + (item.data.count || 1)
    return acc
  }))

  routes.add('/devices', (req, res)=>{
    db.gpa_devices.get((err, value) => {
      if (err) return res.end(500, err.message)
      const entries = Object.entries(value).sort( (a,b)=>b[1]-a[1])
      const ts = entries.map(([a,b])=>`${a}\t${b}`)
      const s = ts.join('\n')
      res.end(s)
    })
  })
}

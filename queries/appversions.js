//jshint -W033
//jshint  esversion: 11
const Reduce = require('flumeview-reduce')
const fingerprint = require('code-fingerprint')
const {DateTime} = require('luxon')

function FPReduce(f) {
  const sha = fingerprint(`${f}`)
  return Reduce(sha, f)
}

const viewName = 'gpa_appversions'

module.exports = function(db, routes, conf) {

  db.use(viewName, FPReduce((acc, item) => {
    if (item.type !== 'appInfo') return acc
    acc = acc || {}
    
    const seconds = item.data.timestamp / 1000
    const dt = DateTime.fromSeconds(seconds).setZone(conf.tz)
    const [yyyy,mm,dd] = dt.toISODate().split('-')

    const timeKey = `${yyyy}-${mm}`
    const slot = acc[timeKey] || {}

    const count = item.data.count || 1
    const key = item.data.appVersion || 'n/a'
    slot[key] = (slot[key] || 0) + count
    acc[timeKey] = slot
    return acc
  }))

  routes.add('/appversions', (req, res)=>{
    db[viewName].get((err, value) => {
      if (err) return res.end(500, err.message)

      /*
      const entries = Object.entries(value).sort( (a,b)=>b[1]-a[1])
      const ts = entries.map(([a,b])=>`${a}\t${b}`)
      const s = ts.join('\n')
      res.end(s)
      */
      res.end(JSON.stringify(value, null, 2))
    })
  })
}

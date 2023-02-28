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
  const u = require('./util')(conf)

  db.use(viewName, FPReduce((acc, item) => {
    if (item.type !== 'appInfo') return acc
    const key = item.data.appVersion || 'n/a'
    return u.add(acc, item.data, key)
  }))

  routes.add('/appversions', (req, res)=>{
    db[viewName].get((err, value) => {
      if (err) return res.end(500, err.message)
      const key = u.keyFromPath(req.url)
      value = value[key]
      res.end(u.format(value, {
        comment: `App Versions (${key})`,
        sort: (a,b)=>b[1]-a[1]
      }))
      //res.end(JSON.stringify(value, null, 2))
    })
  })
}

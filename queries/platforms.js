//jshint -W033
//jshint  esversion: 11
const Reduce = require('flumeview-reduce')
const fingerprint = require('code-fingerprint')

function FPReduce(f) {
  const sha = fingerprint(`${f}`)
  return Reduce(sha, f)
}

const viewName = 'gpa_platforms'

module.exports = function(db, routes, conf) {
  const u = require('./util')(conf)

  db.use(viewName, FPReduce((acc, item) => {
    if (item.type !== 'appInfo') return acc
    const key = item.data.platform || 'n/a'
    return u.add(acc, item.data, key)
  }))

  routes.add('/platforms', (req, res)=>{
    db[viewName].get((err, value) => {
      if (err) return res.end(500, err.message)
      const key = u.keyFromPath(req.url)
      value = value[key] || []
      res.end(u.format(value, {
        comment: `Device platforms used (${key})`,
        sort: (a,b)=>b[1]-a[1]
      }))
    })
  })
}

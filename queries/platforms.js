//jshint -W033
//jshint  esversion: 11
const Reduce = require('flumeview-reduce')
const fingerprint = require('code-fingerprint')

function FPReduce(f) {
  const sha = fingerprint(`${f}`)
  return Reduce(sha, f)
}

const viewName = 'gpa_platforms'

module.exports = function(db, routes) {

  db.use(viewName, FPReduce((acc, item) => {
    if (item.type !== 'appInfo') return acc
    acc = acc || {}
    const count = item.data.count || 1
    const key = item.data.platform || 'n/a'
    acc[key] = (acc[key] || 0) + count
    return acc
  }))

  routes.add('/platforms', (req, res)=>{
    db[viewName].get((err, value) => {
      if (err) return res.end(500, err.message)
      const entries = Object.entries(value).sort( (a,b)=>b[1]-a[1])
      const ts = entries.map(([a,b])=>`${a}\t${b}`)
      const s = ts.join('\n')
      res.end(s)
    })
  })
}

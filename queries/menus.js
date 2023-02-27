//jshint -W033
//jshint  esversion: 11
const Reduce = require('flumeview-reduce')
const fingerprint = require('code-fingerprint')
const {DateTime} = require('luxon')
const multicb = require('multicb')

function FPReduce(f) {
  const sha = fingerprint(`${f}`)
  return Reduce(sha, f)
}

const viewName = 'gpa_menu'

module.exports = function(db, routes, conf) {

  db.use(viewName, FPReduce((acc, item) => {
    if (item.type !== 'menuSection' && item.type !== 'menuSectionItem') return acc
    acc = acc || {}
    const {verb, locale, entitySuuid} = item.data
    if (verb !== 'SELECTED') return acc

    const count = item.data.count || 1
    const key = entitySuuid || 'n/a'
    acc[key] = (acc[key] || 0) + count
    return acc
  }))

  routes.add('/menus', (req, res)=>{
    const done = multicb({pluck: 1, spread: true})
    db[viewName].get(done())
    db.suuids.get(done())
    done((err, value, entities)=>{
      if (err) return res.end(500, err.message)

      const entries = Object.entries(value).sort( (a,b)=>b[1]-a[1])
      const ts = entries.map(([a,b])=>{
        const entity = entities[a] || {}
        const {pname, type} = entity
        return `${a}\t${b}\t${type}\t${pname}`
      })
      const s = ts.join('\n')
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end(s)
    })
  })
}

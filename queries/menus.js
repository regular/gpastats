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
  const u = require('./util')(conf)

  db.use(viewName, FPReduce((acc, item) => {
    if (item.type !== 'menuSection' && item.type !== 'menuSectionItem') return acc
    const {verb, entitySuuid} = item.data
    if (verb !== 'SELECTED') return acc

    const key = entitySuuid || 'n/a'
    return u.add(acc, item.data, key)
  }))

  routes.add('/menus', (req, res)=>{
    const done = multicb({pluck: 1, spread: true})
    db[viewName].get(done())
    db.suuids.get(done())
    done((err, value, entities)=>{
      if (err) return res.end(500, err.message)

      const key = u.keyFromPath(req.url)
      value = value[key] || []
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end(u.format(value, {
        comment: `Menu Selections (${key})`,
        fields: ['suuid', 'count', 'type', 'name'],
        sort: (a,b)=>b[1]-a[1],
        map: ([id, cnt])=>{
          const entity = entities[id] || {}
          const {pname, type} = entity
          return `${id}\t${cnt}\t${type}\t${pname}`
        }
      }))
    })
  })
}

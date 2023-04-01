//jshint -W033
//jshint  esversion: 11
const pull = require('pull-stream')
const toStream = require('pull-stream-to-stream')
const {DateTime} = require('luxon')
const {parse} = require('url')
const qs = require('querystring')

const Views = require('./views')

module.exports = function(db, routes, conf) {
  const parentView = Views(db, conf)

  routes.add('/v3', (req, res)=>{
    const {pathname, query} = parse(req.url)
    const [_, __, idx] = pathname.split('/')
    console.error('v3: reading index', idx, 'query', query)
    const params = qs.parse(query)
    let {sum, from, to} = params
    
    try {
      if (from) {
        parseDate(from)
      } else from = null // needs to be null (used as gte)
      if (to) {
        parseDate(to)
      } else to = undefined // needs to be undefined (used as lt)
    } catch(e) {
      res.statusCode = 403
      res.end(e.message)
      return
    }
    const postfix = {
      byYear: 'by_year',
      byMonth: 'by_month',
      byDay: 'by_day',
      byHour: 'by_hour'
    }

    if (sum && !postfix[sum]) {
      res.statusCode = 403
      res.end('Invaid value for "sum": ' + sum)
      return
    }

    const pf = postfix[sum] || 'by_month'
    const viewName = `${idx}_${pf}`
    console.error('viewName', viewName)

    db.suuids.get( (err, suuids) =>{
      if (err) return res.end(err.message)
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')

      const source = pull(
        parentView[viewName].read({
          gte: from,
          lt: to,
          keys: true,
          values: false,
          seqs: true
        }),
        pull.map(item=>{
          const date = item.key
          const value = item.seq // TODO
          const rows = makeRows(date, value)
          return rows
        }),
        pull.flatten(),
        pull.map(row=>{
          row = row.replace(/[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}/, id=>{
            return (suuids[id] || {}).pname || id
          })
          row += '\r\n'
          return row
        })
      )
      toStream.source(source).pipe(res)
    })
  })


  function parseDate(s) {
    const d = DateTime.fromISO(s).setZone(conf.tz)
    if (!d.isValid) throw new Error('invalid date')
    return d
  }
}

function makeRows(date, value) {
  const entries = Object.entries(value).sort( (a,b)=>{
    return b[1] - a[1]
  })
  return entries.map( ([key, count])=>{
    return `${date}\t${key}\t${count}`
  })
}

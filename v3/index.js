//jshint -W033
//jshint  esversion: 11
const pull = require('pull-stream')
const toStream = require('pull-stream-to-stream')
const {DateTime} = require('luxon')
const {parse} = require('url')
const qs = require('querystring')

const addViews = require('./views')

module.exports = function(db, routes, conf) {
  addViews(db, conf)

  routes.add('/v3', (req, res)=>{
    const {pathname, query} = parse(req.url)
    const [_, __, idx] = pathname.split('/')
    console.error('v3: reading index', idx, 'query', query)
    const params = qs.parse(query)
    let {sum, from, to} = params
    
    const postfix = {
      byYear: {pf:'by_year', keyLength:4},
      byMonth: {pf:'by_month', keyLength:7},
      byDay: {pf:'by_day', keyLength:10},
      byHour: {pf:'by_hour', keyLength:13},
      byMonthWeekday: {pf:'by_month-weekday', keyLength:7, nested: 1},
      byYearWeekday: {pf:'by_year-weekday', keyLength:4, nested: 1},
    }

    if (sum && !postfix[sum]) {
      res.statusCode = 403
      res.end('Invaid value for "sum": ' + sum)
      return
    }

    const {pf, keyLength, nested} = postfix[sum] || postfix.byMonth
    const viewName = `gpav3_${idx}_${pf}`
    if (!db[viewName]) {
      res.statusCode = 403
      res.end(`query "${viewName}" not supported`)
      return
    }
    try {
      if (from) {
        checkDate(from)
        from = fixLength(from, keyLength)
      } else from = null // needs to be null (used as gte)
      if (to) {
        checkDate(to)
        to = fixLength(to, keyLength)
      } else to = undefined // needs to be undefined (used as lt)
    } catch(e) {
      res.statusCode = 403
      res.end(e.message)
      return
    }
    console.error('viewName', viewName, 'from', from, 'to', to)

    db.suuids.get( (err, suuids) =>{
      if (err) return res.end(err.message)
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')

      /*
      db[viewName].since( s=>{
        console.log(s, '/', db.since.value)
      })
      */
      
      const source = pull(
        db[viewName].read({
          gte: from,
          lt: to,
          keys: true,
          values: true,
          since: -1
        }),
        pull.map(item=>{
          const date = item.key
          const value = item.value
          const rows = makeRows(date, value, nested)
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


  function checkDate(s) {
    const d = DateTime.fromISO(s)
    if (!d.isValid) throw new Error('invalid date')
  }
}

function fixLength(d, l) {
  const s = '1970-01-01T00'
  return (d + s.slice(d.length)).slice(0, l)
}

function makeRows(date, value, nested) {
  if (nested) {
    let result = []
    for (const key of Object.keys(value).sort()) {
      result = result.concat(makeRows(`${date}@${key}`, value[key], nested - 1))
    }
    return result
  }
  const entries = Object.entries(value).sort( (a,b)=>{
    return b[1] - a[1]
  })
  return entries.map( ([key, count])=>{
    return `${date}\t${key}\t${count}`
  })
}

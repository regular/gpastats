//jshint -W033
//jshint  esversion: 11
const { DateTime } = require('luxon')

const Reduce = require('flumeview-reduce')
const fingerprint = require('code-fingerprint')

function FPReduce(f) {
  const sha = fingerprint(`${f}`)
  return Reduce(sha, f)
}

const viewName = 'gpa_status'

module.exports = function(db, routes, conf) {

  db.use(viewName, FPReduce((acc, item) => {
    acc = acc || {}
    const {timestamp} = item.data
    if (!timestamp) return acc

    if (item.type == '__since') {
      acc.latest_update = Math.max(acc.latest_update, timestamp)
    } else {
      acc.newest_record = Math.max(acc.newest_record, timestamp)
    }
    const count = item.data.count || 1
    acc.events = (acc.events || 0) + count
    acc.records = (acc.records || 0) + 1
    return acc
  }))

  routes.add('/status', (req, res)=>{
    db[viewName].get((err, acc) => {
      if (err) return res.end(500, err.message)
      const s = [
        `requested until: ${formatTimestamp(acc.latest_update)}`,
        `newest record: ${formatTimestamp(acc.newest_record)}`,
        `${acc.events} events in ${acc.records} records (bins)`
      ]
      res.end(s.join('\n'))
    })
  })

  function formatTimestamp(ts) {
    const t = DateTime.fromSeconds(ts/1000).setZone(conf.tz)
    return t.setLocale('de').toLocaleString(DateTime.DATETIME_MED)
  }
}


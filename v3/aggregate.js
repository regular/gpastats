//jshint  esversion: 11, -W033, -W018
const { DateTime } = require('luxon')

module.exports = function(conf, N, extract, opts) {
  opts = opts || {}

  return {
    fitsBucket,
    add
  }

  function key(data) {
    const ts = data.timestamp / 1000
    const dt = DateTime.fromSeconds(ts).setZone(conf.tz)
    let k = dt.toISO().slice(0, N)
    if (opts.weekday) k = k + `@${dt.weekday}${dt.weekdayShort}`
    return k
  }

  function fitsBucket(bucket, {type, data}) {
    return key(data) == bucket.key
  }

  function add(bucket, {data}) {
    bucket = bucket || {
      key: key(data),
      value: {}
    }
    const p = extract(data)
    const count = data.count || 1
    const n = (bucket.value[p] || 0) + count
    bucket.value[p] = n
    return bucket
  }
}


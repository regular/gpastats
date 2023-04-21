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
    const subkey = opts.weekday ? `${dt.weekday}-${dt.weekdayShort}` : undefined
    return {key: k, subkey}
  }

  function fitsBucket(bucket, {type, data}) {
    return key(data).key == bucket.key
  }

  function add(bucket, {data}) {
    bucket = bucket || {
      key: key(data).key,
      value: {}
    }
    const p = extract(data)
    const count = data.count || 1

    let v = bucket.value
    if (opts.weekday) {
      const sk = key(data).subkey
      let sub = v[sk]
      if (!sub) sub = v[sk] = {}
      v = sub
    }

    const n = (v[p] || 0) + count
    v[p] = n
    return bucket
  }
}


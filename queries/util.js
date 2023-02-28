//jshint -W033
//jshint  esversion: 11
const {DateTime} = require('luxon')

module.exports = function(conf) {
  return {format, keyFromPath, add}

  function format(value, opts) {
    opts = opts || {}
    const sortf = opts.sort 
    const mapf = opts.map || ( ([a, b])=>`${a}\t${b}`)
    const fields = opts.fields || ['value', 'count']
    const comment = opts.comment
    let entries = Object.entries(value)
    if (sortf) entries = entries.sort(sortf)
    const ts = (comment ? [`# ${comment}`] : []).concat([fields.join('\t')].concat(entries.map(mapf)))
    const s = ts.join('\r\n')
    return s
  }

  function keyFromPath(path) {
    const match = path.match(/\/(\w+)(\/(\d{4})(\/(\d{2}))?)?/)
    if (!match) return
    const [_0, prefix, _2, year, _4, month] = match
    if (!year) return 'alltime'
    if (!month) return year
    return `${year}-${month}`
  }
  function add(acc, data, key) {
    acc = acc || {}

    const seconds = data.timestamp / 1000
    const dt = DateTime.fromSeconds(seconds).setZone(conf.tz)
    const [yyyy,mm,dd] = dt.toISODate().split('-')

    store(acc, 'alltime', data)
    store(acc, `${yyyy}`, data)
    store(acc, `${yyyy}-${mm}`, data)
    return acc

    function store(acc, timeKey, data) {
      const slot = acc[timeKey] || {}
      const count = data.count || 1
      slot[key] = (slot[key] || 0) + count
      acc[timeKey] = slot
      return acc
    }
  }
}


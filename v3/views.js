//jshint esversion: 11, -W033, -W083

const pull = require('pull-stream')
const Aggregate = require('flumeview-level-aggregate')

const aggregate = require('./aggregate')
const viewDefs = require('./view-defs')

module.exports = function(db, conf) {
  const buckets = {
    hour: 'yyyy-mm-ddThh'.length,
    day: 'yyyy-mm-dd'.length,
    month: 'yyyy-mm'.length,
    year: 'yyyy'.length
  }

  for (let [bucket, N] of Object.entries(buckets)) {
    for (let name of Object.keys(viewDefs)) {
      const {filter, extract} = viewDefs[name]
      addView(`gpav3_${name}_by_${bucket}`, N, filter, extract)
    }
  }
  const {filter, extract} = viewDefs.zone
  addView('gpav3_zone_by_month-weekday', 7, filter, extract, {
    weekday: true,
    version: 2
  }) 
  addView('gpav3_zone_by_year-weekday', 4, filter, extract, {
    weekday: true,
    version: 2
  }) 

  function addView(name, N, filter, extract, opts) {
    opts = opts || {}
    const version = opts.version || 1
    const {add, fitsBucket} = aggregate(conf, N, extract, opts)
    db.use(
      name,
      Aggregate(1, fitsBucket, add, {
        filter,
        timeout: 100,
        assert_monotonic: value => {
          return value.data && value.data.timestamp
        }
      })
    )
  }

}

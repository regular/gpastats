//jshint esversion: 11, -W033

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
      const {add, fitsBucket} = aggregate(conf, N, extract)
      db.use(
        `gpav3_${name}_by_${bucket}`,
        Aggregate(1, fitsBucket, add, {filter, timeout: 100})
      )
    }
  }
}

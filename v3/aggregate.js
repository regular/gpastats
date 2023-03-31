//jshint -W033
//jshint -W018
//jshint  esversion: 11

const pull = require('pull-stream')
const agg = require('flumeview-level-aggregate/stream')

// N number of characters to be used from ISO timestamp
// 4 == yyyy
// 7 == yyyy-mm
// ...
//
module.exports = function(TYPE, N) {
  return function() {
    return pull(
      agg(fitsBucket, add, 1000)
    )
  }

  /* items look like this:

  {
    key: [ 312685635, 'platform', '2023-03-24T15', 'ANDROID', 1 ],
    seq: 312685635
  }

  */

  function fitsBucket(bucket, item) {
    const {key, seq} = item
    const [seq_, type, time, data, count] = key
    
    // if this is not our type, we do not
    // start a new bucket. Instead, we update its seq 
    if (type !== TYPE) return true
    return bucket.keys[0] == time.slice(0, N)
  }

  function add(bucket, item) {
    bucket = bucket || {
      seq: 0,
      keys: [],
      value: {}
    }
    const {key, seq} = item
    const [seq_, type, time, data, count] = key
    if (type == TYPE) {
      if (!bucket.keys.length) bucket.keys = [time.slice(0, N)]
      const n = (bucket.value[data] || 0) + count
      bucket.value[data] = n
    }
    bucket.seq = seq
    return bucket
  }
}

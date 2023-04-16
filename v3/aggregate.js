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
  return function(meta) {
    console.log('meta', meta)
    const c = meta &&  meta.continuation
    let initial
    if (c) {
      initial = Object.assign({}, c, {seq: meta.since, keys: [c.key]})
      delete initial.type
      delete initial.key
    }
    console.log('agg stream init', initial)
    return pull(
      pull.through(x=>{
        console.log('> agg stream', x)
      }),
      agg(fitsBucket, add, {timeout:100, initial, filter}),
      pull.through(x=>{
        console.log('< agg stream', x)
      })
    )
  }

  /* items look like this:

  {
    key: [ 312685635, 'platform', '2023-03-24T15', 'ANDROID', 1 ],
    seq: 312685635
  }

  */

  function filter(item) {
    const {key, seq} = item
    const [seq_, type, time, data, count] = key
    return type == TYPE
  }

  function fitsBucket(bucket, item) {
    console.log('fits', item)
    const {key, seq} = item
    const [seq_, type, time, data, count] = key
    return bucket.keys[0] == time.slice(0, N)
  }

  function add(bucket, item) {
    console.log('add', item)
    bucket = bucket || {
      seq: -1,
      keys: [],
      value: {}
    }
    if (item.seq <= bucket.seq) {
      // apparently, we get the same record twice on occasion,
      // even though it is written just once. Is this a bug in the
      // leveldb stack?
      console.log('ignore item?', item)
      //return bucket
    }
    const {key, seq} = item
    const [seq_, type, time, data, count] = key
    if (!bucket.keys.length) bucket.keys = [time.slice(0, N)]
    const n = (bucket.value[data] || 0) + count
    bucket.value[data] = n
    bucket.seq = seq
    console.log('new bucket', bucket)
    return bucket
  }
}

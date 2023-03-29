//jshint -W033
//jshint -W018
//jshint  esversion: 11

const pull = require('pull-stream')
const agg = require('../../flumeview-level-aggregate/stream')

module.exports = function() {
  return pull(
    pull.through(x=>{
      console.log('bymonth src', x)
    }),
    agg(fitsBucket, add, 1000),
    pull.through(x=>{
      console.log('bymonth', x)
    })
  )
}

  /* items look like this:

  {
    key: '2023-03-24T15'
    seq: { ANDROID: 134, IOS: 1 }
  }

  */

function bucketId(time) {
  return time.slice(0, 7)
}

function fitsBucket(bucket, item) {
  const {key, seq} = item
  
  return bucket.keys[0] == bucketId(key)
}

function add(bucket, item) {
  bucket = bucket || {
    seq: 0,
    keys: [],
    value: {}
  }
  const {key, seq} = item
  const value = seq // TODO
  if (!bucket.keys.length) bucket.keys = [bucketId(key)]
  for(let [name, count] of Object(value).entries()) {
    const n = (bucket.value[name] || 0) + count
    bucket.value[name] = n
  }
  bucket.seq = seq
  return bucket
}

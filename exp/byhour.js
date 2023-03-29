//jshint -W033
//jshint -W018
//jshint  esversion: 11

const pull = require('pull-stream')
const agg = require('../../flumeview-level-aggregate/stream')

module.exports = function() {
  return pull(
    agg(fitsBucket, add, 1000),
    pull.through(x=>{
      //console.log('transform2', x)
    })
  )
}

  /* items look like this:

  {
    key: [ 312685635, 'platform', '2023-03-24T15', 'ANDROID', 1 ],
    seq: 312685635
  }

  or (in dependent views)

  {
    key: '2023-03-24T15'
    seq: { ANDROID: 134, IOS: 1 }
  }

  */

function fitsBucket(bucket, item) {
  const {key, seq} = item
  const [seq_, type, time, data, count] = key
  
  // if this is not our type, we do not
  // start a new bucket. Instead, we update its seq 
  if (type !== 'platform') return true
  return bucket.keys[0] == time
}

function add(bucket, item) {
  //console.log('add', item)
  bucket = bucket || {
    seq: 0,
    keys: [],
    value: {}
  }
  const {key, seq} = item
  const [seq_, type, time, data, count] = key
  if (type == 'platform') {
    if (!bucket.keys.length) bucket.keys = [time]
    const n = (bucket.value[data] || 0) + count
    bucket.value[data] = n
  }
  bucket.seq = seq
  return bucket
}

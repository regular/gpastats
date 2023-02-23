//jshint -W033
//jshint -W018
//jshint  esversion: 11

const pull = require('pull-stream')
const pullLooper = require('pull-looper')
const bufferUntil = require('pull-buffer-until')

const { DateTime } = require('luxon')
const { inspect } = require('util')

const OffsetLog = require('flumelog-offset')
const offsetCodecs = require('flumelog-offset/frame/offset-codecs')
const codec = require('flumecodec')
const Reduce = require('flumeview-reduce')
const Flume = require('flumedb')

const stream = require('../gpafollow')

const conf = require('rc')('gpastats', {
  rqdelay: 10000,
  startday: '2021-08-11',
  blacklist: [],
  minage: {days: 3},
  tz: 'Europe/Berlin'
})

const db = Flume(OffsetLog(__dirname + '/data/flume.log', {
  codec: codec.json,
  offsetCodec: offsetCodecs[48]
}))
db.use('continuation', Reduce(1, (acc, item) => {
  if (item.type !== '__since') return acc
  return Math.max(acc || 0, item.data.timestamp)
}))
db.use('gpa_devices', Reduce(2, (acc, item) => {
  if (item.type !== 'appInfo') return acc
  acc = acc || {}
  const device = item.data.device || 'n/a'
  acc[device] = (acc[device] || 0) + (item.data.count || 1)
  return acc
}))
 
db.continuation.get((err, value) => {
  if (err) {
    console.error('Unable to read continuation value:', err.message)
    process.exit(1)
  }
  console.error('continuation value is', formatTimestamp(value))
  conf.continuation = value

  pull(
    stream(conf),
    pullLooper,
    bufferUntil( buff=>{
      return buff[buff.length-1].type == '__since'
    }),
    pull.asyncMap( (items, cb) => {
      console.log(items)
      db.append(items, (err, seq) => {
        if (err) return cb(err)
        db.continuation.get((err, value) => {
          if (err) return cb(err)
          console.error('new continuation value:', formatTimestamp(value))
          cb(null, seq)
        })
      })
    }),
    pull.onEnd(err=>{
      if (err) {
        console.error('-- STREAM ABORT')
        console.error(inspect(err, {depth: 6, colors: true}))
      }
    })
  )
})

import('./https-server.mjs').then(Server=>{
  Server.create({
    domains: conf.domains
  }, handler, ()=>{
    console.log('https server is listening')
  })

  function handler(request, response) {
    db.gpa_devices.get((err, value) => {
      if (err) return response.end(500, err.message)
      const entries = Object.entries(value).sort( (a,b)=>b[1]-a[1])
      const ts = entries.map(([a,b])=>`${a}\t${b}`)
      const s = ts.join('\n')
      response.end(s)
    })
  }
})

// -- util

function formatTimestamp(ts) {
  const t = DateTime.fromSeconds(ts/1000).setZone(conf.tz)
  return t.setLocale('de').toLocaleString(DateTime.DATETIME_MED)
}

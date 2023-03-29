//jshint -W033
//jshint -W018
//jshint  esversion: 11

const pull = require('pull-stream')

const { DateTime } = require('luxon')
const { inspect } = require('util')
const { join } = require('path')

const OffsetLog = require('flumelog-offset')
const offsetCodecs = require('flumelog-offset/frame/offset-codecs')
const codec = require('flumecodec')
const FlumeTransform = require('../../flumeview-level-transform')
const Flume = require('flumedb')

const ViewDriver = require('../../flumedb-view-driver')

const log = OffsetLog(join(__dirname, '..', 'data', 'flume.log'), {
  codec: codec.json,
  offsetCodec: offsetCodecs[48]
})
const db = Flume(log)
db.use('testing', FlumeTransform(1, transform))

/*
db.testing.since( x=>{
  console.log('testing is at', x)
})
*/
log.since( x=>{
  console.log('log is at', x)
})

const use = ViewDriver(db, log, (sv, opts)=>{
  console.log(`source opts for ${sv.name}`, opts)

  return pull(
    db[sv.parent].read(Object.assign({}, opts, {
      gt: [opts.gt, undefined],
      live: true,
      keys: true,
      values: false,
      sync: false
    })),
    pull.map(x=>{
      if (x.key.length==1 && x.key[0] == undefined) {
        return {since: x.seq.since}
      }
      return x
    })
  )
})

const hourView = use('hourView', FlumeTransform(1, require('./byhour')))
hourView.parent = 'testing'

hourView.since( x=>{
  console.log('hourView is at', x)
})

db.hourView = hourView
const monthView = use('monthView', FlumeTransform(1, require('./bymonth')))
monthView.parent = 'hourView'

pull(
  monthView.read({
    //since: -1, // don't wait (workaround)
    keys: true,
    seqs: true,
    values: false,
    live: false,
    sync: false
  }),
  pull.log()
)


/* WARNING!
 * errors (even typos) cause the stream to end and NO ERROR MESSAGE
 * to be displayed whatsoever. I guess flumedb and/or pull-writer are 
 * responsible for catching and ignoring errors.
*/

function transform() {
  return pull(
    pull.map( ({value, seq}) => {
      const {type, data} = value
      if (type !== 'appInfo') {
        return {seq, keys: []}
      }
      let {timestamp, count} = data
      timestamp /= 1000
      count = count || 1
      const dt = formatTimestamp(timestamp)

      const r = {seq, keys: [
        [seq, 'locale', dt, data.systemLocale, count],
        [seq, 'platform', dt, data.platform, count],
      ]}
      return r
    }),
    //pull.through(console.log)
  )
}

// -- util

const conf = {
  tz: 'Europe/Berlin'
}

function formatTimestamp(ts) {
  const dt = DateTime.fromSeconds(ts).setZone(conf.tz)
    .setLocale('de')
  return `${dt.toISO().slice(0,13)}`
}

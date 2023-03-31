//jshint  esversion: 11
//jshint -W033

const pull = require('pull-stream')
const { DateTime } = require('luxon')
const { join } = require('path')

const OffsetLog = require('flumelog-offset')
const offsetCodecs = require('flumelog-offset/frame/offset-codecs')
const codec = require('flumecodec')

const Flume = require('flumedb')
const FlumeTransform = require('flumeview-level-transform')
const FlumeAggregate = require('flumeview-level-aggregate')

const aggregate = require('./aggregate')

const log = OffsetLog(join(__dirname, '..', 'data', 'flume.log'), {
  codec: codec.json,
  offsetCodec: offsetCodecs[48]
})
const db = Flume(log)

// ---

const parentView = FlumeAggregate(db, 1, transform)

parentView.use(
  'platform_by_hour',
  FlumeTransform(1, 
    aggregate('platform', 'yyyy-mm-ddThh'.length)
  )
)

parentView.use(
  'platform_by_year',
  FlumeTransform(1,
    aggregate('platform', 'yyyy'.length)
  )
)
db.use('parentView', parentView) 

pull(
  parentView.platform_by_year.read({
    //since: -1, // don't wait (workaround)
    keys: true,
    seqs: true,
    values: false,
    //live: false,
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

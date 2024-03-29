//jshint -W033
//jshint -W018
//jshint  esversion: 11

const pull = require('pull-stream')
const pullLooper = require('pull-looper')
const bufferUntil = require('pull-buffer-until')

const { DateTime } = require('luxon')
const { inspect } = require('util')
const { join } = require('path')

const OffsetLog = require('flumelog-offset')
const offsetCodecs = require('flumelog-offset/frame/offset-codecs')
const codec = require('flumecodec')
const Reduce = require('flumeview-reduce')
const Flume = require('flumedb')

const {Routes} = require('../query-server')

const stream = require('../gpafollow')
const UpdateIds = require('../gpafollow/update-ids')

const conf = require('rc')('gpastats', {
  data_dir: join(__dirname, 'data'),
  rqdelay: 10000,
  startday: '2021-08-11',
  blacklist: [],
  minage: {days: 3},
  tz: 'Europe/Berlin',
  update_interval: 1000 * 60 * 15,
  secret: 'gpa'
})

module.exports = function(mainRoutes) {
  const routes = Routes()
  mainRoutes.add('/' + conf.secret, routes.handle)

  const db = Flume(OffsetLog(join(conf.data_dir, 'flume.log'), {
    codec: codec.json,
    offsetCodec: offsetCodecs[48]
  }))
  db.use('continuation', Reduce(1, (acc, item) => {
    if (item.type !== '__since') return acc
    return Math.max(acc || 0, item.data.timestamp)
  }))
  const updateIds = UpdateIds(db)
   
  require('./queries/devices')(db, routes, conf)
  require('./queries/platforms')(db, routes, conf)
  require('./queries/appversions')(db, routes, conf)
  require('./queries/status')(db, routes, conf)
  require('./queries/menus')(db, routes, conf)
  require('./queries/content')(db, routes, conf)
  require('./queries/generic')(db, routes, conf)
  require('./v3')(db, routes, conf)

  db.continuation.get((err, value) => {
    if (err) {
      console.error('Unable to read continuation value:', err.message)
      process.exit(1)
    }
    console.error('continuation value is', formatTimestamp(value))
    conf.continuation = value
    
    function periodic() {
      update(db, conf, (err, continuation)=>{
        conf.continuation = continuation
        if (err) {
          console.error('-- STREAM ABORT')
          console.error(inspect(err, {depth: 6, colors: true}))
        } else {
          console.error('flumedb is in sync with upstream GraphQL source.')
        }
        setTimeout(periodic, conf.update_interval)
      })
    }

    periodic()
  })

  function update(db, conf, cb) {
    const source = stream(conf)
    if (source.getIds) {
      updateIds(source.getIds, err =>{
        if (err) console.error('Error updating suuids:', err.message)
      })
    }

    let continuation = conf.continuation
    pull(
      source,
      pullLooper,
      bufferUntil( buff=>{
        return buff[buff.length-1].type == '__since'
      }),
      pull.asyncMap( (items, cb) => {
        //console.log(items)
        db.append(items, (err, seq) => {
          if (err) return cb(err)
          db.continuation.get((err, value) => {
            if (err) return cb(err)
            console.error('Guide Pilot: new continuation value:', formatTimestamp(value))
            continuation = value
            cb(null, seq)
          })
        })
      }),
      pull.onEnd(err=>{
        cb(err, continuation)
      })
    )
  }
}

// -- util
function formatTimestamp(ts) {
  const t = DateTime.fromSeconds(ts/1000).setZone(conf.tz)
  return t.setLocale('de').toLocaleString(DateTime.DATETIME_MED)
}

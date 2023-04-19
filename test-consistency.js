//jshint -W083, -W033, -W018, esversion: 11

const pull = require('pull-stream')
const OffsetLog = require('flumelog-offset')
const offsetCodecs = require('flumelog-offset/frame/offset-codecs')
const codec = require('flumecodec')
const Flume = require('flumedb')
const {join} = require('path')
const multicb = require('multicb')
const test = require('tape')

const addViews = require('./v3/views')
const addObjs = require('./util/add-objs')

const conf = require('rc')('gpastats', {
  data_dir: join(__dirname, 'data'),
  rqdelay: 10000,
  startday: '2021-08-11',
  blacklist: [],
  minage: {days: 3},
  tz: 'Europe/Berlin',
  update_interval: 1000 * 60 * 15,
  allowHTTP: false
})

const db = Flume(OffsetLog(join(conf.data_dir, 'flume.log'), {
  codec: codec.json,
  offsetCodec: offsetCodecs[48]
}))

addViews(db, conf)

function get(viewName, gte, lt, cb) {
  /*
  db[`gpav3_${viewName}`].since(s=>{
    console.log(viewName, s, '/', db.since.value)
    if (s==-1) {
      console.log(new Error().stack)
    }
  })
  */
  pull(
    db[`gpav3_${viewName}`].read({
      lt, gte,
      keys: true,
      values: true,
      //since: -1
    }),
    pull.collect( (err, data)=>{
      if (err) console.error(err)
      cb(err, data)
    })
  )
}

function sum(viewName, gte, lt, cb) {
  get(viewName, gte, lt, (err, data)=>{
    if (err) return cb(err)
    const sum = data.reduce( (acc, b) =>{
      return addObjs(acc, b.value)
    }, {})
    cb(null, sum)
  })
}

function report(field, year, cb) {
  const done = multicb({pluck: 1})
  for (let bucket of ['hour', 'day', 'month', 'year']) {
    const cb = done()
    sum(`${field}_by_${bucket}`, `${year}`, `${year+1}`, (err, sum)=>{
      //console.log(`${field} sum by ${bucket}:`, sum)
      cb(err, {sum, field, bucket})
    })
  }
  done(cb)
}

//report('zone', 2022)
//report('device', 2022)

function testConsistency(t, field, year) {
  report(field, year, (err, data) => {
    t.notOk(err)
    for(const {sum, field, bucket} of data) {
      t.deepEqual(sum, data[0].sum, `${field} by ${bucket}`)
    }
    t.end()
  })
}

test('platform 2021', t=>
  testConsistency(t, 'platform', 2021)
)
test('platform 2022', t=>
  testConsistency(t, 'platform', 2022)
)
test('platform 2023', t=>
  testConsistency(t, 'platform', 2023)
)

test('menu 2023', t=>
  testConsistency(t, 'menu', 2023)
)

test('zone 2023', t=>
  testConsistency(t, 'zone', 2023)
)

test('content 2022', t=>
  testConsistency(t, 'content', 2022)
)

test('content 2023', t=>
  testConsistency(t, 'content', 2023)
)

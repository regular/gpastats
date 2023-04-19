//jshint -W083, -W033, -W018, esversion: 11

const pull = require('pull-stream')
const OffsetLog = require('flumelog-offset')
const offsetCodecs = require('flumelog-offset/frame/offset-codecs')
const codec = require('flumecodec')
const Flume = require('flumedb')
const {join} = require('path')

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
  pull(
    db[`gpav3_${viewName}`].read({
      lt, gte,
      keys: true,
      values: true,
      since: -1
    }),
    pull.collect( (err, data)=>{
      if (err) console.error(err)
      cb(err, data)
    })
  )
}

function sum(viewName, gte, lt, cb) {
  get('platform_by_month', '2022','2023', (err, data)=>{
    if (err) return cb(err)
    const sum = data.reduce( (acc, b) =>{
      return addObjs(acc, b.value)
    }, {})
    cb(null, sum)
  })
}

function report(field, year) {
  for (let bucket of ['hour', 'day', 'month']) {
    sum(`${field}_by_${bucket}`, `${year}`, `${year+1}`, (err, sum)=>{
      console.log(`sum by ${bucket}:`, sum)
    })
  }

  get(`${field}_by_year`, `${year}`, `${year+1}`, (err, data)=>{
    console.log(data.length)
    console.log('by year:', data[0].value)
  })
}

report('platform', 2022)

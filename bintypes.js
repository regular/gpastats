//jshint -W033, -W018, esversion: 11

const pull = require('pull-stream')
const OffsetLog = require('flumelog-offset')
const offsetCodecs = require('flumelog-offset/frame/offset-codecs')
const codec = require('flumecodec')
const Flume = require('flumedb')
const {join} = require('path')

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

pull(
  db.stream({values: true, seqs: false}),
  pull.filter( ({type}) => type !== '__since'),
  pull.filter( ({type}) => type !== 'suuid'),
  pull.unique( ({type, data})=>`${type}-${data.verb}`),
  pull.collect( (err, data) =>{
    if (err) return console.error(err)
    console.log(JSON.stringify(data, null, 2))
  })
)

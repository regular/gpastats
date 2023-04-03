//jshint esversion: 11
//jshint -W033
const pull = require('pull-stream')
const tmp = require('tmp')
const Log = require('flumelog-array')
const Flume = require('flumedb')
const {join} = require('path')
const {DateTime} = require('luxon')
const test = require('tape')

const views = require('./views')

const log = Log()
log.filename = join(tmp.dirSync({unsafeCleanup: true}).name, 'xxx')
const tz = 'Europe/Berlin'

test('parentView', t=>{
  const db = Flume(log)
  const parentView = views(db, {tz})
   
  db.append([
    {
      type: 'menuSection',
      data: {
        verb: 'SELECTED',
        locale: 'de',
        entitySuuid: 'menu1',
        count: 1,
        timestamp: timestamp('2023-01-01T12:00')
      }
    }
  ], (err, seq) => {
    t.notOk(err, 'write event to db')
    pull(
      db.gpav3_parentView.read({
        values: false,
        seqs: false,
        upto: true
      }),
      pull.collect( (err, items)=>{
        t.notOk(err, 'read parentView')
        t.deepEqual(items, [
          [ 0, 'menu', '2023-01-01T12', 'de:menu1', 1 ],
          [ undefined ]
        ], 'contains indexed event and EOS indicator (upto)')
        t.end()
      })
    )
  })
})

// -- util
function timestamp(iso) {
  return DateTime.fromISO(iso).setZone(tz).toSeconds() * 1000
}

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

const tz = 'Europe/Berlin'

test('parentView', t=>{
  const log = Log()
  log.filename = join(tmp.dirSync({unsafeCleanup: true}).name, 'xxx')
  let db = Flume(log)
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
    const v =  db.gpav3_parentView
    t.notOk(err, 'write event to db')
    pull(
      v.read({
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

test('menu items', t=>{
  const log = Log()
  log.filename = join(tmp.dirSync({unsafeCleanup: true}).name, 'xxx')
  let db = Flume(log)
  let parentView = views(db, {tz})
   
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
    }, {
      type: 'menuSection',
      data: {
        verb: 'SELECTED',
        locale: 'es',
        entitySuuid: 'menu1',
        count: 1,
        timestamp: timestamp('2023-12-31T23:59')
      }
    }, {
      type: 'menuSection',
      data: {
        verb: 'SELECTED',
        locale: 'en',
        entitySuuid: 'menu1',
        count: 1,
        timestamp: timestamp('2024-01-01T12:00')
      }
    }
  ], (err, seq) => {
    t.notOk(err, 'write event to db')
    const v = parentView.gpav3_menu_by_year
    pull(
      v.read({
        key: true,
        values: false,
        seqs: true,
        upto: true
      }),
      pull.collect( (err, items)=>{
        t.notOk(err, 'read menu_by_year')
        t.deepEqual(items, [
          { key: '2023', seq: { 'de:menu1': 1, 'es:menu1': 1 } },
          { key: '2024', seq: { 'en:menu1': 1} },
          { key: [ undefined ], seq: { since: 2 } }
        ])
        const pv =  db.gpav3_parentView
        console.log('calling close ...')
        pv.close()
        db.close()
        setTimeout( ()=>{
          db = Flume(log)
          let parentView = views(db, {tz})
          t.end()
        }, 400)
      })
    )
  })
})


// -- util
function timestamp(iso) {
  return DateTime.fromISO(iso).setZone(tz).toSeconds() * 1000
}

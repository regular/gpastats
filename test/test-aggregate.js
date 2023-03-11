//jshint -W033
//jshint -W018
//jshint  esversion: 11
const test = require('tape')
const pull = require('pull-stream')
const agg = require('../aggregate')

test('combine entries based on timestamp', t=>{
  pull(
    pull.values([
      [0],
      [1],
      [5],
      [11],
      [12]
    ]),
    agg(10),
    pull.collect( (err, values)=>{
      t.equal(err, null)
      t.deepEqual(values, [
        [ [0], [1], [5] ],
        [ [11], [12] ]
      ])
      t.end()
    })
  )
})

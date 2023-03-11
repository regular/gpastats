//jshint -W033
//jshint -W018
//jshint  esversion: 11
const pull = require('pull-stream')
const agg = require('./aggregate')

pull(
  pull.values([
    [0],
    [1],
    [5],
    [11],
    [12]
  ]),
  agg(10),
  pull.log()
)

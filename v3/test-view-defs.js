//jshint esversion:11, -W033, -W083

const test = require('tape')
const pull = require('pull-stream')
const viewDefs = require('./view-defs')
const data = require('../fixtures/bintypes.json')

const tests = {
  platform: ['ANDROID'],
  appVersion: ["3.3.0"],
  osVersion: ["31"],
  device: ["redfin"],
  systemLocale: ["en"],
  content: ["de:baz"],
  menu: ["en_DE:n/a"],
  zone: ["n/a"]
}

for(let [name, expected] of Object.entries(tests)) {
  test(name, t=>{ 
    const {filter, extract} = viewDefs[name]
    pull(
      pull.values(data),
      pull.filter(filter),
      pull.map(({data})=>data),
      pull.map(extract),
      pull.collect( (err, result)=>{
        t.notOk(err)
        t.deepEqual(result, expected, `${name} extraction`)
        t.end()
      })
    )
  })
}

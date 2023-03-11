//jshint -W033
//jshint  esversion: 11
const FlumeLevel = require('flumeview-level')
const {DateTime} = require('luxon')
const multicb = require('multicb')
const {parse} = require('url')
const qs = require('querystring')

const pull = require('pull-stream')
const toStream = require('pull-stream-to-stream')

const aggregate = require('../aggregate')
const reduce = require('../reduce')

const viewName = 'gpa_index'

module.exports = function(db, routes, conf) {
  const {sameYear, sameMonth} = require('../buckets')(conf.tz)

  db.use(viewName, FlumeLevel(4, (item, seq) => {
    const {data, type} = item
    if (type == '__since') return []
    let {timestamp, verb, count} = data
    count = count || 1

    switch(type) {
      case 'appInfo':
        return [
          ['platform', timestamp, data.platform || 'n/a', count, seq],
          ['appVersion', timestamp, data.appVersion || 'n/a', count, seq],
          ['osVersion', timestamp, data.osVersion || 'n/a', count, seq],
          ['device', timestamp, data.device || 'n/a', count, seq],
          ['systemLocale', timestamp, data.systemLocale || 'n/a', count, seq]
        ]
      default: 
        return []
    }
  }))

  routes.add('/generic', (req, res)=>{
    const {pathname, query} = parse(req.url)
    const [_, __, idx] = pathname.split('/')
    console.error('reading index', idx)

    db.suuids.get( (err, suuids) =>{
      if (err) return res.end(err.message)
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')

      const source = pull(
        db[viewName].read({
          gt: [idx, null],
          lt: [idx, undefined],
          keys: true,
          values: false,
          seqs: false
        }),
        pull.map(item=>item.slice(1, item.length - 1)),
        pull.map(item=>{
          // convert timestamp from ms to seconds
          item[0] = item[0] / 1000
          return item
        }),
        //aggregate(()=>true, reduce()),
        aggregate(sameYear(), reduce()),
        //aggregate(aggregate.deltaT(60 * 15), reduce()),
        pull.flatten(),
        
        pull.map(item=>{
          const [timestamp, ...data] = item
          
          const isoTime = DateTime
            .fromSeconds(timestamp)
            .setZone(conf.tz)
            .toISO()
          
          const d = JSON.stringify(data)
          return `${isoTime} ${d}\r\n`
        })
      
      )
      toStream.source(source).pipe(res)
    })
  })
}

/*
appInfo
  appVersion
  platform
  osVersion
  device
  systemLocale
  verb

session
  verb
  locale

menuSection
  verb
  locale

menuSectionItem
  verb
  locale
  entitySuuid

zone
  verb
  entitySuuid

contentUsage
  verb
  locale
  entitySuuid

weblink
  verb
  locale
  entitySuuid
*/

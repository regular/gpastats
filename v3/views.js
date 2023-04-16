//jshint  esversion: 11
//jshint -W033

const pull = require('pull-stream')
const { DateTime } = require('luxon')

const FlumeTransform = require('flumeview-level-transform')
const FlumeAggregate = require('flumeview-level-aggregate')

const aggregate = require('./aggregate')

module.exports = function(db, conf) {
  const parentView = FlumeAggregate(db, 'parent', transform)

  const buckets = {
    //hour: 'yyyy-mm-ddThh'.length,
    day: 'yyyy-mm-dd'.length,
    //month: 'yyyy-mm'.length,
    //year: 'yyyy'.length
  }

  const fields = [
    //'content', 
    //'menu',
    //'zone',
    'platform',
    //'appVersion',
    //'osVersion',
    //'device',
    //'systemLocale'
  ]

  for (let [bucket, N] of Object.entries(buckets)) {
    for (let field of fields) {
      parentView.use(
        `gpav3_${field}_by_${bucket}`,
        FlumeTransform(`${field}_by_${bucket}`, 
          aggregate(field, N)
        )
      )
    }
  }

  db.use('gpav3_parentView', parentView) 

  return parentView

  function formatTimestamp(ts) {
    const dt = DateTime.fromSeconds(ts).setZone(conf.tz)
      .setLocale('de')
    return `${dt.toISO().slice(0,13)}`
  }

  /* WARNING!
   * errors (even typos) cause the stream to end and NO ERROR MESSAGE
   * to be displayed whatsoever. I guess flumedb and/or pull-writer are 
   * responsible for catching and ignoring errors.
  */

  function transform() {
    return pull(
      pull.map( ({value, seq}) => {
        try {
          const done = (ks) => {
            return {seq, keys: ks || []}
          }
          const {type, data} = value
          
          let {timestamp, count} = data
          if (!timestamp) return done()

          timestamp /= 1000
          count = count || 1
          const dt = formatTimestamp(timestamp)

          const e = (type, value) => {
            return [seq, type, dt, value, count]
          }

          switch(type) {
            case 'contentUsage':
              if (data.verb !== 'SELECTED') return done()
              return done([
                e('content', `${na(data.locale)}:${na(data.entitySuuid)}`)
              ])
            case 'menuSection': 
            case 'menuSectionItem':
              if (data.verb !== 'SELECTED') return done()
              return done([
                e('menu', `${na(data.locale)}:${na(data.entitySuuid)}`)
              ])
            case 'zone':
              if (data.verb !== 'ENTERED') return done()
              return done([
                e('zone', na(data.entitySuuid))
              ])
            case 'appInfo':
              return done([
                e('platform', na(data.platform)),
                e('appVersion', na(data.appVersion)),
                e('osVersion', na(data.osVersion)),
                e('device', na(data.device)),
                e('systemLocale', na(data.systemLocale))
              ])
            default:
              return done()
          }
        } catch(e) {
          console.error(e.message, e.stack)
          throw e
        }
      })
    )
  }
}

// -- util

function na(value) {
  return value || 'n/a'
}


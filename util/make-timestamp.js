//jshint esversion:11, -W033

// this creates a luxon DateTime object in the
// specified timezone, from an ISO-like string
// hours, minutes, seconds are optional

const {DateTime} = require('luxon')

module.exports = function(zone) {
  // s in this format
  // '2023-01-02T03:04:05'
  return function makeTimestamp(s) {
    const m = s.match(
      /(\d{4})-(\d{2})-(\d{2})(T(\d{2})(:(\d{2}))?(:(\d{2}))?)?/
    )
    if (!m) throw new Error(`invalid timestamp: ${s}`)
    const [
      all, year, month, day,
      time, hour, _minute, minute, _second, second
    ] = m
    return DateTime.fromObject({
      year: n(year), 
      month: n(month),
      day: n(day),
      hour: n(hour),
      minute: n(minute),
      second: n(second)
    }, {zone})
  }
}

function n(x) {
  if (x==undefined) return x
  return ~~x 
}

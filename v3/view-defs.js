//jshint esversion: 11, -W033

module.exports = {
  platform: appInfo('platform'),
  appVersion: appInfo('appVersion'),
  osVersion: appInfo('osVersion'),
  device: appInfo('device'),
  systemLocale: appInfo('systemLocale'),
  content: {
    filter: ({type, data})=> type == 'contentUsage' && data.verb == 'SELECTED',
    extract: ({data}) => `${na(data.locale)}:${na(data.entitySuuid)}`
  }, 

  menu: {
    filter: ({type, data}) => (type == 'menuSection' || type == 'menuSectionItem') &&
              data.verb == 'SELECTED',
    extract: ({data}) => `${na(data.locale)}:${na(data.entitySuuid)}`
  }, 

  zone: {
    filter: ({type, data}) => type == 'zone' && data.verb == 'ENTERED',
    extract: ({data}) => na(data.entitySuuid)
  }
}

// -- util

function appInfo(prop) {
  return {
    filter: ({type}) => type == 'appInfo',
    extract: ({data}) => na(data[prop])
  }
}

function na(value) {
  return (value !== undefined && value !== null) ? value : 'n/a'
}


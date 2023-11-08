const {join} = require('path')
const {QueryServer, Routes} = require('../query-server')
const GPAServer = require('.')

const config = require('rc')('query-server', {
  data_dir: join(__dirname, 'data'),
  // for query-server
  tz: 'Europe/Berlin',
  //allowHTTP: true,
  //port: 8080
})

const mainRoutes = Routes()

QueryServer(config, mainRoutes.handle)
GPAServer(mainRoutes)

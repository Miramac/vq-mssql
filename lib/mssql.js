'use strict'
var nodeSql = require('msnodesqlv8')
var deasync = require('deasync')

function Connection (options) {
  options = options || {}
  options = (typeof options === 'string') ? {connectionString: options} : options
  // Build the connection string if not provided
  if (!options.connectionString && options.connectionSettings) {
    // Driver
    options.connectionString = (options.connectionSettings.driver) ? 'Driver=' + options.connectionSettings.driver + ';' : ''
    // Provider if needed
    options.connectionString += (options.connectionSettings.provider) ? 'Provider=' + options.connectionSettings.provider + ';' : ''
    // server and db
    options.connectionString += 'Server=' + options.connectionSettings.server + ';Database=' + options.connectionSettings.database + ';'
    // TrustedConnection?
    if (options.connectionSettings.useTrustedConnection) {
      options.connectionString += 'Trusted_Connection=yes'
    } else {
      options.connectionString += ';User Id=' + options.connectionSettings.dbUser + ';Password=' + options.connectionSettings.dbPassword + ';'
    }
  }

  /**
   * Loggong option
   */
  var _logger = options.logger || null
  var self = this
  self.setLogger = function (loggerFunc) {
    _logger = loggerFunc
  }
  /**
   * Execute sql statement. If the callback function is missing, a promise will be returned
   */
  self.query = function (queryStr, parameters, source, cb) {
    if (typeof source === 'function') {
      cb = source
      source = null
    }
    if (typeof parameters === 'function') {
      cb = parameters
      parameters = []
    }
    if (typeof parameters === 'string') {
      source = parameters
      parameters = []
    }
    parameters = parameters || []
    parameters = (Array.isArray(parameters)) ? parameters : [parameters]
    cb = cb || function () {}
    return new Promise((resolve, reject) => {
      log('debug', (parameters.length > 0) ? {queryStr: queryStr, parameters: parameters} : queryStr, source)
      nodeSql.query(options.connectionString, queryStr, parameters, (err, result) => {
        if (err) {
          log('error', err)
          reject(err)
          return cb(err)
        }
        resolve(result)
        return cb(null, result)
      })
    })
  }

  /**
   * Opens an sql connection with Promise support
   */
  self.open = function (cb) {
    cb = cb || function () {}
    return new Promise((resolve, reject) => {
      nodeSql.open(options.connectionString, (err, connection) => {
        if (err) {
          log('error', err)
          reject(err)
          return cb(err)
        }
        resolve(connection)
        return cb(null, connection)
      })
    })
  }

  /**
   * create a Transaction with auto commit or rollback on error
   */
  self.transaction = function (queryStr, source, cb) {
    if (typeof source === 'function') {
      cb = source
      source = null
    }
    cb = cb || function () {}
    queryStr = (Array.isArray(queryStr)) ? queryStr.join(';\n') : queryStr
    return new Promise((resolve, reject) => {
      self.open()
        .then(function (connection) {
          connection.beginTransaction((err) => {
            if (err) throw err
            log('info', 'Begin transaction', source)
          })
          log('debug', queryStr, source)
          var query = connection.queryRaw(queryStr)

          query.on('error', (err) => {
            connection.rollback((err) => {
              if (err) throw err
            })
            log('info', 'Rollback transaction', source)
            log('error', err, source)
            reject(err)
            return cb(err)
          })

          query.on('done', function () {
            connection.commit((err) => {
              if (err) throw err
              log('info', 'Commit transaction', source)
              resolve(connection)
              return cb(null)
            })
          })
        })
    })
  }
  // shortcut
  self.trans = self.transaction

  // Stored Procedure Support
  self.procedure = function (procName, parameters, cb) {
    if (typeof parameters === 'function') {
      cb = parameters
      parameters = null
    }
    parameters = parameters || []
    parameters = (Array.isArray(parameters)) ? parameters : [parameters]
    cb = cb || function () {}
    return new Promise((resolve, reject) => {
      self.open()
        .then(function (connection) {
          var procedureMgr = connection.procedureMgr()
          log('debug', procName + ' ' + parameters.join())
          procedureMgr.callproc(procName, parameters, (err, result, output) => {
            if (err) {
              log('error', err)
              reject(err)
              return cb(err)
            } else {
              resolve({result: result, output: output})
              return cb(null, result, output)
            }
          })
        })
    })
  }
  // shortcut
  self.proc = self.procedure

  /**
   * Bulk operations
   */
  self.bulkInsert = function (table, data, cb) {
    cb = cb || function () {}
    return new Promise((resolve, reject) => {
      self.open()
        .then(function (connection) {
          var tableMgr = connection.tableMgr()
          tableMgr.bind(table, (bulkMgr) => {
            bulkMgr.insertRows(data, (err, result) => {
              if (err) {
                log('error', err)
                reject(err)
                return cb(err)
              } else {
                resolve(result)
                return cb(null, result)
              }
            })
          })
        })
    })
  }

  self.bulkUpdate = function (table, data, cb) {}

  /**
   * Sync functions
   */
  self.querySync = deasync(self.query)


  /**
  * expose quote
  */
  self.quote = quote

  /**
  * expose cast functions
  */
  self.Bit = nodeSql.Bit

  self.BigInt = nodeSql.BigInt
  self.Int = nodeSql.Int
  self.TinyInt = nodeSql.TinyInt
  self.SmallInt = nodeSql.SmallInt

  self.VarBinary = nodeSql.VarBinary
  self.LongVarBinary = nodeSql.LongVarBinary
  self.Image = nodeSql.LongVarBinary

  self.Float = nodeSql.Float
  self.Numeric = nodeSql.Numeric
  self.Money = nodeSql.Money
  self.SmallMoney = nodeSql.SmallMoney

  self.WVarChar = nodeSql.WVarChar
  self.Double = nodeSql.Double
  self.Decimal = nodeSql.Numeric

  self.Real = nodeSql.Real
  self.Char = nodeSql.Char // sent as Utf8
  self.VarChar = nodeSql.VarChar // sent as Utf8
  self.NChar = nodeSql.NChar // 16 bit
  self.NVarChar = nodeSql.NVarChar // 16 bit i.e. unicode
  self.Text = nodeSql.Text
  self.NText = nodeSql.NText
  self.Xml = nodeSql.Xml // recommended to use wide 16 bit rather than char
  self.UniqueIdentifier = nodeSql.UniqueIdentifier

  self.Time = nodeSql.Time
  self.Date = nodeSql.Date
  self.DateTime = nodeSql.DateTime
  self.DateTime2 = nodeSql.DateTime2
  self.DateRound = nodeSql.DateRound
  self.SmallDateTime = nodeSql.SmallDateTime
  self.DateTimeOffset = nodeSql.DateTimeOffset

  /**
   * quote SQL values
   */
  function quote (value, addComma) {
    addComma = addComma || false
    if (value === null) {
      value = 'NULL'
    } else if (typeof value === 'number') {
      // value = value
    } else if (typeof value === 'object') {
      value = JSON.stringify(value)
    }
    if (typeof value === 'string' && value !== 'NULL' && value.indexOf('*') === -1) {
      value = "'" + value.replace(/'/g, "''") + "'"
    }

    return value + ((addComma) ? ',' : '')
  }

  function log (level, msg, source) {
    if (!msg) {
      msg = level
      level = 'info'
    }
    if (_logger) {
      _logger(level, (source) ? {'source': source, message: msg} : msg)
    }
  }
}

module.exports = Connection

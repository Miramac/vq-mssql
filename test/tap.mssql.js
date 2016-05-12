var tap = require('tap')
var MsSqlConnection = require('../')
var winston = require('winston')

// Test config
var server = 'db1-muc\\SQL5_MUC'
var database = 'ZI00_UnitTests'
var connectionString = `Driver={SQL Server Native Client 11.0};Server=${server};Database=${database};Trusted_Connection={Yes};`

winston.level = 'error'
var sql = new MsSqlConnection(connectionString)
sql.setLogger(winston.log)

tap.test('Test select query', function (t) {
  sql.query('SELECT id FROM dbo.Table1 where id=1')
    .then(function (data) {
      t.same([{id: 1}], data)
      t.end()
    })
    .catch(function (err) {
      t.error(err)
      t.end()
    })
})

tap.test('Test select query with parameter', function (t) {
  sql.query('SELECT id FROM dbo.Table1 where id=?', sql.Int(1))
    .then(function (data) {
      t.same([{id: 1}], data)
      t.end()
    })
    .catch(function (err) {
      t.error(err)
      t.end()
    })
})

tap.test('Test select query with text parameter', function (t) {
  sql.query('SELECT id FROM dbo.Table1 where Col1=?', ['Col1'])
    .then(function (data) {
      t.same([{id: 1}], data)
      t.end()
    })
    .catch(function (err) {
      t.error(err)
      t.end()
    })
})

tap.test('Test procedure 1', function (t) {
  sql.procedure('dbo.sp_test1')
    .then(function (data) {
      t.same([{col1: 'Test1'}], data.result)
      t.end()
    })
    .catch(function (err) {
      t.error(err)
      t.end()
    })
})

tap.test('Test procedure 2', function (t) {
  sql.procedure('dbo.sp_test2', 'Test2')
    .then(function (data) {
      t.same([{col1: 'Test2'}], data.result)
      t.end()
    })
    .catch(function (err) {
      t.error(err)
      t.end()
    })
})

tap.test('Test procedure 3', function (t) {
  sql.procedure('dbo.sp_test3', [11, 22])
    .then(function (data) {
      t.same([{num1: 11, num2: 22}], data.result)
      t.end()
    })
    .catch(function (err) {
      t.error(err)
      t.end()
    })
})

tap.test('Test transaction', function (t) {
  sql.transaction(`
        INSERT INTO dbo.Table1 (id, col1) values (-9991, 'test 1')
        INSERT INTO dbo.Table1 (id, col1) values (-9992, 'test 2')
        INSERT INTO dbo.Table1 (id, col1) values (-9993, 'test 3')
        INSERT INTO dbo.Table1 (id, col1) values (-9994, 'test 4')
        INSERT INTO dbo.Table1 (id, col1) values (-9995, 'test 5')
    `)
    .then(function () {
      sql.query('DELETE dbo.Table1 where id in(-9991, -9992, -9993, -9994, -9995)', 'cleanup')
      t.end()
    })
    .catch(function (err) {
      sql.query('DELETE dbo.Table1 where id in(-9991, -9992, -9993, -9994, -9995)', 'cleanup')
      t.error(err)
      t.end()
    })
})

tap.test('Test transaction with queries array', function (t) {
  var queries = [
    'INSERT INTO dbo.Table1 (id, col1) values (-9991, \'test 1\')',
    'INSERT INTO dbo.Table1 (id, col1) values (-9992, \'test 2\')',
    'INSERT INTO dbo.Table1 (id, col1) values (-9993, \'test 3\')',
    'INSERT INTO dbo.Table1 (id, col1) values (-9994, \'test 4\')',
    'INSERT INTO dbo.Table1 (id, col1) values (-9995, \'test 5\')'
  ]
  sql.transaction(queries)
    .then(function () {
      sql.query('DELETE dbo.Table1 where id in(-9991, -9992, -9993, -9994, -9995)', 'cleanup')
      t.end()
    })
    .catch(function (err) {
      sql.query('DELETE dbo.Table1 where id in(-9991, -9992, -9993, -9994, -9995)', 'cleanup')
      t.error(err)
      t.end()
    })
})

tap.test('Test bulk', function (t) {
  sql.bulkInsert('dbo.Table1', [{
    ID: -9981,
    Col1: 'col1 9981',
    Col2: 'col2 9981'
  }, {
    ID: -9982,
    Col1: 'col1 9982',
    Col2: 'col2 9982'
  }, {
    ID: -9983,
    Col1: 'col1 9983',
    Col2: 'col2 9983'
  }, {
    ID: -9984,
    Col1: 'col1 9984',
    Col2: 'col2 9984'
  }, {
    ID: -9985,
    Col1: 'col1 9985',
    Col2: 'col2 9985'
  }])
    .then(function () {
      sql.query('DELETE dbo.Table1 where id in(-9981, -9982, -9983, -9984, -9985)', 'cleanup')
      t.end()
    })
    .catch(function (err) {
      sql.query('DELETE dbo.Table1 where id in(-9981, -9982, -9983, -9984, -9985)', 'cleanup')
      t.error(err)
      t.end()
    })
})

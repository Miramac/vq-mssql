var tap = require('tap')
var MsSqlConnection = require('../')
var winston = require('winston')

// Test config
var server = 'db1-muc\\SQL5_MUC'
var database = 'ZI00_UnitTests'
var connectionString = `Driver={SQL Server Native Client 11.0};Server=${server};Database=${database};Trusted_Connection={Yes};`

winston.level = 'error'
var connection = new MsSqlConnection(connectionString)
connection.setLogger(winston.log)

tap.test('Test select query', function (t) {
  connection.query('SELECT id FROM dbo.Table1 where id=1')
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
  connection.query('SELECT id FROM dbo.Table1 where id=?', connection.Int(1))
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
  connection.query('SELECT id FROM dbo.Table1 where Col1=?', ['Col1'])
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
  connection.procedure('dbo.sp_test1')
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
  connection.procedure('dbo.sp_test2', 'Test2')
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
  connection.procedure('dbo.sp_test3', [11, 22])
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
  connection.transaction(`
        INSERT INTO dbo.Table1 (id, col1) values (-9991, 'test 1')
        INSERT INTO dbo.Table1 (id, col1) values (-9992, 'test 2')
        INSERT INTO dbo.Table1 (id, col1) values (-9993, 'test 3')
        INSERT INTO dbo.Table1 (id, col1) values (-9994, 'test 4')
        INSERT INTO dbo.Table1 (id, col1) values (-9995, 'test 5')
    `)
    .then(function () {
      connection.query('DELETE dbo.Table1 where id in(-9991, -9992, -9993, -9994, -9995)', 'cleanup')
      t.end()
    })
    .catch(function (err) {
      connection.query('DELETE dbo.Table1 where id in(-9991, -9992, -9993, -9994, -9995)', 'cleanup')
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
  connection.transaction(queries)
    .then(function () {
      connection.query('DELETE dbo.Table1 where id in(-9991, -9992, -9993, -9994, -9995)', 'cleanup')
      t.end()
    })
    .catch(function (err) {
      connection.query('DELETE dbo.Table1 where id in(-9991, -9992, -9993, -9994, -9995)', 'cleanup')
      t.error(err)
      t.end()
    })
})

tap.test('Test bulk', function (t) {
  connection.bulkInsert('dbo.Table1', [{
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
      connection.query('DELETE dbo.Table1 where id in(-9981, -9982, -9983, -9984, -9985)', 'cleanup')
      t.end()
    })
    .catch(function (err) {
      connection.query('DELETE dbo.Table1 where id in(-9981, -9982, -9983, -9984, -9985)', 'cleanup')
      t.error(err)
      t.end()
    })
})

tap.test('Test sync', function (t) {

  try {
    var result1 = connection.querySync('select 1 as col1')
    t.same([{col1: 1}], result1)

    var result2 = connection.querySync('SELECT id FROM dbo.Table1 where id=1')
    t.same([{id: 1}], result2)
    t.end()
  } catch (err) {
    t.error(err)
    t.end()
  }
})

tap.test('Test sync select query', function (t) {
  try {
    var result = connection.querySync('SELECT id FROM dbo.Table1 where id=1')
    t.same([{id: 1}], result)
    t.end()
  } catch (err) {
    t.error(err)
    t.end()
  }
})

tap.test('Test sync select query with parameter', function (t) {
  try {
    var result = connection.querySync('SELECT id FROM dbo.Table1 where id=?', connection.Int(1))
    t.same([{id: 1}], result)
    t.end()
  } catch (err) {
    t.error(err)
    t.end()
  }
})

tap.test('Test sync select query with text parameter', function (t) {
  try {
    var result = connection.querySync('SELECT id FROM dbo.Table1 where Col1=?', ['Col1'])
    t.same([{id: 1}], result)
    t.end()
  } catch (err) {
    t.error(err)
    t.end()
  }
})

tap.test('Test sync select query with text parameter', function (t) {
  try {
    var result = connection.querySync('SELECT ? as id', connection.Int(1))
    t.same([{id: 1}], result)
    t.end()
  } catch (err) {
    t.error(err)
    t.end()
  }
})
var tap = require('tap');
var MsSqlConnection = require('../'); 
var winston = require('winston');

var connectionString =  `Driver={SQL Server Native Client 11.0};Server=db1-muc\\SQL5_MUC;Database=ZI00_UnitTests;Trusted_Connection={Yes};`;


winston.level = 'error';
var sql = new MsSqlConnection(connectionString);
sql.setLogger(winston.log);


tap.test("Test select query", function(t) {
    sql.query('SELECT id FROM dbo.Table1 where id=1')
    .then(function(data) { 
        t.same([{id:1}], data)
        t.end()
    })
    .catch(function(err) {
        t.error(err);
        t.end()
    })
})

tap.test("Test select query with parameter", function(t) {
    sql.query('SELECT id FROM dbo.Table1 where id=?', sql.Integer(1))
    .then(function(data) { 
        t.same([{id:1}], data)
        t.end()
    })
    .catch(function(err) {
        t.error(err);
        t.end()
    })
})

/** test fails...?
tap.test("Test sync select query", function(t) {
    var result = sql.querySync('SELECT id FROM dbo.Table1 where id=1');
    t.same([{id:1}], result);
    t.end()
})
**/ 

tap.test("Test select query with text parameter", function(t) {
    sql.query('SELECT id FROM dbo.Table1 where Col1=?', ['Col1'])
    .then(function(data) { 
        t.same([{id:1}], data)
        t.end()
    })
    .catch(function(err) {
        t.error(err);
        t.end()
    })
})

tap.test("Test procedure 1", function(t) {
    sql.procedure('dbo.sp_test1')
    .then(function(data) { 
        t.same([{col1:'Test1'}], data.result)
        t.end()
    })
    .catch(function(err) {
       t.error(err);
        t.end()
    })
})

tap.test("Test procedure 2", function(t) {
    sql.procedure('dbo.sp_test2', 'Test2')
    .then(function(data) { 
        t.same([{col1:'Test2'}], data.result)
        t.end()
    })
    .catch(function(err) {
        t.error(err);
        t.end()
    })
})

tap.test("Test transaction", function(t) {
        sql.transaction(`
        INSERT INTO dbo.Table1 (id, col1) values (-9991, 'test 1')
        INSERT INTO dbo.Table1 (id, col1) values (-9992, 'test 2')
        INSERT INTO dbo.Table1 (id, col1) values (-9993, 'test 3')
        INSERT INTO dbo.Table1 (id, col1) values (-9994, 'test 4')
        INSERT INTO dbo.Table1 (id, col1) values (-9995, 'test 5')
    `)
    .then(function() {
        sql.query('DELETE dbo.Table1 where id in(-9991, -9992, -9993, -9994, -9995)', 'cleanup')
        t.end()
    })
    .catch(function(err) {
        sql.query('DELETE dbo.Table1 where id in(-9991, -9992, -9993, -9994, -9995)', 'cleanup')
        t.error(err);
        t.end()
    })
})

tap.test("Test transaction with queries array", function(t) {
    var queries = [
        `INSERT INTO dbo.Table1 (id, col1) values (-9991, 'test 1')`,
        `INSERT INTO dbo.Table1 (id, col1) values (-9992, 'test 2')`,
        `INSERT INTO dbo.Table1 (id, col1) values (-9993, 'test 3')`,
        `INSERT INTO dbo.Table1 (id, col1) values (-9994, 'test 4')`,
        `INSERT INTO dbo.Table1 (id, col1) values (-9995, 'test 5')`
    ]
    sql.transaction(queries)
    .then(function() {
        sql.query('DELETE dbo.Table1 where id in(-9991, -9992, -9993, -9994, -9995)', 'cleanup')
        t.end()
    })
    .catch(function(err) {
        sql.query('DELETE dbo.Table1 where id in(-9991, -9992, -9993, -9994, -9995)', 'cleanup')
        t.error(err);
        t.end()
    })
})

tap.test("Test bulk", function(t) {
     sql.bulkInsert('dbo.Table1', [{
         ID:-9981,
         Col1: 'col1 9981',
         Col2: 'col2 9981'
     },{
         ID:-9982,
         Col1: 'col1 9982',
         Col2: 'col2 9982'
     },{
         ID:-9983,
         Col1: 'col1 9983',
         Col2: 'col2 9983'
     },{
         ID:-9984,
         Col1: 'col1 9984',
         Col2: 'col2 9984'
     },{
         ID:-9985,
         Col1: 'col1 9985',
         Col2: 'col2 9985'
     }])
    .then(function() {
        sql.query('DELETE dbo.Table1 where id in(-9981, -9982, -9983, -9984, -9985)', 'cleanup')
        t.end()
    })
    .catch(function(err) {
        sql.query('DELETE dbo.Table1 where id in(-9981, -9982, -9983, -9984, -9985)', 'cleanup')
        t.error(err);
        t.end()
    })
})



//winston.log('info',"SDSD");
/*
sql.query('DELETE dbo.Employee where id > 5', 'cleanup')
.then(function() {

    
    sql.query('SELECT id FROM dbo.Employee where id=5')
    .then(function(data) {
        if(data.length === 1) {
            return sql.query('SELECT * FROM dbo.Employee where ID='+data[0].id)
        }
    })
    .then(function(data) {
        console.log("DATA:", data)
    })
    .catch(winston.error)
    
    
    sql.transaction(`
        INSERT INTO Employee (lastname) values ('testify1')
        INSERT INTO Employee (lastname) values ('testify2')
        INSERT INTO Employee (lastname) values ('testify3')
        INSERT INTO Employee (lastname) values ('testify4')
        INSERT INTO Employee (lastname) values ('testify5')
        INSERT INTO Employee (lastname) values ('testify6')
    `)
    .catch(console.error)
    
});

*/
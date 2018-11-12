
let mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'smms'
});
//打开数据库
connection.connect();
module.exports = connection;
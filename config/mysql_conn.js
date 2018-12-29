var mysql = require('mysql');
var db_conn=require('./local_db_conn.json');
//var db_conn=require('./live_db_conn.json');

var connection;
function handleDisconnect() {
    connection = mysql.createPool(db_conn);
    connection = mysql.createConnection(db_conn);
    connection.connect(function(err) {
        if(err) {
            console.log('error when connecting to db:', err);
            console.log('error when connecting to stack db:', err.stack);
            setTimeout(handleDisconnect, 2000);
        }
        else{
            console.log("Connected With MySQL!");
        }
    });
    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}
handleDisconnect();

module.exports=connection;

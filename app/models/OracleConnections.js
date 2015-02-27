var oracledb = require('oracledb');
var orclConfig = require('./oracleConfig');

function OracleConnectionPool() {}

OracleConnectionPool.pool = null;

oracledb.createPool (
    {
        user          : orclConfig.user,
        password      : orclConfig.password,
        connectString : orclConfig.connectString,
        poolMax       : 50,
        poolMin       : 5,
        poolIncrement : 10,
        poolTimeout   : 10
    },
    function(err, pool) {
        if (err) {
            console.error('createPool() callback: ' + err.message);
            return;
        }
        OracleConnectionPool.pool = pool;
    }
);

var exec = require('child_process').exec;
var fs = require('fs');

var cm = require('./cm');

function Utilities() {
}

Utilities.createInsertStatements = function(tablename, data) {
    'use strict';
    var columns;
    var values;
    var queries = '';

    data.forEach(function(row) {
        columns = '';
        values = '';
        for(var key in row) {
            if(/*(key != 'currentNepID') &&
                (key != 'nextNepID') &&
                (key != 'changeType') &&
                (key != 'folio') &&*/
                (typeof row[key] !== 'undefined')) {

                    columns += '\"' + key + '\", ';
                    if(typeof row[key] == 'string') {
                        values += '\'' + row[key] + '\', ';
                    } else {
                        values += row[key] + ', ';
                    }

            }
        }
        columns = columns.substring(0, columns.length - 2);
        values = values.substring(0, values.length - 2);
        queries += 'INSERT INTO ' + tablename + ' (' + columns + ') VALUES (' + values + ');\n';
    });

    return queries;

};

Utilities.executeScript = function(scriptFile, outputFile) {
    var command = 'sqlplus -s system/Elemirac1@localhost:1521/xe @' + scriptFile + ' > ' + outputFile;
    exec(command, function (error, stdout, stderr) {

    });
};

Utilities.loadCodelist = function(file) {
    var data = fs.readFileSync('./sql/' + file, {encoding: 'utf-8'});
    return JSON.parse(data);
};

Utilities.findIdBySign = function(codelist, sign) {
    var result;
    codelist.every(function(element) {
        if(element.SIGN == sign) {
            result = element.ID;
            return false;
        } else {
            return true;
        }
    });
    return result;
};

Utilities.formatId = function(number, size) {
    number = number.toString();
    while (number.length < size) number = "0" + number;
    return number;
};

Utilities.createId = function(number) {
    return cm.cadMunId + Utilities.formatId(number, 9);
};

module.exports = Utilities;

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
            if((key != 'currentNepID') &&
                (key != 'nextNepID') &&
                (key != 'changeType') &&
                (key != 'folio') &&
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

module.exports = Utilities;
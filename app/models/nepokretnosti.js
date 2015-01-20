var app = require('../../app');
console.log(app);

module.exports = {
    toMongo: function() {
        'use strict;'

        var nepokretnosti = [];

        var fs = require('fs');
        fs.readFile(__dirname + '/../../csv/Nepokretnosti.txt',{encoding: 'utf8'}, function(err, data) {
            if(err) {
                console.log('GREŠKA: Nepokretnosi.txt nije konvertovan uspešno!')
            } else {
                var rows = data.split('\n');
                rows.forEach(function(row, i) {
                    var fields = row.split(',');
                    if(fields.length > 1) {
                        var obj = {
                            MatBrKO: parseInt(fields[0]),
                            NepID: parseInt(fields[1]),
                            VrstaStanja: parseInt(fields[2]),
                            VrstaNepokretnosti: parseInt(fields[3]),
                            CREATED: fields[5],
                            RETIRED: fields[6]
                        }
                        nepokretnosti.push(obj);
                    }
                })
                db = app.db;

                db.nepokretnosti.insert(nepokretnosti, function(err, docs) {
                    if(err) {
                        console.log(err)
                    }
                })
            }
        })
    }
}
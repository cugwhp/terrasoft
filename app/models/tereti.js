var app = require('../../app');
var elprom = require('./elementarnepromene');

module.exports = {
    toMongo: function() {
        'use strict;'

        var tereti = [];

        var fs = require('fs');
        fs.readFile(__dirname + '/../../csv/Tereti.txt',{encoding: 'utf8'}, function(err, data) {
            if(err) {
                console.log('GREŠKA: Tereti.txt nije konvertovan uspešno!')
            } else {
                var start = 0, width = 659;
                while(data.length - start > width) {
                    var row = data.slice(start, start + width);

                    var obj = {
                        TerID: parseInt(row.slice(0, 11)),
                        Teret: parseInt(row.slice(11, 14)),
                        LiceID: parseInt(row.slice(14, 25)),
                        NepID: parseInt(row.slice(25, 36)),
                        OpisTereta: row.slice(36, 548),
                        DatumUpisa: row.slice(548, 567),
                        Trajanje: row.slice(567, 586),
                        DatumBrisanja: row.slice(586, 605),
                        CREATED: row.slice(605, 624),
                        RETIRED: row.slice(624, 643),
                        VrstaStanja: parseInt(row.slice(643, 646)),
                        LiceIDTeret: parseInt(row.slice(646, 657))
                    }

                    tereti.push(obj);
                    start += width;
                }
                var row = data.slice(start);

                var obj = {
                    TerID: parseInt(row.slice(0, 11)),
                    Teret: parseInt(row.slice(11, 14)),
                    LiceID: parseInt(row.slice(14, 25)),
                    NepID: parseInt(row.slice(25, 36)),
                    OpisTereta: row.slice(36, 548),
                    DatumUpisa: row.slice(548, 567),
                    Trajanje: row.slice(567, 586),
                    DatumBrisanja: row.slice(586, 605),
                    CREATED: row.slice(605, 624),
                    RETIRED: row.slice(624, 643),
                    VrstaStanja: parseInt(row.slice(643, 646)),
                    LiceIDTeret: parseInt(row.slice(646, 657))
                }

                tereti.push(obj);

                db = app.db;

                db.tereti.insert(tereti, function(err, docs) {
                    if(err) {
                        console.log(err)
                    }
                })
            }
        })
    },

    findRestrictions: function(nId) {
        var db = app.db;
        return db.tereti.find({NepID: nId}).toArray();
    }
}

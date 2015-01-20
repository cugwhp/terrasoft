var app = require('../../app');
console.log(app);

module.exports = {
    toMongo: function() {
        'use strict;'

        var transakcije = [];

        var fs = require('fs');
        fs.readFile(__dirname + '/../../csv/Transakcije.txt',{encoding: 'utf8'}, function(err, data) {
            if(err) {
                console.log('GREŠKA: Transakcije.txt nije konvertovan uspešno!')
            } else {
                var start = 0, width = 1128;
                while(data.length - start > width) {
                    var row = data.slice(start, start + width);

                    var obj = {
                        BrojPromene: parseInt(row.slice(0, 6)),
                        GodinaPromene: parseInt(row.slice(6, 10)),
                        PredmetID: parseInt(row.slice(10, 21)),
                        MatBrKO: parseInt(row.slice(21, 32)),
                        VrstaPromene: parseInt(row.slice(32, 35)),
                        StatusPromene: row.slice(35, 38),
                        TransID: parseInt(row.slice(38, 49)),
                        VremePocetka: row.slice(49, 68),
                        VremeZavrsetka: row.slice(68, 87),
                        Dokument: row.slice(87, 599),
                        Razlog: row.slice(599, 1111),
                        NovcaniIznos: parseInt(row.slice(1111, 1124)),
                        PlacenaNaknada: parseInt(row.slice(1124, 1026))
                    }

                    transakcije.push(obj);
                    start += width;
                }
                var row = data.slice(start);

                var obj = {
                    BrojPromene: parseInt(row.slice(0, 6)),
                    GodinaPromene: parseInt(row.slice(6, 10)),
                    PredmetID: parseInt(row.slice(10, 21)),
                    MatBrKO: parseInt(row.slice(21, 32)),
                    VrstaPromene: parseInt(row.slice(32, 35)),
                    StatusPromene: row.slice(35, 38),
                    TransID: parseInt(row.slice(38, 49)),
                    VremePocetka: row.slice(49, 68),
                    VremeZavrsetka: row.slice(68, 87),
                    Dokument: row.slice(87, 599),
                    Razlog: row.slice(599, 1111),
                    NovcaniIznos: parseInt(row.slice(1111, 1124)),
                    PlacenaNaknada: parseInt(row.slice(1124, 1026))
                }

                transakcije.push(obj);

                db = app.db;

                db.transakcije.insert(transakcije, function(err, docs) {
                    if(err) {
                        console.log(err)
                    }
                })
            }
        })
    }
}

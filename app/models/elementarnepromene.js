var app = require('../../app');

module.exports = {
    toMongo: function() {
        'use strict;'

        var elPromene = [];

        var fs = require('fs');
        fs.readFile(__dirname + '/../../csv/ElementarnePromene.txt',{encoding: 'utf8'}, function(err, data) {
            if(err) {
                console.log('GREŠKA: ElementarnePromene.txt nije konvertovan uspešno!')
            } else {
                var rows = data.split('\n');
                rows.forEach(function(row, i) {

                    var fields = row.split(',');
                    if(fields.length > 1) {
                        var obj = {
                            TransID: parseInt(fields[0]),
                            Tabela: parseInt(fields[1]),
                            MatBrKO: parseInt(fields[2]),
                            TabelaID: parseInt(fields[3]),
                            VrstaZakljucavanja: fields[4],
                            ElemPromID: parseInt(fields[5]),
                            VrstaStanja: parseInt(fields[6]),
                            NoviID: parseInt(fields[7]),
                            UserName: fields[8],
                            VremeUpisa:  fields[9]
                        }
                        elPromene.push(obj);
                    }
                })
                db = app.db;

                db.elpromene.insert(elPromene, function(err, docs) {
                    if(err) {
                        console.log(err)
                    }
                })
            }
        })
    },

    find: function(t, tId) {
        return app.db.elpromene.find({$query: {Tabela: t, TabelaID: tId}, $orderby: {ElemPromID: 1}}).toArray()
    }
}

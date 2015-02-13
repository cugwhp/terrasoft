var app = require('../../app');

function Owners() {

};

Owners.partyId = 0;

Owners.toMongo = function() {
    //var app = require('../../app');
    var conn = app.adodb.knl;
    var mongo = app.db;

    /*
     MatBrNasUli
     RbBrUli
     VrstaLica
     MatBrLica
     Prezime
     Ime
     ImeRoditelja
     Napomena
     LiceID
     PostanskiBroj
     Drzava
     Mesto
     Ulica
     KucniBroj
     KucniPodbroj
     BrojStana
     SifraPoreskogObveznika
     IndOtpisa
     MatBrSlu
     Drzavljanstvo
     VaziOd
     UserName
     RazlogPromene
     OldID
     */

    conn.query('SELECT * FROM Lica')
        .on('done', function(data) {
            var preparedData = data.records.map(function(rec) {
                rec.CREATED = rec.CREATED ? new Date(rec.CREATED) : null;
                rec.RETIRED = rec.RETIRED ? new Date(rec.RETIRED) : null;
                return rec;
            });
            mongo.lica.insert(preparedData)
                .then(function() {
                    console.log('Učitana tabela Lica');
                })
                .catch(function(err, rejected) {
                    console.log('MongoDB Error:');
                    console.log(err);
                    console.log(rejected);
                })
                .done();
        })
        .on('fail', function(err) {
            console.log('Access Error:');
            console.log(err);
        })
};

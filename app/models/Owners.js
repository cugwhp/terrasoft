var app = require('../../app');
var cm = require('./cm');

var Utilities = require('./Utilities');

function Owners() {

};

Owners.RS_OWNER_SEQUENCE = 'KNZ_VOZD.RSOWNER_SEQ' + cm.cadMunId;

Owners.clear = function() {
    var mongo = app.db;
    return mongo.lica.remove({});
};

Owners.toMongo = function() {
    //var app = require('../../app');
    var conn = app.adodb.knl;
    var mongo = app.db;
    conn.query('SELECT ' +
        'MatBrNasUli, ' +
        'RbBrUli, ' +
        'VrstaLica, ' +
        'MatBrLica, ' +
        'Prezime, ' +
        'Ime, ' +
        'ImeRoditelja, ' +
        'Napomena, ' +
        'LiceID, ' +
        'PostanskiBroj, ' +
        'Drzava, ' +
        'Mesto, ' +
        'Ulica, ' +
        'KucniBroj, ' +
        'KucniPodbroj, ' +
        'BrojStana, ' +
        'SifraPoreskogObveznika, ' +
        'IndOtpisa, ' +
        'MatBrSlu, ' +
        'Drzavljanstvo, ' +
        'Format(VaziOd, "yyyy/mm/dd HH:mm:ss") AS VaziOd, ' +
        'UserName, ' +
        'RazlogPromene, ' +
        'OldID ' +
        'FROM Lica')
        .on('done', function(data) {
            var preparedData = data.records.map(function(rec) {
                rec.VaziOd = rec.VaziOd ? new Date(rec.VaziOd) : null;
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

Owners.createRsOwner = function(owner) {
    var name = owner.Ime;
    var surname = owner.Prezime;
    var middlename = owner.ImeRoditelja;

    if((owner.VrstaLica != 2000) && (owner.VrstaLica != 2001)) {
        name = owner.Prezime;
        surname = '';
        middlename = '';
    }

    return {
        PARTYID: Utilities.createId(owner.LiceID), //Owners.RS_OWNER_SEQUENCE + '.NEXTVAL',
        ADDRESSID: null,
        PARTYTYPEID: Utilities.findIdBySign(Owners.laPartytype, owner.VrstaLica),
        PARTYROLEID: null,
        NAME: name,
        PERSONALNUM: owner.MatBrLica,
        ACTIVE: 1, //u bazi Lazarevac nema promena na licima
        PASSPORTNUM: null,
        PERSONALID: null,
        CHANGEID: null, //u bazi Lazarevac nema promena na licima
        CHANGEID1: null, //u bazi Lazarevac nema promena na licima
        SURNAME: surname,
        MIDDLENAME: middlename
    }
};

Owners.process = function() {
    var mongo = app.db;

    Owners.laPartytype = Utilities.loadCodelist('la_partytype.json');

    var resultPromise = mongo.lica.find({})
        .toArray()
        .then(function(owners) {
            var rsOwner = owners.map(Owners.createRsOwner);
            return rsOwner;
        });

    return resultPromise;
};

Owners.laPartytype = [];

module.exports = Owners;
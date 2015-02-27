var Q = require('q');
var app = require('../../app');
var Transactions = require('./Transactions');
var ElementaryChanges = require('./ElementaryChanges');

function Evidentions() {
    this.data = null;
}

Evidentions.toMongo = function() {
    var conn = app.adodb.kns;
    var mongo = app.db;
    conn.query('SELECT PredmetID, ' +
        'BrojPredmeta, ' +
        'StatusPredmeta, ' +
        'VezaSaPredmetom, ' +
        'Format(VremePodnosenja, "yyyy/mm/dd HH:mm:ss") AS VremePodnosenja,' +
        'PoSluzbenojDuznosti, ' +
        'PodneoZahtev, ' +
        'BrojResenja2, ' +
        'Format(VremeResenja, "yyyy/mm/dd HH:mm:ss") AS VremeResenja, ' +
        'StampaoResenje, ' +
        'Format(DatumDostave, "yyyy/mm/dd HH:mm:ss") AS DatumDostave, ' +
        'RokZaZalbu, ' +
        'Format(DatumZalbe, "yyyy/mm/dd HH:mm:ss") AS DatumZalbe, ' +
        'PodneoZalbu, ' +
        'Format(VremeIzvrsnosti, "yyyy/mm/dd HH:mm:ss") AS VremeIzvrsnosti, ' +
        'ProglasioIzvrsnim, ' +
        'LiceID, ' +
        'Format(DatumKonacnosti, "yyyy/mm/dd HH:mm:ss") AS DatumKonacnosti, ' +
        'Format(VremeAktiviranja, "yyyy/mm/dd HH:mm:ss") AS VremeAktiviranja, ' +
        'Aktivirao, ' +
        'PlacenaTaksa ' +
        'FROM Predmeti')
        .on('done', function(data) {
            //this.data = data.records;
            var preparedData = data.records.map(function(rec) {
                rec.VremePodnosenja =  rec.VremePodnosenja ? new Date(rec.VremePodnosenja) : null;
                rec.VremeResenja = rec.VremeResenja ? new Date(rec.VremeResenja) : null;
                rec.DatumDostave = rec.DatumDostave ? new Date(rec.DatumDostave) : null;
                rec.DatumZalbe = rec.DatumZalbe ? new Date(rec.DatumZalbe) : null;
                rec.VremeIzvrsnosti = rec.VremeIzvrsnosti ? new Date(rec.VremeIzvrsnosti) : null;
                rec.DatumKonacnosti = rec.DatumKonacnosti ? new Date(rec.DatumKonacnosti) : null;
                rec.VremeAktiviranja = rec.VremeAktiviranja ? new Date(rec.VremeAktiviranja) : null;
                return rec;
            });
            mongo.predmeti.insert(preparedData)
                .catch(function(err, rejected) {
                    console.log('MongoDB Error:');
                    console.log(err);
                    console.log(rejected);
                })
        })
        .on('fail', function(err) {
            console.log('Access Error:');
            console.log(err);
        })
};

Evidentions.loadByTimeOfSubmission = function() {
    var mongo = app.db;
    return mongo.predmeti.find({$query:{VremeIzvrsnosti: {$type: 10} }, $orderBy: {VremePodnosenja: 1}}).toArray();
};

Evidentions.loadByTimeOfExecution = function() {
    var mongo = app.db;
    return mongo.predmeti.find({$query:{}, $orderBy: {VremeIzvrsnosti: 1}}).toArray();
};

Evidentions.process = function(evidentions) {
    return evidentions.reduce(function (promise, evidention) {
        return promise.then(function () {
            return Evidentions.processEvidention(evidention);
        });
    }, Q([]));
};

Evidentions.processEvidention = function(evidention) {
    var mongo = app.db;
    if(evidention.StatusPredmeta != 5) {
        console.log('Obrađuje se predmet sa id: ' + evidention.PredmetID + ', i brojem: ' + evidention.BrojPredmeta);
        return mongo.transakcije.find({$query: {PredmetID: evidention.PredmetID}, $orderBy: {TransID: 1}})
            .toArray()
            .then(function(transactions) { //transakcije se obradjuju sekvencijalno
                evidention.transactions = transactions;
                return Transactions.process(transactions);
            });
    } else {
        return Q([]);
    }
};


module.exports = Evidentions;
var Q = require('q');
var app = require('../../app');
var ElementaryChanges = require('./ElementaryChanges');
var cm = require('./cm');
var Utilities = require('./Utilities');

function Transactions() {
}

Transactions.toMongo = function() {
    var conn = app.adodb.kns;
    var mongo = app.db;
    conn.query('SELECT * FROM Transakcije')
        .on('done', function(data) {
            mongo.transakcije.insert(data.records)
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

Transactions.process = function(transactions) {
    return transactions.reduce(function(promise, transaction) {
        return promise.then(function() {
            return Transactions.processTransaction(transaction);
        });
    }, Q([]));
};

Transactions.processTransaction = function(transaction) {
    var mongo = app.db;

    console.log('Obrađuje se transakcija sa id: ' + transaction.TransID + ', brojem predmeta: ' + transaction.PredmetID);

    return mongo.elpromene.find({$query: {TransID: transaction.TransID}, $orderBy: {ElemPromID: 1}})
        .toArray()
        .then(function(changes) { // elementare promene se ne obradjuju po nekom definisanom redosledu
            transaction.changes = changes;
            var changelist = Transactions.toKnzChangelist(transaction);
            //Transactions.insertStatements += Utilities.createInsertStatements('KNZ_VOZD.N_RS_CHANGELIST', [changelist]);
            return ElementaryChanges.process(changes, changelist.ID);
        });
};

Transactions.id = 3000000;

Transactions.insertStatements = '';

Transactions.toKnzChangelist = function(transaction) {
    var knzChange = {
        ACTIVE: 3,
        CADDISTID: cm.cadDistId,
        CADMUNID: cm.cadMunId,
        CHANGETYPEID: transaction.VrstaPromene, //SELECT ...
        CLASS: null,
        COUNTRYID: cm.countryId,
        DESCRIPTION: transaction.Dokument,
        EVIDENTION: transaction.PredmetID, //Select ...
        ID: Transactions.id++,
        NUMBER: null,
        NUMBERCL: transaction.BrojPromene,
        NUMIDX: null,
        ORGUNIT: null,
        PARTYID: null,
        REGDATE: null, //transaction.VremePocetka,
        REGTIME: null,
        STATUS: 6, //transaction.evidention.StatusPredmeta,
        SUBTYPE: null,
        YEAR: transaction.GodinaPromene,
        YEAR1: null
    }
    return knzChange;
};

module.exports = Transactions;

var Q = require('q');

var app = require('../../app');
var PartsOfParcels = require('./PartsOfParcels');

var cm = require('./cm');

function Parcels() {
}

Parcels.clear = function() {
    var mongo = app.db;
    return mongo.parcele.remove({});
};

Parcels.toMongo = function() {
    var conn = app.adodb.kn;
    var mongo = app.db;
    conn.query('SELECT * FROM PARCELA')
        .on('done', function(data) {
            this.data = data.records;
            mongo.parcele.insert(this.data)
                .then(function() {
                    console.log('Učitana tabela PARCELA');
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

Parcels.find = function(parcelNum, parcelSubNum, result) {
    var condition = {};
    condition.BrParc = parcelNum;
    if(parcelSubNum) {
        condition.PodbrParc = parcelSubNum;
    }
    return app.db.parcele.find({$query: condition, $orderBy:{NepID: 1}}).toArray()
        .then(function(parcels) {
            return parcels.reduce(function(promise, parcel) {
                return promise.then(function() {
                    result.push(parcel);
                    return PartsOfParcels.find(parcel);
                });
            }, Q([]));
        });
};

Parcels.suid = 0;

Parcels.toKnz = function(p) {
    var knzP = {
        SUID: Parcels.suid++,
        NUMBER: p.BrParc,
        NUMIDX: p.PodbrParc,
        ADDRESSID: null,
        DIMENSIONID: null,
        VOLUMEVALUEID: null,
        COUNTRYID: cm.countryId,
        CADDISTID: cm.cadDistId,
        CADMUNID: cm.cadMunId,
        LABEL: null,
        AREA: p.Povrsina,
        BEGINLIFESPANVERSION: null,
        ENDLIFESPANVERSION: null
    }
    return knzP;
};

module.exports = Parcels;
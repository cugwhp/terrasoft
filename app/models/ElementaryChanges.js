'use strict;'

var app = require('../../app');
var Q = require('q');

function ElementaryChanges() {
}

ElementaryChanges.process = function(changes, changelistId) {
    return changes.reduce(function(promise, change) {
        return promise.then(function() {
            change.changelistId = changelistId;
            return ElementaryChanges.processChange(change);
        });
    }, Q([]));
};

ElementaryChanges.processChange = function(change) {
    var table = change.Tabela;
    if(table == 1) {
        return ElementaryChanges.processChangeOnRealEstate(change)
    } else if(table == 2) {
        return Q()//this.processChangeOnLegalRelations(change)
    } else if(table == 3) {
        return Q()//this.processChangeOnRestrictions(change)
    } else if(table == 3) {
        return Q()//this.processChangeOnPersons(change)
    }
};

ElementaryChanges.processChangeOnRealEstate = function(change) {
    var mongo = app.db;

    console.log('Promena ' + change.ElemPromID + ', Transakcija ' + change.TransID);
    return mongo.nepokretnosti.findOne({NepID: change.TabelaID})
        .then(function(realEstate) {
            if(realEstate.VrstaNepokretnosti == 1) {
                return mongo.parcele.findAndModify({
                    query: {NepID: realEstate.NepID},
                    update: {$push: {changes: change}}
                })
            } else if(realEstate.VrstaNepokretnosti == 2) {
                return mongo.deloviparcela.findAndModify({
                    query: {NepID: realEstate.NepID},
                    update: {$push: {changes: change}}
                })
            } else if(realEstate.VrstaNepokretnosti == 3) {
                return mongo.objekti.findAndModify({
                    query: {NepID: realEstate.NepID},
                    update: {$push: {changes: change}}
                })
            } else if(realEstate.VrstaNepokretnosti == 4) {
                return mongo.deloviobjekata.findAndModify({
                    query: {NepID: realEstate.NepID},
                    update: {$push: {changes: change}}
                })
            }
        });
};

module.exports = ElementaryChanges;
var app = require('../../app');
var Q = require('q')
var ch = require('./elementarnepromene')
var promiseWhile = require('./utils').promiseWhile

module.exports = {
    toMongo: function() {
        'use strict;'

        var odnosi = [];

        var fs = require('fs');
        fs.readFile(__dirname + '/../../csv/OdnosiMedjuNepokretnosti.txt',{encoding: 'utf8'}, function(err, data) {
            if(err) {
                console.log('GREŠKA: OdnosiMedjuNepokretnosti.txt nije konvertovan uspešno!')
            } else {
                var rows = data.split('\n');
                rows.forEach(function(row, i) {
                    var fields = row.split(',');
                    if(fields.length > 1) {
                        var obj = {
                            NepIDNadr: parseInt(fields[0]),
                            NepIDPodr: parseInt(fields[1]),
                            VrstaOdnosa: parseInt(fields[2]),
                            CREATED: fields[3],
                            RETIRED: fields[4],
                            ID: parseInt(fields[5])
                        }
                        odnosi.push(obj);
                    }
                })
                db = app.db;
                db.odnosinep.insert(odnosi, function(err, docs) {
                    if(err) {
                        console.log(err)
                    }
                })
            }
        })
    },

    findBySuperiorId: function(supId) {
        return app.db.odnosinep.find({NepIDNadr: supId}).toArray();
    },

    processHistory: function(reFeature, collection) {
        var reFeatureHistory = [reFeature],
            reFeatureNepID = reFeature.NepID,
            changes;

        return promiseWhile(function() {
            return changes ? changes.length > 0 : true
        }, function() {
            return ch.find(1, reFeature.NepID)
                .then(function(resultSet) {
                    changes = resultSet;
                    return Q.all(changes.map(function(change, i) {
                        reFeature.nextChange = change
                        if (change.NoviID) {
                            console.log('A')
                            return app.db[collection].find({NepID: change.NoviID}).toArray()
                                .then(function (reFeatures) {
                                    if (reFeatures.length > 0) {
                                        reFeature = reFeatures[0]
                                        reFeature.nextChange = null
                                        reFeatureHistory.push(reFeature)
                                    } else {
                                        changes = []
                                    }
                                })
                        } else {
                            reFeatureHistory.push(reFeature)
                            if(i == changes.length - 1) {
                                changes = []
                            }
                        }
                    }))
                })
        })
            .then(function() {
                return reFeatureHistory
            })
    },

    processParcelHistory: function(parcelHistory) {
        while(parcelHistory.length > 0) {
            var partsHistory = processPartsOfParcelHistory(parcelHistory[0].parts)
        }
    },

    processPartsOfParcelHistory: function(parcel) {

    }
}
var Q = require('q')
var app = require('../../app')
var reRelations = require('./odnosinepokretnosti')
var changes = require('./elementarnepromene')

function findByReIds(reIds) {
    return app.db.deloviobjekata.find({NepID: {$in: reIds}}).toArray()
}

module.exports = {
    toMongo: function() {
        var deloviobjekata = [];

        var fs = require('fs');
        fs.readFile(__dirname + '/../../csv/DEOOBJEKTA.txt',{encoding: 'utf8'}, function(err, data) {
            if(err) {
                console.log('GREŠKA: DEOOBJEKTA.txt nije konvertovan uspešno!')
            } else {
                var rows = data.split('\n');
                rows.forEach(function(row, i) {
                    var fields = row.split(',');
                    if(fields.length > 1) {
                        var obj = {
                            NepID       : parseInt(fields[0]),
                            EvidBrDO    : parseInt(fields[1]),
                            NacUtvPov   : parseInt(fields[2]),
                            BrojSoba    : fields[3],
                            BrojSprata  : fields[4],
                            KoriscDO    : parseInt(fields[5]),
                            BrStana     : fields[6],
                            PbrStana    : fields[7],
                            PovDO       : parseFloat(fields[8]),
                            OpisDO      : fields[9],
                            MatBrNas    : parseInt(fields[10]),
                            MatBrUli    : parseInt(fields[11]),
                            KcBroj      : fields[12],
                            KcPodbr     : fields[13],
                            GradjPovDO  : parseFloat(fields[14])

                        }
                        deloviobjekata.push(obj);
                    }
                })
                db = app.db;
                db.deloviobjekata.insert(deloviobjekata, function(err, docs) {
                    if(err) {
                        console.log(err)
                    }
                })
            }
        })
    },

    findOld: function(bldReId) {
        var retPromise = reRelations.findBySuperiorId(bldReId)
            .then(function(relations) {
                var partOfBldReIds = relations.map(function(relation) {
                    return relation.NepIDPodr;
                })
                return findByReIds(partOfBldReIds)
            })
            .then(function(parts) {
                return Q.all(parts.map(function(part) {
                    return changes.find(1, part.NepID)
                        .then(function(changesOfPart) {
                            part.changes = changesOfPart;
                            return part;
                        })
                }))
            })
        return retPromise
    },

    find: function(building) {
        var retPromise = reRelations.findBySuperiorId(building.NepID)
            .then(function(relations) {
                var partOfBldReIds = relations.map(function(relation) {
                    return relation.NepIDPodr;
                })
                return findByReIds(partOfBldReIds)
            })
            .then(function(parts) {
                return Q.all(parts.map(function(part) {
                    return changes.find(1, part.NepID)
                        .then(function(changesOfPart) {
                            part.changes = changesOfPart;
                            part.parent = building;
                            return part;
                        })
                }))
            })
        return retPromise
    }
}
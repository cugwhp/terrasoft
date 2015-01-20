var Q = require('q')
var app = require('../../app')
var reRelations = require('./odnosinepokretnosti')
var changes = require('./elementarnepromene')
var partofbuilding = require('./partofbuilding')

function findByReIds(reIds) {
    return app.db.objekti.find({NepID: {$in: reIds}}).toArray()
}

function findParts(building) {
    return partofbuilding.find(building)
}

function findChanges(building) {
    return changes.find(1, building.NepID)
        .then(function(changesOfBuilding) {
            return changesOfBuilding;
        })
}

module.exports = {

    findOld: function(ppartReId) {
        var retPromise = reRelations.findBySuperiorId(ppartReId)
            .then(function(relations) {
                var bldReIds = relations.map(function(relation) {
                    return relation.NepIDPodr;
                })
                return findByReIds(bldReIds)
            })
            .then(function(buildings) {
                return Q.all(buildings.map(function(building) {
                    return Q.all([findParts(building), findChanges(building)])
                        .then(function(results) {
                            building.parts = results[0]
                            building.changes = results[1]
                            return building;
                        })
                }))
            })
        return retPromise
    },

    find: function(ppart) {
        var retPromise = reRelations.findBySuperiorId(ppart.NepID)
            .then(function(relations) {
                var bldReIds = relations.map(function(relation) {
                    return relation.NepIDPodr;
                })
                return findByReIds(bldReIds)
            })
            .then(function(buildings) {
                return Q.all(buildings.map(function(building) {
                    return Q.all([findParts(building), findChanges(building)])
                        .then(function(results) {
                            building.parts = results[0];
                            building.changes = results[1];
                            building.parent = ppart;
                            return building;
                        })
                }))
            })
        return retPromise
    },

    process: function(buildings) {
        var buildingsHistory = [[]];
        var i = 0;
        var newBuilding = true;
        if(!buildings) {
            return [];
        }
        while(buildings.length > 0) {
            var nextBuilding = buildings[0];
            buildings.splice(0, 1);

            while(nextBuilding) {
                var j = 0;
                var newId = null;
                if (nextBuilding.changes.length == 0) {
                    buildingsHistory[i].push({
                        building: nextBuilding,
                        prevChange: null,
                        nextChange: null
                    });
                    nextBuilding = null;
                } else {
                    while (j < nextBuilding.changes.length && !newId) {
                        var prevChange = null;
                        if (j > 0 || !newBuilding) {
                            prevChange = buildingsHistory[i][buildingsHistory[i].length - 1].nextChange;
                        }
                        if (nextBuilding.changes[j].VrstaZakljucavanja == '\"O\"'
                            || nextBuilding.changes[j].VrstaZakljucavanja == '\"D\"'
                            || nextBuilding.changes[j].VrstaZakljucavanja == '\"U\"') {
                            buildingsHistory[i].push({
                                building: nextBuilding,
                                prevChange: prevChange,
                                nextChange: nextBuilding.changes[j]
                            });
                            newId = null;
                            j++;
                        } else if (nextBuilding.changes[j].VrstaZakljucavanja == '\"A\"') {
                            buildingsHistory[i].push({
                                building: nextBuilding,
                                prevChange: prevChange,
                                nextChange: nextBuilding.changes[j]
                            });
                            newId = nextBuilding.changes[j].NoviID
                            j++;
                        }

                    }
                    if (newId) {
                        buildings.forEach(function (building, k) {
                            if (building.NepID == newId) {
                                nextBuilding = building;
                                buildings.splice(k, 1);
                                newBuilding = false;
                            }
                        })
                    } else {
                        nextBuilding = null;
                    }
                }
            }

            newBuilding = true;
            buildingsHistory.push([]);
            i++;

        }

        console.log('F');

        return buildingsHistory;

    },

    toMongo: function() {
        'use strict;'

        var objekti = [];

        var fs = require('fs');
        fs.readFile(__dirname + '/../../csv/OBJEKAT.txt',{encoding: 'utf8'}, function(err, data) {
            if(err) {
                console.log('GREŠKA: OBJEKAT.txt nije konvertovan uspešno!')
            } else {
                var rows = data.split('\n');
                rows.forEach(function(row, i) {
                    var fields = row.split(',');
                    if(fields.length > 1) {
                        var obj = {
                            MatBrNas        : parseInt(fields[0]),
                            MatBrUli        : parseInt(fields[1]),
                            KcBroj          : fields[2],
                            KcPodbr         : fields[3],
                            Koriscenje      : parseInt(fields[4]),
                            StatusObjekta   : parseInt(fields[5]),
                            NepID           : parseInt(fields[6]),
                            BrSpratPodrum   : parseInt(fields[7]),
                            Prizemlje       : parseInt(fields[8]),
                            BrSpratNadz     : parseInt(fields[9]),
                            BrSpratPotkrov  : parseInt(fields[10]),
                            IndSuvlasnistva : fields[11],
                            OpisObj         : fields[12],
                            Povrsina        : parseInt(fields[13])
                        }
                        objekti.push(obj);
                    }
                })
                db = app.db;
                db.objekti.insert(objekti, function(err, docs) {
                    if(err) {
                        console.log(err)
                    }
                })
            }
        })
    }
}

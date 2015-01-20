var app = require('../../app');
var reRelations = require('./odnosinepokretnosti');
var building = require('./building');
var ch = require('./elementarnepromene')
var cm = require('./cm')
var Q = require('q');
var promiseWhile = require('./utils').promiseWhile

function findByReIds(reIds) {
    return app.db.deloviparcela.find({NepID: {$in: reIds}}).toArray()
}

function findBuildings(ppart) {
    return building.find(ppart)
}

function findChanges(ppart) {
    return ch.find(1, ppart.NepID)
        .then(function(changesOfPPart) {
            return changesOfPPart;
        })
}

/*
 @param pp: deo parcele koji se obrađuje,
 @return niz promena u obliku [{preth. promena, nova promena}]
 */
function processChanges(parcelPart, changeList) {
    var retVal = [];
    var newChange;
    console.log(changeList)
    if(parcelPart.changes.length == 0) {
        if(changeList.length > 0) {
            newChange = {
                chid: changeList[changeList.length - 1].chid1,
                chid1: null
            }
            changeList.push(newChange)
            retVal.push(newChange)
        } else {
            newChange = {
                chid: null,
                chid1: null
            }
            changeList.push(newChange)
            retVal.push(newChange)
        }
    }

    parcelPart.changes.forEach(function(change) {
        //if(change.VrstaZakljucavanja == '\"O\"' || change.VrstaZakljucavanja == '\"U\"') {
            if(changeList.length > 0) {
                newChange = {
                    chid: changeList[changeList.length - 1].chid1,
                    chid1: change.TransID
                }
                changeList.push(newChange)
                retVal.push(newChange)
            } else {
                newChange = {
                    chid: null,
                    chid1: change.TransID
                }
                changeList.push(newChange)
                retVal.push(newChange)
            }
            return true
        //} else {
        //    return false
        //}
    })

    return retVal;
}

function createFolio(uid, chid, chid1, numberrf, numidrfx, rlp) {
    var folio = {
        UID: uid,
        CHANGELISTID: chid,
        CHANGELISTID1: chid1,
        COUNTRYID: cm.countryId,
        CADDISTID: cm.cadDistId,
        CADMUNID: cm.cadMunId,
        PARTYID: null,
        NAME: null,
        BEGINLIFESPANVERSION: null,
        ENDLIFESPANVERSION: null,
        NUMBERRF: numberrf,
        NUMIDXRF: numidrfx,
        ACTIVE: 0,
        TEXT: '',
        JOURNALNUM: null,
        RLP: rlp,
        RLO: null,
        RLS: null
    }
    return folio;
}

function createKnzPartOfParcel(parcel, parcelPart, folio) {
    var ha = Math.floor(parcelPart.Povrsina / 10000),
        a = Math.floor((parcelPart.Povrsina - ha * 10000) / 100),
        m = parcelPart.Povrsina - (ha * 10000 + a * 100);

    var orclPP = {
        PARCELID: parcel.id,
        NUMBER: parcel.BrParc,
        NUMIDX: parcel.PodbrParc,
        SUID: null,
        SEQUENCE: parcelPart.BrDelaParc,
        BASISID: null,
        DIMENSION: null,
        VOLUMEVALUE: null,
        BONITETID: null,
        WAYUSEID: parcelPart.Kultura, //(SELECT ID FROM N_CL_WAYOFUSE WHERE SIGN = pp.Kultura),
        CHANGELISTID: folio.CHANGELISTID, //??
        ADDRESSID: null,
        PROPSECID: null,
        CLOSEDAREAID: parcelPart.MatBrSK, //(SELECT ID FROM N_CL_CLOSEDAREA WHERE SIGN = p.MatBrSK),
        LANDADDRESSID: null,
        PURPOSEPARCELID: parcelPart.VrZem, //(SELECT ID FROM N_CL_CLOSEDAREA WHERE SIGN = p.MatBrSK)
        UID: folio.UID,
        WRITEINID: null,
        WRITEOFFID: null,
        LABEL: null,
        AREA: parcelPart.Povrsina,
        BEGINLIFESPANVERSION: null,
        ENDLIFESPANVERSION: null,
        PLANNUM: parcel.BrPlana,
        SKETCHNUM: parcel.BrSkice,
        COMMENT_P: null,
        ACTIVE: null,
        CHANGELISTID1: folio.CHANGELISTID1,
        MANUAL: parcel.BrManuala,
        HEKTAR: ha,
        AR: a,
        METAR: m,
        YEAR: parcel.GodSkMan,
        SPECPURPOSEID: null,
        CADASTRALINCOME: null
    }
    return orclPP;
}

function processHistory(parcelPart) {
    var partHistory = [parcelPart],
        partNepID = parcelPart.NepID,
        changes

    return promiseWhile(function() {
        console.log(changes)
        return changes ? changes.length > 0 : true
    }, function() {
        return ch.find(1, parcelPart.NepID)
            .then(function(resultSet) {
                changes = resultSet
                return Q.all(changes.map(function(change) {
                    parcelPart.nextChange = change
                    return app.db.deloviparcela.find({NepID: change.NoviID}).toArray()
                        .then(function(parts) {
                            if(parts.length > 0) {
                                parcelPart = parts[0]
                                parcelPart.nextChange = null
                                partHistory.push(parcelPart)
                            } else {
                                changes = []
                            }
                        })
                }))
            })
    })
    .then(function() {
        return partHistory
    })
}

module.exports = {
    toMongo: function() {
        'use strict;'

        var deloviparcela = [];

        var fs = require('fs');
        fs.readFile(__dirname + '/../../csv/DEOPARC.txt',{encoding: 'utf8'}, function(err, data) {
            if(err) {
                console.log('GREŠKA: DEOPARC.txt nije konvertovan uspešno!')
            } else {
                var rows = data.split('\n');
                rows.forEach(function(row, i) {
                    var fields = row.split(',');
                    if(fields.length > 1) {
                        var obj = {
                            NepID       : parseInt(fields[0]),
                            BrDelaParc  : parseInt(fields[1]),
                            Kultura     : parseInt(fields[2]),
                            Povrsina    : parseInt(fields[3]),
                            Fakticko    : parseInt(fields[6])
                        }
                        deloviparcela.push(obj);
                    }
                })
                db = app.db;
                db.deloviparcela.insert(deloviparcela, function(err, docs) {
                    if(err) {
                        console.log(err)
                    }
                })
            }
        })
    },

    findOld: function(parcelReId) {
        var retPromise = reRelations.findBySuperiorId(parcelReId)
            .then(function(relations) {
                var ppartReIds = relations.map(function(relation) {
                    return relation.NepIDPodr;
                })
                return findByReIds(ppartReIds)
            })
            .then(function(pparts) {
                return Q.all(pparts.map(function(ppart) {
                    return Q.all([findBuildings(ppart), findChanges(ppart)])
                        .then(function(results) {
                            ppart.buildings = results[0]
                            ppart.changes = results[1]
                            return ppart;
                        })
                }))
            })
        return retPromise
    },

    find: function(parcel) {
        var retPromise = reRelations.findBySuperiorId(parcel.NepID)
            .then(function(relations) {
                var ppartReIds = relations.map(function(relation) {
                    return relation.NepIDPodr;
                })
                return findByReIds(ppartReIds)
            })
            .then(function(pparts) {
                return Q.all(pparts.map(function(ppart) {
                    return Q.all([findBuildings(ppart), findChanges(ppart)])
                        .then(function(results) {
                            ppart.buildings = results[0]
                            ppart.changes = results[1]
                            ppart.parent = parcel;
                            return ppart;
                        })
                }))
            })
        return retPromise
    },

    process: function(parcel) {
        var rlp = 1;
        var numidrfx = 1;
        var tempUid = 0;
        var orclFolios = [];
        var orclPartsOfParcel = [];
        var orclChangeList = [];
        parcel.parts.forEach(function(part, i) {
            console.log(part)
            var changeList = processChanges(part, orclChangeList)
            changeList.forEach(function(changePair) {
                var f = createFolio(tempUid, changePair.chid, changePair.chid1, parcel.BrojLN, numidrfx, rlp)
                orclFolios.push(f)

                var pp = createKnzPartOfParcel(parcel, part, f)
                orclPartsOfParcel.push(pp)

                tempUid++;
                numidrfx++;
            })
            if((i < parcel.parts.length - 1) && (part.BrDelaParc != parcel.parts[i+1].BrDelaParc)) { //Ne nastavlja se
                var lastFolio = orclFolios[orclFolios.length - 1];
                lastFolio.ACTIVE = 1;
                numidrfx = 1;
                rlp++;
                orclChangeList = [];
            }
        })
        var retVal = {
            folios: orclFolios,
            partsOfParcel: orclPartsOfParcel
        };
        console.log(retVal);
        return retVal;
    },

    processHistory: processHistory,

    findBuildings: findBuildings


}
var Q = require('q');

var app = require('../../app');
var Buildings = require('./Buildings');
var Utilities = require('./Utilities');
var Restrictions = require('./Restrictions');
var Ownership = require('./Ownership');


function PartsOfParcels() {
}

PartsOfParcels.clear = function() {
    var mongo = app.db;
    return mongo.deloviparcela.remove({});
};


PartsOfParcels.toMongo = function() {
    var conn = app.adodb.kn;
    var mongo = app.db;
    conn.query('SELECT * FROM DEOPARC')
        .on('done', function(data) {
            mongo.deloviparcela.insert(data.records)
                .then(function() {
                    console.log('Učitana tabela DEOPARC');
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

PartsOfParcels.find = function(parcel) {
    var retPromise = app.db.odnosinep.find({NepIDNadr: parcel.NepID}).toArray()
        .then(function(relations) {
            var ppartReIds = relations.map(function(relation) {
                return relation.NepIDPodr;
            })
            return app.db.deloviparcela.find({$query: {NepID: {$in: ppartReIds}}, $orderBy: {NepID: 1}}).toArray()
        })
        .then(function(pparts) {
            parcel.parts = pparts;
            return pparts.reduce(function(promise, ppart) {
                return promise.then(function() {
                    ppart.parent = parcel;
                    //return Buildings.find(ppart);
                    return Q.all([Buildings.find(ppart), Restrictions.find(ppart), Ownership.find(ppart)]);
                });
            }, Q([]));
        });
    return retPromise;
};


// For testing
/*PartsOfParcels.findOnlyParts = function(parcel) {
    var retPromise = app.db.odnosinep.find({NepIDNadr: parcel.NepID}).toArray()
        .then(function(relations) {
            var ppartReIds = relations.map(function(relation) {
                return relation.NepIDPodr;
            })
            return app.db.deloviparcela.find({$query: {NepID: {$in: ppartReIds}}, $orderBy: {NepID: 1}}).toArray()
        })
        .then(function(pparts) {
            parcel.parts = pparts;
            console.log(parcel)
        });
    return retPromise;
};*/

PartsOfParcels.suid = 0;

PartsOfParcels.createKnz = function(parcelPart, folio, parcelSuid, historyInfo) {
    var ha = Math.floor(parcelPart.Povrsina / 10000),
        a = Math.floor((parcelPart.Povrsina - ha * 10000) / 100),
        m = parcelPart.Povrsina - (ha * 10000 + a * 100);

    var knzPP = {
        PARCELID: parcelSuid,
        NUMBER: parcelPart.parent.BrParc,
        NUMIDX: parcelPart.parent.PodbrParc ? parcelPart.parent.PodbrParc : 0,
        SUID: Utilities.createId(PartsOfParcels.suid),
        SEQUENCE: parcelPart.BrDelaParc,
        BASISID: null,
        DIMENSION: null,
        VOLUMEVALUE: null,
        BONITETID: null,
        WAYUSEID: Utilities.findIdBySign(PartsOfParcels.nClWayOfUse, parcelPart.Kultura), //(SELECT ID FROM N_CL_WAYOFUSE WHERE SIGN = pp.Kultura),
        CHANGELISTID: folio.CHANGELISTID,
        ADDRESSID: null,
        PROPSECID: null,
        CLOSEDAREAID: Utilities.findIdBySign(PartsOfParcels.nClClosedArea, parcelPart.MatBrSK), //(SELECT ID FROM N_CL_CLOSEDAREA WHERE SIGN = p.MatBrSK),
        LANDADDRESSID: null,
        PURPOSEPARCELID: Utilities.findIdBySign(PartsOfParcels.nClPurposeParcel, parcelPart.VrZem), //(SELECT ID FROM N_CL_CLOSEDAREA WHERE SIGN = p.MatBrSK)
        UID: folio.UID,
        WRITEINID: null,
        WRITEOFFID: null,
        LABEL: null,
        AREA: parcelPart.Povrsina,
        BEGINLIFESPANVERSION: null,
        ENDLIFESPANVERSION: null,
        PLANNUM: parcelPart.parent.BrPlana,
        SKETCHNUM: parcelPart.parent.BrSkice,
        COMMENT_P: null,
        ACTIVE: null,
        CHANGELISTID1: folio.CHANGELISTID1,
        MANUAL: parcelPart.parent.BrManuala,
        HEKTAR: ha,
        AR: a,
        METAR: m,
        YEAR: parcelPart.parent.GodSkMan,
        SPECPURPOSEID: null,
        CADASTRALINCOME: null,
        changeType: historyInfo.changeType,
        currentNepID: historyInfo.currentNepID,
        nextNepID: historyInfo.nextNepID,
        folio: folio
    };
    PartsOfParcels.suid += 1;
    return knzPP;
};

/**
 * @param partOfParcel deo parcele koji se obrađuje
 * @param parcelFolios foliji za parcelu, promena na delu parcele mor da odgovara bar jednom foliu
 * @param nRsPartOfParcel migrirani unosi za deo parcele
 *
 * ALGORITAM:
 * 1. Ako na delu parcele nema promena onda uzima sve folie od parcele gde je NepID == parent.NepID
 * 2. Ako ima promena poredi tipove promena
 */
PartsOfParcels.process = function(partOfParcel, parcelFolios, parcelSuid, nRsPartOfParcel) {
    var folios = [];
    var chid = 0;
    var chid1 = 9007199254740992;
    var nRsPoP;

    var changes = partOfParcel.changes ? partOfParcel.changes : [];

    parcelFolios.forEach(function(folio) {
        if(folio.currentNepID == partOfParcel.parent.NepID) {
            if(folio.CHANGELISTID) {
                folio.chid = folio.CHANGELISTID;
            }
            if(folio.CHANGELISTID1) {
                folio.chid1 = folio.CHANGELISTID1;
            } else {
                folio.chid1 = 9007199254740992;
            }
            folios.push(folio);
        }
    });

    if(changes.length == 0) {
        folios.forEach(function(folio) {
            var historyInfo = {
                changeType: folio.changeType,
                currentNepID: partOfParcel.NepID,
                nextNepID: partOfParcel.NepID
            };
            nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid, historyInfo);
            nRsPartOfParcel.push(nRsPoP);
        });
    } else {
        changes.forEach(function(change) {
            folios.forEach(function(folio) {

                console.log(change);
                console.log(folio);
                console.log(partOfParcel.NepID);
                console.log(partOfParcel.parent.NepID);
                console.log(folio.chid);
                console.log(folio.chid1);

                if(change.changelistId >= folio.chid1) {

                    console.log('Usao');

                    if((change.VrstaZakljucavanja == '\"O\"') || (change.VrstaZakljucavanja == '\"D\"')) {
                        var historyInfo = {
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: change.TabelaID,
                            nextNepID: change.TabelaID
                        };
                        nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid, historyInfo);
                        nRsPartOfParcel.push(nRsPoP);
                    } else if(change.VrstaZakljucavanja == '\"A\"') {
                        var historyInfo = {
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: change.TabelaID,
                            nextNepID: change.NoviID
                        };
                        nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid, historyInfo);
                        nRsPartOfParcel.push(nRsPoP);
                    } else { //ukidanje
                        var historyInfo = {
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: change.TabelaID,
                            nextNepID: null
                        };
                        nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid, historyInfo);
                        nRsPartOfParcel.push(nRsPoP);
                    }

                } else if(change.changelistId >= folio.chid){
                    if((change.VrstaZakljucavanja != '\"U\"')){
                        if(change.VrstaZakljucavanja != '\"A\"') {
                            var historyInfo = {
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: change.TabelaID,
                                nextNepID: change.NoviID
                            };
                            nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid, historyInfo);
                            nRsPartOfParcel.push(nRsPoP);
                        } else { //ostajanje i dodavanje
                            var historyInfo = {
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: change.TabelaID,
                                nextNepID: change.TabelaID
                            };
                            nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid, historyInfo);
                            nRsPartOfParcel.push(nRsPoP);
                        }
                    }
                }
            })
        });


    }

    /*
        if(pFolio.currentNepID == partOfParcel.parent.NepID) {
            if(changes.length == 0) {
                var historyInfo = {
                    changeType: pFolio.changeType,
                    currentNepID: partOfParcel.NepID,
                    nextNepID: partOfParcel.NepID
                };
                nRsPoP = PartsOfParcels.createKnz(partOfParcel, pFolio, parcelSuid, historyInfo);
                nRsPartOfParcel.push(nRsPoP);
            } else {
                changes.forEach(function(change){

                        if (change.VrstaZakljucavanja == '\"U\"') {
                            if((pFolio.CHANGELISTID1) && (change.changelistId >= pFolio.CHANGELISTID1)) {
                                var historyInfo = {
                                    changeType: change.VrstaZakljucavanja,
                                    currentNepID: partOfParcel.NepID,
                                    nextNepID: change.NoviID
                                };
                                nRsPoP = PartsOfParcels.createKnz(partOfParcel, pFolio, parcelSuid, historyInfo);
                                nRsPartOfParcel.push(nRsPoP);
                            }
                        } else if ((change.VrstaZakljucavanja == '\"D\"') || (change.VrstaZakljucavanja == '\"O\"')) {
                            if((!pFolio.CHANGELISTID1) || (change.changelistId >= pFolio.CHANGELISTID1)) {
                                var historyInfo = {
                                    changeType: change.VrstaZakljucavanja,
                                    currentNepID: partOfParcel.NepID,
                                    nextNepID: partOfParcel.NepID
                                };
                                nRsPoP = PartsOfParcels.createKnz(partOfParcel, pFolio, parcelSuid, historyInfo);
                                nRsPartOfParcel.push(nRsPoP);
                            }
                        } else { // change.VrstaYakljucavanje == "A"
                            if((!pFolio.CHANGELISTID1) || (change.changelistId >= pFolio.CHANGELISTID1)) {
                                var historyInfo = {
                                    changeType: change.VrstaZakljucavanja,
                                    currentNepID: partOfParcel.NepID,
                                    nextNepID: change.NoviID
                                };
                                nRsPoP = PartsOfParcels.createKnz(partOfParcel, pFolio, parcelSuid, historyInfo);
                                nRsPartOfParcel.push(nRsPoP);
                            }
                        }
                })
            }

        }

    });
    /*changes.forEach(function(change) {
        var advance = true;
        parcelFolios.forEach(function(pFolio) {
            if (pFolio.currentNepID == partOfParcel.parent.NepID) {
                if(change.VrstaZakljucavanja == '\"D\"') {
                    if(change.changelistId == pFolio.CHANGELISTID) {
                        var historyInfo = {
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: partOfParcel.NepID,
                            nextNepID: partOfParcel.NepID
                        };
                        nRsPoP = PartsOfParcels.createKnz(partOfParcel, pFolio, parcelSuid, historyInfo);
                        nRsPartOfParcel.push(nRsPoP);

                        advance = false;
                    }
                } else if(change.VrstaZakljucavanja == '\"O\"') {
                    if(change.changelistId == pFolio.CHANGELISTID) {
                        var historyInfo = {
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: partOfParcel.NepID,
                            nextNepID: partOfParcel.NepID
                        };
                        nRsPoP = PartsOfParcels.createKnz(partOfParcel, pFolio, parcelSuid, historyInfo);
                        nRsPartOfParcel.push(nRsPoP);

                        advance = false;
                    }
                } else if(change.VrstaZakljucavanja == '\"U\"') {

                    if(change.changelistId == pFolio.CHANGELISTID1) {
                        var historyInfo = {
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: partOfParcel.NepID,
                            nextNepID: partOfParcel.NepID
                        };
                        nRsPoP = PartsOfParcels.createKnz(partOfParcel, pFolio, parcelSuid, historyInfo);
                        nRsPartOfParcel.push(nRsPoP);

                        advance = false;
                    }
                } else if(change.VrstaZakljucavanja == '\"A\"') {
                    if(change.changelistId == pFolio.CHANGELISTID) {
                        var historyInfo = {
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: partOfParcel.NepID,
                            nextNepID: change.NoviID
                        };
                        nRsPoP = PartsOfParcels.createKnz(partOfParcel, pFolio, parcelSuid, historyInfo);
                        nRsPartOfParcel.push(nRsPoP);

                        advance = false;
                    }
                }
            }

            return advance;

        })

    });*/

    /*parcelFolios.every(function(pFolio) {

        console.log('Part of parcel: ' + partOfParcel.NepID);
        console.log('Parcel: ' + partOfParcel.parent.NepID);
        console.log('Folio current NepID: ' + pFolio.currentNepID);

        var advance = true;

        if (pFolio.currentNepID == partOfParcel.parent.NepID) {
            //Kreirati nRsPartOfParcel i postaviti currentNepID, nextNepID

            console.log(pFolio);

            var resultChange;
            changes.every(function(change) {
                if((pFolio.CHANGELISTID1) && (pFolio.CHANGELISTID1 == change.changelistId)) {
                    resultChange = change;
                    return false;
                } else {
                    return true;
                }
            });

            if(resultChange) {

                if(resultChange.VrstaZakljucavanja == '\"O\"' || resultChange.VrstaZakljucavanja == '\"D\"') {

                    var historyInfo = {
                        changeType: resultChange.VrstaZakljucavanja,
                        currentNepID: partOfParcel.NepID,
                        nextNepID: partOfParcel.NepID
                    };
                    nRsPoP = PartsOfParcels.createKnz(partOfParcel, pFolio, parcelSuid, historyInfo);
                    nRsPartOfParcel.push(nRsPoP);

                    advance = true;

                } else if(resultChange.VrstaZakljucavanja == '\"U\"') {

                    var historyInfo = {
                        changeType: resultChange.VrstaZakljucavanja,
                        currentNepID: partOfParcel.NepID,
                        nextNepID: null
                    };
                    nRsPoP = PartsOfParcels.createKnz(partOfParcel, pFolio, parcelSuid, historyInfo);
                    nRsPartOfParcel.push(nRsPoP);

                    advance = false;

                } else if(resultChange.VrstaZakljucavanja == '\"A\"') {

                    var historyInfo = {
                        changeType: resultChange.VrstaZakljucavanja,
                        currentNepID: partOfParcel.NepID,
                        nextNepID: partOfParcel.NepID
                    };
                    nRsPoP = PartsOfParcels.createKnz(partOfParcel, pFolio, parcelSuid, historyInfo);
                    nRsPartOfParcel.push(nRsPoP);

                    advance = true;


                }

            } else {

                var historyInfo = {
                    changeType: pFolio.VrstaZakljucavanja,
                    currentNepID: partOfParcel.NepID,
                    nextNepID: partOfParcel.NepID
                };

                nRsPoP = PartsOfParcels.createKnz(partOfParcel, pFolio, parcelSuid, historyInfo);
                nRsPartOfParcel.push(nRsPoP);

                advance = true;

            }
        }

        return advance;

    });*/
};

PartsOfParcels.nClWayOfUse = [];

PartsOfParcels.nClClosedArea = [];

PartsOfParcels.nClPurposeParcel = [];

PartsOfParcels.initCodelists = function() {
    PartsOfParcels.nClWayOfUse = Utilities.loadCodelist('n_cl_wayofuse.json');
    PartsOfParcels.nClClosedArea = Utilities.loadCodelist('n_cl_closedarea.json');
    PartsOfParcels.nClPurposeParcel = Utilities.loadCodelist('n_cl_purposeparcel.json');
};

module.exports = PartsOfParcels;

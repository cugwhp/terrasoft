var Q = require('q');

var app = require('../../app');
var Buildings = require('./Buildings');
var RealEstates = require('./RealEstates');

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
            this.data = data.records;
            mongo.deloviparcela.insert(this.data)
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
                    return Buildings.find(ppart);
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
        NUMIDX: parcelPart.parent.PodbrParc,
        SUID: PartsOfParcels.suid++,
        SEQUENCE: parcelPart.BrDelaParc,
        BASISID: null,
        DIMENSION: null,
        VOLUMEVALUE: null,
        BONITETID: null,
        WAYUSEID: parcelPart.Kultura, //(SELECT ID FROM N_CL_WAYOFUSE WHERE SIGN = pp.Kultura),
        CHANGELISTID: folio.CHANGELISTID,
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
        nextNepID: historyInfo.nextNepID
    };
    //knzPP.source = parcelPart; Mislim da nece trebati
    return knzPP;
};

//OVO NEĆE BITI POTREBNO JER PROMENE MORAJU BITI ISTE KAO I NA PARCELI
/*PartsOfParcels.collectChanges = function(partOfParcel) {
    //Formiranje svih promena za deo parcele, uzimaju se i promene na parceli
    var changes = [];
    var parcelChanges = partOfParcel.parent.changes;
    if(partOfParcel.changes) {
        changes = changes.concat(partOfParcel.changes);
    }
    //Ako ima promena na parceli i one se gledaju
    if(parcelChanges) {
        if(changes.length > 0) {
            //Ubaciti promene na parceli na odgovarajuća mesta
            parcelChanges.forEach(function (pChange) {
                var change, index;
                changes.forEach(function(c, i) {
                    if(pChange.changelistId <= c.changelistId) {
                        change = c;
                        index = i;
                        return false;
                    } else {
                        return true;
                    }
                });
                if(pChange.changelistId < change.changelistId) {
                    change.insert(index, 0, pChange);
                }
            });
        } else {
            //Promene su samo na parceli
            changes = changes.concat(parcelChanges);
        }
    }
     return changes;
};
*/

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
    var nRsPoP;
    //console.log(partOfParcel);
    var changes = partOfParcel.changes ? partOfParcel.changes : [];
    parcelFolios.forEach(function(pFolio) {
        if (pFolio.nextNepID == partOfParcel.parent.NepID) {
            //Kreirati nRsPartOfParcel i postaviti currentNepID, nextNepID
            var resultChange;
            changes.every(function(change) {
                //console.log(pFolio);
                //console.log(change);
                if(pFolio.CHANGELISTID1 && pFolio.CHANGELISTID1 == change.changelistId) {
                    resultChange = change;
                    return false;
                } else {
                    return true;
                }
            });
            if(resultChange) {
                var nextNepID = resultChange.NoviID;
                if(resultChange.VrstaZakljucavanja == '\"O\"' || resultChange.VrstaZakljucavanja == '\"D\"') {
                    nextNepID = partOfParcel.NepID;
                } else if(resultChange.VrstaZakljucavanja == '\"U\"') {
                    nextNepID = null;
                }
                var historyInfo = {
                    changeType: resultChange.VrstaZakljucavanja,
                    currentNepID: partOfParcel.NepID,
                    nextNepID: nextNepID
                };
                nRsPoP = PartsOfParcels.createKnz(partOfParcel, pFolio, parcelSuid, historyInfo);
                nRsPartOfParcel.push(nRsPoP);
            } else {
                var historyInfo = {
                    changeType: pFolio.changeType,
                    currentNepID: partOfParcel.NepID,
                    nextNepID: partOfParcel.NepID
                };
                nRsPoP = PartsOfParcels.createKnz(partOfParcel, pFolio, parcelSuid, historyInfo);
                nRsPartOfParcel.push(nRsPoP);
            }
        }
    });


    //Stari kod koji je pogrešan
/*    var chid = null;
    var chid1 = null;
    var rlp = 1;
    var numidxrf = 1;
    var folio;
    var nRsPoP;
    var oldNRsPoP;
    var oldFolio;

    for(var i = folios.length - 1; i > 0; i--) {
        if (partOfParcel.NepID == folios[i].nextNepID) {
            oldFolio = folios[i];
            oldNRsPoP = nRsPartOfParcel[i];
            break;
        }
    }

    if(changes.length == 0) {
        //Nema nikakvih promena na delu parcele
        if(!oldFolio) {
            var obj = {
                chid: null,
                chid1: null,
                numberrf: partOfParcel.parent.BrojLN,
                numidxrf: 1,
                active: 1,
                text: '',
                rlp: 1,
                changeType: null,
                currentNepID: partOfParcel.NepID,
                nextNepID: partOfParcel.NepID
            };
            folio = RealEstates.createFolio(obj);
            folios.push(folio);
            nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid);
            nRsPartOfParcel.push(nRsPoP);
        }
    } else {
        changes.every(function (change) {
            var advance = true;
            //Provera da li je promena već obrađena
            if (oldFolio && change.changelistId <= oldFolio.CHANGELISTID1) {
                advance = true;
            } else {
                if (oldFolio) { //Postoji staro stanje

                    if (oldFolio.changeType == '\"D\"') {//Prethodna promena je dodavanje

                        if (change.VrstaZakljucavanja == '\"D\"') {//Promena je dodavanje
                            console.log("UPOZORENJE: Dve promene za redom su dodavanje!");
                            advance = false;
                        } else if (change.VrstaZakljucavanja == '\"O\"') {//Promena je ostajanje
                            oldFolio.CHANGELISTID1 = change.changelistId;
                            oldFolio.nextNepID = partOfParcel.NepID;
                            oldFolio.ACTIVE = 0;
                            oldNRsPoP.CHANGELISTID1 = change.changelistId;
                            oldNRsPoP.nextNepID = partOfParcel.NepID;
                            var obj = {
                                chid: change.changelistId,
                                chid1: null,
                                numberrf: partOfParcel.parent.BrojLN,
                                numidxrf: oldFolio.numidxrf + 1,
                                active: 1,
                                text: '',
                                rlp: 1,
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: partOfParcel.NepID,
                                nextNepID: partOfParcel.NepID
                            };
                            folio = RealEstates.createFolio(obj);
                            folios.push(folio);
                            nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid);
                            nRsPartOfParcel.push(nRsPoP);
                            advance = true;
                        } else if (change.VrstaZakljucavanja == '\"U\"') {//Promena je ukidanje, nepokretnost nije više aktivna, prekida se obrada promena
                            oldFolio.CHANGELISTID1 = change.changelistId;
                            oldFolio.changeType = change.VrstaZakljucavanja;
                            oldFolio.nextNepID = null;
                            oldFolio.ACTIVE = 0;
                            oldNRsPoP.CHANGELISTID1 = change.changelistId;
                            oldNRsPoP.nextNepID = null;
                            oldNRsPoP.changeType = change.VrstaZakljucavanja;
                            advance = false;
                        } else if (change.VrstaZakljucavanja == '\"A\"') {//Promena je izmena, prekida se obrada promena
                            oldFolio.CHANGELISTID1 = change.changelistId;
                            oldFolio.nextNepID = partOfParcel.NepID;
                            oldFolio.ACTIVE = 0;
                            oldNRsPoP.CHANGELISTID1 = change.changelistId;
                            oldNRsPoP.nextNepID = partOfParcel.NepID;
                            var obj = {
                                chid: change.changelistId,
                                chid1: null,
                                numberrf: partOfParcel.parent.BrojLN,
                                numidxrf: oldFolio.numidxrf + 1,
                                active: 1,
                                text: '',
                                rlp: 1,
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: partOfParcel.NepID,
                                nextNepID: change.NoviID
                            };
                            folio = RealEstates.createFolio(obj);
                            folios.push(folio);
                            nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid);
                            nRsPartOfParcel.push(nRsPoP);
                            advance = false;
                        }

                    } else if (oldFolio.changeType == '\"U\"') {
                        console.log('UPOZORENJE: Prethodna promena je bila ukidanje!')
                        advance = false;
                    } else if (oldFolio.changeType == '\"O\"' || oldFolio.changeType == '\"A\"') {
                        if (change.VrstaZakljucavanja == '\"D\"') {
                            console.log('UPOZORENJE: Pokušaj dodavanja, a već postoje prethodna stanja!');
                            advance = false;
                        } else if (change.VrstaZakljucavanja == '\"U\"') {
                            oldFolio.CHANGELISTID1 = change.changelistId;
                            oldFolio.changeType = change.VrstaZakljucavanja;
                            oldFolio.nextNepID = null;
                            oldFolio.ACTIVE = 0;
                            oldNRsPoP.CHANGELISTID1 = change.changelistId;
                            oldNRsPoP.changeType = change.VrstaZakljucavanja;
                            oldNRsPoP.nextNepID = null;
                            advance = false;
                        } else if (change.VrstaZakljucavanja == '\"O\"') {
                            oldFolio.ACTIVE = 0;
                            oldFolio.CHANGELISTID1 = change.changelistId;
                            oldNRsPoP.CHANGELISTID1 = change.changelistId;
                            var obj = {
                                chid: change.changelistId,
                                chid1: null,
                                numberrf: partOfParcel.parent.BrojLN,
                                numidxrf: oldFolio.NUMIDXRF + 1,
                                active: 1,
                                text: '',
                                rlp: 1,
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: partOfParcel.NepID,
                                nextNepID: partOfParcel.NepID
                            };
                            folio = RealEstates.createFolio(obj);
                            folios.push(folio);
                            nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid);
                            nRsPartOfParcel.push(nRsPoP);
                            advance = true;
                        } else if (change.VrstaZakljucavanja == '\"A\"') {
                            oldFolio.active = 0;
                            oldFolio.CHANGELISTID1 = change.changelistId;
                            oldNRsPoP.CHANGELISTID1 = change.changelistId;
                            var obj = {
                                chid: change.changelistId,
                                chid1: null,
                                numberrf: partOfParcel.parent.BrojLN,
                                numidxrf: oldFolio.NUMIDXRF + 1,
                                active: 0,
                                text: '',
                                rlp: 1,
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: partOfParcel.NepID,
                                nextNepID: change.NoviID
                            };
                            folio = RealEstates.createFolio(obj);
                            folios.push(folio);
                            nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid);
                            nRsPartOfParcel.push(nRsPoP);
                            advance = false;
                        }
                    }

                } else { //Ne postoji staro stanje

                    if (change.VrstaZakljucavanja == '\"D\"') {//Promena je dodavanje
                        var obj = {
                            chid: change.changelistId,
                            chid1: null,
                            numberrf: partOfParcel.parent.BrojLN,
                            numidxrf: 1,
                            active: 1,
                            text: '',
                            rlp: 1,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: partOfParcel.NepID,
                            nextNepID: partOfParcel.NepID
                        };
                        folio = RealEstates.createFolio(obj);
                        folios.push(folio);
                        nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid);
                        nRsPartOfParcel.push(nRsPoP);
                        advance = true;
                    } else if (change.VrstaZakljucavanja == '\"O\"') {//Promena je ostajanje
                        var obj = {
                            chid: null,
                            chid1: change.changelistId,
                            numberrf: partOfParcel.parent.BrojLN,
                            numidxrf: 1,
                            active: 0,
                            text: '',
                            rlp: 1,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: partOfParcel.NepID,
                            nextNepID: partOfParcel.NepID
                        };
                        folio = RealEstates.createFolio(obj);
                        folios.push(folio);
                        nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid);
                        nRsPartOfParcel.push(nRsPoP);
                        var obj = {
                            chid: change.changelistId,
                            chid1: null,
                            numberrf: partOfParcel.parent.BrojLN,
                            numidxrf: 2,
                            active: 1,
                            text: '',
                            rlp: 1,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: partOfParcel.NepID,
                            nextNepID: partOfParcel.NepID
                        };
                        folio = RealEstates.createFolio(obj);
                        folios.push(folio);
                        nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid);
                        nRsPartOfParcel.push(nRsPoP);
                        advance = true;
                    } else if (change.VrstaZakljucavanja == '\"U\"') {//Promena je ukidanje, nepokretnost nije više aktivna, prekida se obrada promena
                        var obj = {
                            chid: null,
                            chid1: change.changelistId,
                            numberrf: partOfParcel.parent.BrojLN,
                            numidxrf: 1,
                            active: 0,
                            text: '',
                            rlp: 1,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: partOfParcel.NepID,
                            nextNepID: null
                        };
                        folio = RealEstates.createFolio(obj);
                        folios.push(folio);
                        nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid);
                        nRsPartOfParcel.push(nRsPoP);
                        advance = false;
                    }
                    else if (change.VrstaZakljucavanja == '\"A\"') {//Promena je izmena, prekida se obrada promena
                        var obj = {
                            chid: null,
                            chid1: change.changelistId,
                            numberrf: partOfParcel.parent.BrojLN,
                            numidxrf: 1,
                            active: 0,
                            text: '',
                            rlp: 1,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: partOfParcel.NepID,
                            nextNepID: partOfParcel.NepID
                        };
                        folio = RealEstates.createFolio(obj);
                        folios.push(folio);
                        nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid);
                        nRsPartOfParcel.push(nRsPoP);
                        var obj = {
                            chid: change.changelistId,
                            chid1: null,
                            numberrf: partOfParcel.parent.BrojLN,
                            numidxrf: 2,
                            active: 0,
                            text: '',
                            rlp: 1,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: partOfParcel.NepID,
                            nextNepID: change.NoviID
                        };
                        folio = RealEstates.createFolio(obj);
                        folios.push(folio);
                        nRsPoP = PartsOfParcels.createKnz(partOfParcel, folio, parcelSuid);
                        nRsPartOfParcel.push(nRsPoP);
                        advance = false;
                    }

                }
                oldNRsPoP = nRsPoP;
                oldFolio = folio;
            }
            return advance;
        });
    }*/
};

module.exports = PartsOfParcels;

var Q = require('q');

var app = require('../../app');
var PartsOfBuildings = require('./PartsOfBuildings');
var RealEstates = require('./RealEstates');

function Buildings() {
}

Buildings.clear = function() {
    var mongo = app.db;
    return mongo.objekti.remove({});
};

Buildings.toMongo = function() {
    var conn = app.adodb.kn;
    var mongo = app.db;
    conn.query('SELECT * FROM OBJEKAT')
        .on('done', function(data) {
            this.data = data.records;
            mongo.objekti.insert(this.data)
                .then(function() {
                    console.log('Učitana tabela OBJEKAT');
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

Buildings.find = function(ppart) {
    var retPromise = app.db.odnosinep.find({$query: {NepIDNadr: ppart.NepID}, $orderBy: {NepIDPodr: 1}}).toArray()
        .then(function(relations) {
            var bldReIds = relations.map(function(relation) {
                return relation.NepIDPodr;
            });
            return app.db.objekti.find({NepID: {$in: bldReIds}}).toArray()
        })
        .then(function(buildings) {
            ppart.buildings = buildings;
            return buildings.reduce(function(promise, building) {
                return promise.then(function() {
                    building.parent = ppart;
                    return PartsOfBuildings.find(building);
                });
            }, Q([]));
        });
    return retPromise;
};

// For testing
/*Buildings.findOnlyBuildings = function(ppart) {
    var retPromise = app.db.odnosinep.find({$query: {NepIDNadr: ppart.NepID}, $orderBy: {NepIDPodr: 1}}).toArray()
        .then(function(relations) {
            var bldReIds = relations.map(function(relation) {
                return relation.NepIDPodr;
            });
            return app.db.objekti.find({NepID: {$in: bldReIds}}).toArray()
        })
        .then(function(buildings) {
            ppart.buildings = buildings;
            return buildings.reduce(function(promise, building) {
                return promise.then(function() {
                    building.parent = ppart;
                    return PartsOfBuildings.find(building);
                });
            }, Q([]));
        });
    return retPromise;
};*/

Buildings.suid = 0;

Buildings.createKnz = function(building, folio, nRsPoP) {
    var knzBuilding = {
        SUID: Buildings.suid++,
        ADDRESSID: null,
        DIMENSION: null,
        BASISID: null,
        VOLUMEVALUE: null,
        FLOORNUMID: null,
        CHANGELISTID: folio.CHANGELISTID,
        PARCELID: nRsPoP.PARCELID,
        NUMBER: nRsPoP.NUMBER,
        NUMIDX: nRsPoP.NUMIDX,
        PARTPARCELID: nRsPoP.SUID,
        SEQUENCE: nRsPoP.SEQUENCE,
        PROPSECID: null,
        WAYUSEID: null, //SELECT ID FROM ...
        BUILDTYPEID: null,
        UID: folio.UID,
        WRITEINID: null,
        WRITEOFFID: null,
        LABEL: 0,
        AREA: building.Povrsina,
        BEGINLIFESPANVERSION: null,
        ENDLIFESPANVERSION: null,
        COMPINUM: null,
        SUBFOLIO: null,
        BUILDDATE: null,
        ENTNUM: null,
        COMMENT_B: null,
        NUMOFUNITS: null,
        CHANGELISTID1: folio.CHANGELISTID1,
        USEFULAREAID: null,
        ETAZA1: null,
        ETAZA2: 1,
        ETAZA3: null,
        ETAZA4: null,
        LEGALSTATUSID: building.StatusObjekta, //promeniti u SELECT ID FROM N_CL_LEGALSTATUS WHERE SIGN = building.StatusObjekta
        USEFULAREA: null,
        SPECPURPOSEID: null
    };

    return knzBuilding;
};

Buildings.findPartOfParcel = function(building, change, nRsPartOfParcel) {
    //console.log(nRsPartOfParcel);
    //console.log(change);
    //console.log(building.parent.NepID);
    var result = null;
    if(change) {
        nRsPartOfParcel.every(function(nRsPoP) {
            //console.log(nRsPoP);
            var advance = true;
            if(building.parent.NepID == nRsPoP.currentNepID) {
                if (change.changelistId < nRsPoP.CHANGELISTID1) {
                    //console.log(nRsPoP)
                    result = nRsPoP;
                    advance = false;
                } else {
                    result = nRsPoP;
                }
            }
            return advance;
        });
    } else {
        for(var i = nRsPartOfParcel.length - 1; i > 0; i--) {
            if(building.parent.NepID == nRsPartOfParcel[i].currentNepID) {
                result = nRsPartOfParcel[i];
                break;
            }
        }
    }
    //console.log(result);
    return result;
};

Buildings.process = function(building, nRsPartOfParcel, folios, nRsBuilding) {
    var chid = null;
    var chid1 = null;
    var rlo = 1;
    var numidxrf = 1;
    var folio;
    var nRsPoP;
    var nRsB;
    var oldNRsB;
    var changes = building.changes ? building.changes : [];

    //console.log(folios);

    //Treba proveriti da li je bilo prethodnih promena, odnosno da li je deo parcele već obrađivan
    //Ako jeste naći poslednji uid, chid1, rlp, numidxrf
    //Ako nije dodati uid++, rlp++, numidxrf = 1
    var oldFolio;
    for(var i = folios.length - 1; i > 0; i--) {
        if (building.NepID == folios[i].nextNepID) {
            oldFolio = folios[i];
            oldNRsB = nRsBuilding[i];
            break;
        }
    }

    if(changes.length == 0) {
        //Nema nikakvih promena na objektu
        if(!oldFolio) {
            nRsPoP = Buildings.findPartOfParcel(building, null, nRsPartOfParcel);
            if(nRsPoP) {
                var obj = {
                    chid: null,
                    chid1: null,
                    numberrf: building.parent.BrojLN,
                    numidxrf: 1,
                    active: 1,
                    text: '',
                    rlp: nRsPoP.RLP,
                    rlo: 1,
                    changeType: null,
                    currentNepID: building.NepID,
                    nextNepID: building.NepID
                };
                folio = RealEstates.createFolio(obj);
                folios.push(folio);
                nRsB = Buildings.createKnz(building, folio, nRsPoP);
                nRsBuilding.push(nRsB);
            } else {
                throw new Error('GREŠKA: Nije pronađen deo parcele!');
            }
        }
    } else {
        changes.every(function (change) {
            //console.log('\nPROMENA: ');
            //console.log(change);

            //console.log('\nSTARI FOLIO: ');
            //console.log(oldFolio);

            var advance = true;

            //Tražimo deo parcele na kom je objekat
            nRsPoP = Buildings.findPartOfParcel(building, change, nRsPartOfParcel);
            if(nRsPoP) {

                //Provera da li je promena već obrađena
                if (oldFolio && change.changelistId < oldFolio.CHANGELISTID1) {
                    advance = true;
                } else {
                    if (oldFolio) { //Postoji staro stanje

                        if (oldFolio.changeType == '\"D\"') {//Prethodna promena je dodavanje

                            if (change.VrstaZakljucavanja == '\"D\"') {//Promena je dodavanje
                                console.log("UPOZORENJE: Dve promene za redom su dodavanje!");
                                advance = false;
                            } else if (change.VrstaZakljucavanja == '\"O\"') {//Promena je ostajanje
                                oldFolio.CHANGELISTID1 = change.changelistId;
                                oldFolio.nextNepID = building.NepID;
                                oldNRsB.CHANGELISTID1 = change.changelistId;
                                //oldNRsB.nextNepID = building.NepID;
                                oldFolio.ACTIVE = 0;
                                var obj = {
                                    chid: change.changelistId,
                                    chid1: null,
                                    numberrf: building.parent.BrojLN,
                                    numidxrf: oldFolio.numidxrf + 1,
                                    active: 1,
                                    text: '',
                                    rlp: nRsPoP.RLP,
                                    rlo: 1,
                                    changeType: change.VrstaZakljucavanja,
                                    currentNepID: building.NepID,
                                    nextNepID: building.NepID
                                };
                                folio = RealEstates.createFolio(obj);
                                folios.push(folio);
                                nRsB = Buildings.createKnz(building, folio, nRsPoP);
                                nRsBuilding.push(nRsB);
                                advance = true;
                            } else if (change.VrstaZakljucavanja == '\"U\"') {//Promena je ukidanje, nepokretnost nije više aktivna, prekida se obrada promena
                                oldFolio.CHANGELISTID1 = change.changelistId;
                                oldFolio.changeType = change.VrstaZakljucavanja;
                                oldFolio.nextNepID = null;
                                oldFolio.ACTIVE = 0;
                                oldNRsB.CHANGELISTID1 = change.changelistId;
                                //oldNRsB.changeType = change.VrstaZakljucavanja;
                                //oldNRsB.nextNepID = null;
                                advance = false;
                            } else if (change.VrstaZakljucavanja == '\"A\"') {//Promena je izmena, prekida se obrada promena
                                oldFolio.CHANGELISTID1 = change.changelistId;
                                oldFolio.nextNepID = building.NepID;
                                oldFolio.ACTIVE = 0;
                                oldNRsB.CHANGELISTID1 = change.changelistId;
                                //oldNRsB.nextNepID = building.NepID;
                                var obj = {
                                    chid: change.changelistId,
                                    chid1: null,
                                    numberrf: building.parent.BrojLN,
                                    numidxrf: oldFolio.numidxrf + 1,
                                    active: 1,
                                    text: '',
                                    rlp: nRsPoP.RLP,
                                    rlo: 1,
                                    changeType: change.VrstaZakljucavanja,
                                    currentNepID: building.NepID,
                                    nextNepID: change.NoviID
                                };
                                folio = RealEstates.createFolio(obj);
                                folios.push(folio);
                                nRsB = Buildings.createKnz(building, folio, nRsPoP);
                                nRsBuilding.push(nRsB);
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
                                console.log('\nSTARI FOLIO: ');
                                console.log(oldFolio);
                                oldFolio.CHANGELISTID1 = change.changelistId;
                                oldFolio.changeType = change.VrstaZakljucavanja;
                                oldFolio.nextNepID = building.NepID;
                                oldFolio.ACTIVE = 0;
                                oldNRsB.CHANGELISTID1 = change.changelistId;
                                //oldNRsB.changeType = change.VrstaZakljucavanja;
                                //oldNRsB.nextNepID = null;
                                advance = false;
                                console.log('\nSTARI FOLIO: ');
                                console.log(oldFolio);
                            } else if (change.VrstaZakljucavanja == '\"O\"') {

                                oldFolio.ACTIVE = 0;
                                oldFolio.CHANGELISTID1 = change.changelistId;
                                oldNRsB.CHANGELISTID1 = change.changelistId;
                                var obj = {
                                    chid: change.changelistId,
                                    chid1: null,
                                    numberrf: building.parent.BrojLN,
                                    numidxrf: oldFolio.NUMIDXRF + 1,
                                    active: 1,
                                    text: '',
                                    rlp: nRsPoP.RLP,
                                    rlo: 1,
                                    changeType: change.VrstaZakljucavanja,
                                    currentNepID: building.NepID,
                                    nextNepID: building.NepID
                                };
                                folio = RealEstates.createFolio(obj);
                                folios.push(folio);
                                nRsB = Buildings.createKnz(building, folio, nRsPoP);
                                nRsBuilding.push(nRsB);
                                advance = true;

                            } else if (change.VrstaZakljucavanja == '\"A\"') {
                                oldFolio.ACTIVE = 0;
                                oldFolio.CHANGELISTID1 = change.changelistId;
                                oldNRsB.CHANGELISTID1 = change.changelistId;
                                var obj = {
                                    chid: change.changelistId,
                                    chid1: null,
                                    numberrf: building.parent.BrojLN,
                                    numidxrf: oldFolio.NUMIDXRF + 1,
                                    active: 0,
                                    text: '',
                                    rlp: nRsPoP.RLP,
                                    rlo: 1,
                                    changeType: change.VrstaZakljucavanja,
                                    currentNepID: building.NepID,
                                    nextNepID: change.NoviID
                                };
                                folio = RealEstates.createFolio(obj);
                                folios.push(folio);
                                nRsB = Buildings.createKnz(building, folio, nRsPoP);
                                nRsBuilding.push(nRsB);
                                advance = false;
                            }
                        }

                    } else { //Ne postoji staro stanje

                        if (change.VrstaZakljucavanja == '\"D\"') {//Promena je dodavanje
                            var obj = {
                                chid: change.changelistId,
                                chid1: null,
                                numberrf: building.parent.BrojLN,
                                numidxrf: 1,
                                active: 1,
                                text: '',
                                rlp: nRsPoP.RLP,
                                rlo: 1,
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: building.NepID,
                                nextNepID: building.NepID
                            };
                            folio = RealEstates.createFolio(obj);
                            folios.push(folio);
                            nRsB = Buildings.createKnz(building, folio, nRsPoP);
                            nRsBuilding.push(nRsB);
                            advance = true;
                        } else if (change.VrstaZakljucavanja == '\"O\"') {//Promena je ostajanje
                            var obj = {
                                chid: null,
                                chid1: change.changelistId,
                                numberrf: building.parent.BrojLN,
                                numidxrf: 1,
                                active: 0,
                                text: '',
                                rlp: nRsPoP.RLP,
                                rlo: 1,
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: building.NepID,
                                nextNepID: building.NepID
                            };
                            folio = RealEstates.createFolio(obj);
                            folios.push(folio);
                            nRsB = Buildings.createKnz(building, folio, nRsPoP);
                            nRsBuilding.push(nRsB);
                            var obj = {
                                chid: change.changelistId,
                                chid1: null,
                                numberrf: building.parent.BrojLN,
                                numidxrf: 2,
                                active: 1,
                                text: '',
                                rlp: 1,
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: building.NepID,
                                nextNepID: building.NepID
                            };
                            folio = RealEstates.createFolio(obj);
                            folios.push(folio);
                            nRsB = Buildings.createKnz(building, folio, nRsPoP);
                            nRsBuilding.push(nRsB);
                            advance = true;
                        } else if (change.VrstaZakljucavanja == '\"U\"') {//Promena je ukidanje, nepokretnost nije više aktivna, prekida se obrada promena
                            var obj = {
                                chid: null,
                                chid1: change.changelistId,
                                numberrf: building.parent.BrojLN,
                                numidxrf: 1,
                                active: 0,
                                text: '',
                                rlp: nRsPoP.RLP,
                                rlo: 1,
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: building.NepID,
                                nextNepID: null
                            };
                            folio = RealEstates.createFolio(obj);
                            folios.push(folio);
                            nRsB = Buildings.createKnz(building, folio, nRsPoP);
                            nRsBuilding.push(nRsB);
                            advance = false;
                        }
                        else if (change.VrstaZakljucavanja == '\"A\"') {//Promena je izmena, prekida se obrada promena
                            var obj = {
                                chid: null,
                                chid1: change.changelistId,
                                numberrf: building.parent.BrojLN,
                                numidxrf: 1,
                                active: 0,
                                text: '',
                                rlp: nRsPoP.RLP,
                                rlo: 1,
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: building.NepID,
                                nextNepID: building.NepID
                            };
                            folio = RealEstates.createFolio(obj);
                            folios.push(folio);
                            nRsB = Buildings.createKnz(building, folio, nRsPoP);
                            nRsBuilding.push(nRsB);
                            var obj = {
                                chid: change.changelistId,
                                chid1: null,
                                numberrf: building.parent.BrojLN,
                                numidxrf: 2,
                                active: 0,
                                text: '',
                                rlp: nRsPoP.RLP,
                                rlo: 1,
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: building.NepID,
                                nextNepID: change.NoviID
                            };
                            folio = RealEstates.createFolio(obj);
                            folios.push(folio);
                            nRsB = Buildings.createKnz(building, folio, nRsPoP);
                            nRsBuilding.push(nRsB);
                            advance = false;
                        }

                    }

                    //console.log('\nNOVI FOLIO: ');
                    //console.log(folio);

                    oldFolio = folio;
                    oldNRsB = nRsB;
                }
            } else {
                throw new Error('GREŠKA: Nije pronađen deo parcele!');
            }
            return advance;
        });
    }
};

module.exports = Buildings;

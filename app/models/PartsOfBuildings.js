var Q = require('q');
var HashMap = require('hashmap').HashMap;

var app = require('../../app');

var RealEstates = require('./RealEstates');
var Restrictions = require('./Restrictions');
var RealEstateTypes = require('./RealEstateTypes');
var Ownership = require('./Ownership');
var Utilities = require('./Utilities');

function PartsOfBuildings() {
}

PartsOfBuildings.clear = function() {
    var mongo = app.db;
    return mongo.deloviobjekata.remove({});
};

PartsOfBuildings.toMongo = function() {
    var conn = app.adodb.kn;
    var mongo = app.db;
    conn.query('SELECT * FROM DEOOBJEKTA')
        .on('done', function(data) {
            mongo.deloviobjekata.insert(data.records)
                .then(function() {
                    console.log('Učitana tabela DEOOBJEKTA');
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

PartsOfBuildings.find = function(building) {
    var retPromise = app.db.odnosinep.find({NepIDNadr: building.NepID}).toArray()
        .then(function (relations) {
            var partOfBldReIds = relations.map(function (relation) {
                return relation.NepIDPodr;
            })
            return app.db.deloviobjekata.find({$query: {NepID: {$in: partOfBldReIds}}, $orderBy: {NepID: 1}}).toArray()
        })
        .then(function (parts) {
            building.parts = parts;
            /*parts.forEach(function(part) {
                part.parent = building;

            });*/
            return parts.reduce(function(promise, part) {
                return promise.then(function() {
                    part.parent = building;
                    return  Q.all([Restrictions.find(part), Ownership.find(part)]);
                });
            }, Q([]));
        })
    return retPromise;
};


PartsOfBuildings.suid = 0;

PartsOfBuildings.createKnz = function(partOfBuilding, folio, nRsB) {

    var floorId = null;
    var geodisknFloor = partOfBuilding.BrojSprata;
    if(geodisknFloor) {
        var numberGeodisknFloor = parseInt(geodisknFloor, 10);
        var advance = true;
        PartsOfBuildings.nClFloor.every(function (clFloor) {
            var terrasoftFloor = clFloor.NAME.substr(0, 2);
            if (isNaN(numberGeodisknFloor)) {
                if (geodisknFloor == terrasoftFloor) {
                    floorId = clFloor.ID;
                    advance = false;
                } else if ((geodisknFloor == 'M1') && (terrasoftFloor == 'ME') && (clFloor.SIGN == '1.5')) {
                    floorId = clFloor.ID;
                    advance = false;
                } else if ((geodisknFloor == 'M2') && (terrasoftFloor == 'ME') && (clFloor.SIGN == '2.5')) {
                    floorId = clFloor.ID;
                    advance = false;
                }
            } else if (numberGeodisknFloor == parseInt(terrasoftFloor, 10)) {
                floorId = clFloor.ID;
                advance = false;
            }
            return advance;
        });
    }

    var roomId = null;
    var geodisknRoom = partOfBuilding.BrojSoba;
    if(geodisknRoom) {
        if (partOfBuilding.KoriscDO == 3001) {
            geodisknRoom = 'S ' + geodisknRoom;
        } else if (partOfBuilding.KoriscDO == 3002) {
            geodisknRoom = 'P ' + geodisknRoom;
        } else if (partOfBuilding.KoriscDO == 3003) {
            geodisknRoom = 'G ' + geodisknRoom;
        }
        PartsOfBuildings.nClRoom.every(function (clRoom) {
            if(clRoom.NAME.substr(0, 5) == geodisknRoom) {
                roomId = clRoom.ID;
                return false;
            } else {
                return true;
            }
        });
    }

    var nRsPoB = {
        SUID: Utilities.createId(PartsOfBuildings.suid),
        UID: folio.UID,
        BUILDINGID: nRsB.SUID,
        ADDRESSID: null,
        DIMENSION: null,
        WAYUSEID: Utilities.findIdBySign(PartsOfBuildings.nClWayOfUse, partOfBuilding.KoriscDO), //SELECT ID FROM N_CL_WAYOFUSE WHERE SIGN = partOfBuilding.KoriscDO
        VOLUMEVALUE: null,
        FLOORID: floorId,//SELECT ID FROM N_CL_ROOM WHERE SIGN = partOfBuilding.BrojSprata (videti kod Dude)
        ROOMID: roomId,//SELECT ID FROM N_CL_ROOM WHERE NAME = partOfBuilding.BrojSoba (videti kod Dude)
        PROPSECID: null,
        UNITTYPEID: null,
        WRITEINID: null,
        WRITEOFFID: null,
        LABEL: partOfBuilding.OpisDO,
        AREA: partOfBuilding.PovDO,
        BEGINLIFESPANVERSION: null,
        ENDLIFESPANVERSION: null,
        UNITNUM: partOfBuilding.EvidBrDO,
        SUBFOLIO: null,
        COMMENT: partOfBuilding.OpisDO,
        REGDATE: null,
        KITCHEN: null,
        BATHROOM: null,
        BUSSROOM: null,
        WC: null,
        OTHERROOM: null,
        PARCELID: nRsB.PARCELID,
        NUMBER: nRsB.NUMBER,
        NUMBERIDX: nRsB.NUMIDX,
        PARTPARCID: nRsB.PARTPARCELID,
        SEQUENCE: nRsB.SEQUENCE,
        CHANGELISTID1: folio.CHANGELISTID1,
        CHANGELISTID: folio.CHANGELISTID,
        BASISID: null,
        SIGNPB: partOfBuilding.BrStana,
        USEFULAREA: partOfBuilding.PovDO,
        USEFULAREAID: Utilities.findIdBySign(PartsOfBuildings.nClUsefulArea, partOfBuilding.NacUtvPov),//SELECT ID FROM N_CL_USEFULAREA WHERE SIGN = partOfBuilding.NacUtvPov
        ENTNO: null,
        SPECPURPOSE: null,
        changeType: folio.changeType,
        currentNepID: folio.currentNepID,
        nextNepID: folio.nextNepID,
        folio: folio
    };
    PartsOfBuildings.suid += 1;
    return nRsPoB;
};

PartsOfBuildings.findBuilding = function(partOfBuilding, change, nRsBuilding) {
    var result = null;
    if(change) {
        nRsBuilding.every(function(nRsB) {
            var advance = true;
            if(partOfBuilding.parent.NepID == nRsB.currentNepID) {
                if (change.changelistId < nRsB.CHANGELISTID1) {
                    result = nRsB;
                    advance = false;
                } else {
                    result = nRsB;
                }
            }
            return advance;
        });
    } else {
        for(var i = nRsBuilding.length - 1; i >= 0; i--) {
            if(partOfBuilding.parent.NepID == nRsBuilding[i].currentNepID) {
                result = nRsBuilding[i];
                break;
            }
        }
    }
    return result;
};

/**
 * HashMap koja cuva kombinacije {numberrf : [{rlp, rlo, numidxrf}, ...]}
 * @type {HashMap}
 */
PartsOfBuildings.hashMap = new HashMap();

PartsOfBuildings.previosNumberrf = -1;
/**
 * Pronalazi maksimalne vrednosti RLS i NUMIDXRF za dati broj l.n. i realni list parcele
 * kako bi se označavanje folia nastavilo od tih vrednosti
 *
 * @param numberrf
 * @param rlp
 * @param rlo
 * @returns {rlp, rlo, rls, numidxrf}
 */
PartsOfBuildings.findrloAndNumidx = function(numberrf, rlp, rlo, rls, numidxrf) {
    'use strict';

    var result = {};

    if((typeof rls != 'undefined') && (numberrf == PartsOfBuildings.previosNumberrf)) {
        result.rlp = rlp;
        result.rlo = rlo;
        result.rls = rls;
        result.numidxrf = numidxrf + 1;
        PartsOfBuildings.hashMap.set(numberrf, [result]);
    } else {
        if (PartsOfBuildings.hashMap.has(numberrf)) {

            var values = PartsOfBuildings.hashMap.get(numberrf);

            values.sort(function (v1, v2) {
                var compRes = 0;
                if (v1.rlp < v2.rlp) {
                    compRes = -1;
                } else if (v1.rlp > v2.rlp) {
                    compRes = 1;
                } else {
                    if(v1.rlo < v2.rlo) {
                        compRes = -1;
                    } else if(v1.rlo > v2.rlo){
                        compRes = 1;
                    } else {
                        compRes = v1.rls - v2.rls;
                    }
                }
                return compRes;
            });


            result.rlp = rlp;
            result.rlo = rlo;
            result.rls = values[values.length - 1].rls + 1;
            result.numidxrf = 1;

            values.push(result);

            PartsOfBuildings.hashMap.set(numberrf, values);

        } else {
            result.rlp = rlp;
            result.rlo = rlo;
            result.rls = 1;
            result.numidxrf = 1;
            PartsOfBuildings.hashMap.set(numberrf, [result]);
        }

        PartsOfBuildings.previosNumberrf = numberrf;
    }

    return result;
};


PartsOfBuildings.process = function(partOfBuilding, nRsBuilding, folios, nRsPartOfBuilding) {
    var folio;
    var nRsB;
    var nRsPoB;
    var oldNRsPoB;

    var rlsAndNumidxrf;

    var changes = partOfBuilding.changes ? partOfBuilding.changes : [];

    var oldFolio;
    for(var i = folios.length - 1; i > 0; i--) {
        if (partOfBuilding.NepID == folios[i].nextNepID) {
            oldFolio = folios[i];
            oldNRsPoB= nRsPartOfBuilding[i];
            break;
        }
    }

    if(changes.length == 0) {
        //Nema nikakvih promena na delu objekta
        if(!oldFolio) {
            nRsB = PartsOfBuildings.findBuilding(partOfBuilding, null, nRsBuilding);
            if(nRsB) {

                rlsAndNumidxrf = PartsOfBuildings.findrloAndNumidx(nRsB.folio.NUMBERRF,
                    nRsB.folio.RLP,
                    nRsB.folio.RLO
                );

                var obj = {
                    chid: null,
                    chid1: null,
                    numberrf: partOfBuilding.parent.parent.parent.BrojLN,
                    numidxrf: rlsAndNumidxrf.numidxrf,
                    active: 1,
                    text: '',
                    rlp: nRsB.folio.RLP,
                    rlo: nRsB.folio.RLO,
                    rls: rlsAndNumidxrf.rls,
                    changeType: null,
                    currentNepID: partOfBuilding.NepID,
                    nextNepID: partOfBuilding.NepID
                };

                folio = RealEstates.createFolio(obj);
                folios.push(folio);

                nRsPoB = PartsOfBuildings.createKnz(partOfBuilding, folio, nRsB);
                nRsPartOfBuilding.push(nRsPoB);

                Restrictions.process(nRsPoB, partOfBuilding.restrictions, RealEstateTypes.PARTOFBUILDING);

                Ownership.process(nRsPoB, partOfBuilding.owners, RealEstateTypes.PARTOFBUILDING);

            } else {
                throw new Error('GREŠKA: Nije pronađen deo parcele!');
            }
        }
    } else {
        changes.every(function (change) {
            var advance = true;

            //Tražimo deo parcele na kom je objekat
            nRsB = PartsOfBuildings.findBuilding(partOfBuilding, change, nRsBuilding);
            if(nRsB) {

                //Provera da li je promena već obrađena
                var alreadyProcessed = false;
                if (oldFolio) {
                    if(oldFolio.CHANGELISTID1) {
                        if(oldFolio.CHANGELISTID1 >= change.changelistId) {
                            alreadyProcessed = true;
                        }
                    } else {
                        if(oldFolio.CHANGELISTID && (oldFolio.CHANGELISTID >= change.changelistId)) {
                            alreadyProcessed = true;
                        }
                    }
                }
                if(alreadyProcessed) {
                    advance = true;
                } else {
                    if (oldFolio) { //Postoji staro stanje

                        if (oldFolio.changeType == '\"D\"') {//Prethodna promena je dodavanje

                            if (change.VrstaZakljucavanja == '\"D\"') {//Promena je dodavanje
                                console.log("UPOZORENJE: Dve promene za redom su dodavanje!");
                                advance = false;
                            } else if (change.VrstaZakljucavanja == '\"O\"') {//Promena je ostajanje
                                oldFolio.CHANGELISTID1 = change.changelistId;
                                oldFolio.nextNepID = partOfBuilding.NepID;
                                oldNRsPoB.CHANGELISTID1 = change.changelistId;
                                oldNRsPoB.nextNepID = partOfBuilding.NepID;
                                oldFolio.ACTIVE = 0;

                                rlsAndNumidxrf = PartsOfBuildings.findrloAndNumidx(nRsB.folio.NUMBERRF,
                                    nRsB.folio.RLP,
                                    nRsB.folio.RLO,
                                    oldFolio.RLS,
                                    oldFolio.NUMIDXRF
                                );

                                var obj = {
                                    chid: change.changelistId,
                                    chid1: null,
                                    numberrf: partOfBuilding.parent.parent.parent.BrojLN,
                                    numidxrf: rlsAndNumidxrf.numidxrf,
                                    active: 1,
                                    text: '',
                                    rlp: nRsB.folio.RLP,
                                    rlo: nRsB.folio.RLO,
                                    rls: rlsAndNumidxrf.rls,
                                    changeType: change.VrstaZakljucavanja,
                                    currentNepID: partOfBuilding.NepID,
                                    nextNepID: partOfBuilding.NepID
                                };

                                folio = RealEstates.createFolio(obj);
                                folios.push(folio);

                                nRsPoB = PartsOfBuildings.createKnz(partOfBuilding, folio, nRsB);
                                nRsPartOfBuilding.push(nRsPoB);

                                Restrictions.process(nRsPoB, partOfBuilding.restrictions, RealEstateTypes.PARTOFBUILDING);

                                Ownership.process(nRsPoB, partOfBuilding.owners, RealEstateTypes.PARTOFBUILDING);

                                advance = true;
                            } else if (change.VrstaZakljucavanja == '\"U\"') {//Promena je ukidanje, nepokretnost nije više aktivna, prekida se obrada promena
                                oldFolio.CHANGELISTID1 = change.changelistId;
                                oldFolio.changeType = change.VrstaZakljucavanja;
                                oldFolio.nextNepID = null;
                                oldFolio.ACTIVE = 0;
                                oldNRsPoB.CHANGELISTID1 = change.changelistId;
                                oldNRsPoB.changeType = change.VrstaZakljucavanja;
                                oldNRsPoB.nextNepID = null;
                                advance = false;
                            } else if (change.VrstaZakljucavanja == '\"A\"') {//Promena je izmena, prekida se obrada promena
                                oldFolio.CHANGELISTID1 = change.changelistId;
                                oldFolio.nextNepID = partOfBuilding.NepID;
                                oldFolio.ACTIVE = 0;
                                oldNRsPoB.CHANGELISTID1 = change.changelistId;
                                oldNRsPoB.nextNepID = partOfBuilding.NepID;

                                rlsAndNumidxrf = PartsOfBuildings.findrloAndNumidx(nRsB.folio.NUMBERRF,
                                    nRsB.folio.RLP,
                                    nRsB.folio.RLO,
                                    oldFolio.RLS,
                                    oldFolio.NUMIDXRF
                                );

                                var obj = {
                                    chid: change.changelistId,
                                    chid1: null,
                                    numberrf: partOfBuilding.parent.parent.parent.BrojLN,
                                    numidxrf: rlsAndNumidxrf.numidxrf,
                                    active: 1,
                                    text: '',
                                    rlp: nRsB.folio.RLP,
                                    rlo: nRsB.folio.RLO,
                                    rls: rlsAndNumidxrf.rls,
                                    changeType: change.VrstaZakljucavanja,
                                    currentNepID: partOfBuilding.NepID,
                                    nextNepID: change.NoviID
                                };

                                folio = RealEstates.createFolio(obj);
                                folios.push(folio);

                                nRsPoB = PartsOfBuildings.createKnz(partOfBuilding, folio, nRsB);
                                nRsPartOfBuilding.push(nRsPoB);

                                Restrictions.process(nRsPoB, partOfBuilding.restrictions, RealEstateTypes.PARTOFBUILDING);

                                Ownership.process(nRsPoB, partOfBuilding.owners, RealEstateTypes.PARTOFBUILDING);

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
                                oldFolio.nextNepID = partOfBuilding.NepID;
                                oldFolio.ACTIVE = 0;
                                oldNRsPoB.CHANGELISTID1 = change.changelistId;
                                oldNRsPoB.changeType = change.VrstaZakljucavanja;
                                oldNRsPoB.nextNepID = null;
                                advance = false;
                            } else if (change.VrstaZakljucavanja == '\"O\"') {

                                oldFolio.ACTIVE = 0;
                                oldFolio.CHANGELISTID1 = change.changelistId;
                                oldNRsPoB.CHANGELISTID1 = change.changelistId;

                                rlsAndNumidxrf = PartsOfBuildings.findrloAndNumidx(nRsB.folio.NUMBERRF,
                                    nRsB.folio.RLP,
                                    nRsB.folio.RLO,
                                    oldFolio.RLS,
                                    oldFolio.NUMIDXRF
                                );

                                var obj = {
                                    chid: change.changelistId,
                                    chid1: null,
                                    numberrf: partOfBuilding.parent.parent.parent.BrojLN,
                                    numidxrf: rlsAndNumidxrf.numidxrf,
                                    active: 1,
                                    text: '',
                                    rlp: nRsB.folio.RLP,
                                    rlo: nRsB.folio.RLO,
                                    rls: rlsAndNumidxrf.rls,
                                    changeType: change.VrstaZakljucavanja,
                                    currentNepID: partOfBuilding.NepID,
                                    nextNepID: partOfBuilding.NepID
                                };

                                folio = RealEstates.createFolio(obj);
                                folios.push(folio);

                                nRsPoB = PartsOfBuildings.createKnz(partOfBuilding, folio, nRsB);
                                nRsPartOfBuilding.push(nRsPoB);

                                Restrictions.process(nRsPoB, partOfBuilding.restrictions, RealEstateTypes.PARTOFBUILDING);

                                Ownership.process(nRsPoB, partOfBuilding.owners, RealEstateTypes.PARTOFBUILDING);

                                advance = true;

                            } else if (change.VrstaZakljucavanja == '\"A\"') {
                                oldFolio.ACTIVE = 0;
                                oldFolio.CHANGELISTID1 = change.changelistId;
                                oldNRsPoB.CHANGELISTID1 = change.changelistId;

                                rlsAndNumidxrf = PartsOfBuildings.findrloAndNumidx(nRsB.folio.NUMBERRF,
                                    nRsB.folio.RLP,
                                    nRsB.folio.RLO,
                                    oldFolio.RLS,
                                    oldFolio.NUMIDXRF
                                );

                                var obj = {
                                    chid: change.changelistId,
                                    chid1: null,
                                    numberrf: partOfBuilding.parent.parent.parent.BrojLN,
                                    numidxrf: rlsAndNumidxrf.numidxrf,
                                    active: 1,
                                    text: '',
                                    rlp: nRsB.folio.RLP,
                                    rlo: nRsB.folio.RLO,
                                    rls: rlsAndNumidxrf.rls,
                                    changeType: change.VrstaZakljucavanja,
                                    currentNepID: partOfBuilding.NepID,
                                    nextNepID: change.NoviID
                                };

                                folio = RealEstates.createFolio(obj);
                                folios.push(folio);

                                nRsPoB = PartsOfBuildings.createKnz(partOfBuilding, folio, nRsB);
                                nRsPartOfBuilding.push(nRsPoB);

                                Restrictions.process(nRsPoB, partOfBuilding.restrictions, RealEstateTypes.PARTOFBUILDING);

                                Ownership.process(nRsPoB, partOfBuilding.owners, RealEstateTypes.PARTOFBUILDING);

                                advance = false;
                            }
                        }

                    } else { //Ne postoji staro stanje

                        if (change.VrstaZakljucavanja == '\"D\"') {//Promena je dodavanje

                            rlsAndNumidxrf = PartsOfBuildings.findrloAndNumidx(nRsB.folio.NUMBERRF,
                                nRsB.folio.RLP,
                                nRsB.folio.RLO
                            );

                            var obj = {
                                chid: change.changelistId,
                                chid1: null,
                                numberrf: partOfBuilding.parent.parent.parent.BrojLN,
                                numidxrf: rlsAndNumidxrf.numidxrf,
                                active: 1,
                                text: '',
                                rlp: nRsB.folio.RLP,
                                rlo: nRsB.folio.RLO,
                                rls: rlsAndNumidxrf.rls,
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: partOfBuilding.NepID,
                                nextNepID: partOfBuilding.NepID
                            };

                            folio = RealEstates.createFolio(obj);
                            folios.push(folio);

                            nRsPoB = PartsOfBuildings.createKnz(partOfBuilding, folio, nRsB);
                            nRsPartOfBuilding.push(nRsPoB);

                            Restrictions.process(nRsPoB, partOfBuilding.restrictions, RealEstateTypes.PARTOFBUILDING);

                            Ownership.process(nRsPoB, partOfBuilding.owners, RealEstateTypes.PARTOFBUILDING);

                            advance = true;
                        } else if (change.VrstaZakljucavanja == '\"O\"') {//Promena je ostajanje

                            rlsAndNumidxrf = PartsOfBuildings.findrloAndNumidx(nRsB.folio.NUMBERRF,
                                nRsB.folio.RLP,
                                nRsB.folio.RLO
                            );

                            var obj = {
                                chid: null,
                                chid1: change.changelistId,
                                numberrf: partOfBuilding.parent.parent.parent.BrojLN,
                                numidxrf: rlsAndNumidxrf.numidxrf,
                                active: 0,
                                text: '',
                                rlp: nRsB.folio.RLP,
                                rlo: nRsB.folio.RLO,
                                rls: rlsAndNumidxrf.rls,
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: partOfBuilding.NepID,
                                nextNepID: partOfBuilding.NepID
                            };

                            folio = RealEstates.createFolio(obj);
                            folios.push(folio);

                            nRsPoB = PartsOfBuildings.createKnz(partOfBuilding, folio, nRsB);
                            nRsPartOfBuilding.push(nRsPoB);

                            Restrictions.process(nRsPoB, partOfBuilding.restrictions, RealEstateTypes.PARTOFBUILDING);

                            Ownership.process(nRsPoB, partOfBuilding.owners, RealEstateTypes.PARTOFBUILDING);

                            rlsAndNumidxrf = PartsOfBuildings.findrloAndNumidx(nRsB.folio.NUMBERRF,
                                nRsB.folio.RLP,
                                nRsB.folio.RLO,
                                rlsAndNumidxrf.rls,
                                rlsAndNumidxrf.numidxrf
                            );

                            var obj = {
                                chid: change.changelistId,
                                chid1: null,
                                numberrf: partOfBuilding.parent.parent.parent.BrojLN,
                                numidxrf: rlsAndNumidxrf.numidxrf,
                                active: 1,
                                text: '',
                                rlp: nRsB.folio.RLP,
                                rlo: nRsB.folio.RLO,
                                rls: rlsAndNumidxrf.rls,
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: partOfBuilding.NepID,
                                nextNepID: partOfBuilding.NepID
                            };

                            folio = RealEstates.createFolio(obj);
                            folios.push(folio);

                            nRsPoB = PartsOfBuildings.createKnz(partOfBuilding, folio, nRsB);
                            nRsPartOfBuilding.push(nRsPoB);

                            Restrictions.process(nRsPoB, partOfBuilding.restrictions, RealEstateTypes.PARTOFBUILDING);

                            Ownership.process(nRsPoB, partOfBuilding.owners, RealEstateTypes.PARTOFBUILDING);

                            advance = true;
                        } else if (change.VrstaZakljucavanja == '\"U\"') {//Promena je ukidanje, nepokretnost nije više aktivna, prekida se obrada promena

                            rlsAndNumidxrf = PartsOfBuildings.findrloAndNumidx(nRsB.folio.NUMBERRF,
                                nRsB.folio.RLP,
                                nRsB.folio.RLO
                            );

                            var obj = {
                                chid: null,
                                chid1: change.changelistId,
                                numberrf: partOfBuilding.parent.parent.parent.BrojLN,
                                numidxrf: rlsAndNumidxrf.numidxrf,
                                active: 0,
                                text: '',
                                rlp: nRsB.folio.RLP,
                                rlo: nRsB.folio.RLO,
                                rls: rlsAndNumidxrf.rls,
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: partOfBuilding.NepID,
                                nextNepID: null
                            };

                            folio = RealEstates.createFolio(obj);
                            folios.push(folio);

                            nRsPoB = PartsOfBuildings.createKnz(partOfBuilding, folio, nRsB);
                            nRsPartOfBuilding.push(nRsPoB);

                            Restrictions.process(nRsPoB, partOfBuilding.restrictions, RealEstateTypes.PARTOFBUILDING);

                            Ownership.process(nRsPoB, partOfBuilding.owners, RealEstateTypes.PARTOFBUILDING);

                            advance = false;
                        }
                        else if (change.VrstaZakljucavanja == '\"A\"') {//Promena je izmena, prekida se obrada promena

                            rlsAndNumidxrf = PartsOfBuildings.findrloAndNumidx(nRsB.folio.NUMBERRF,
                                nRsB.folio.RLP,
                                nRsB.folio.RLO
                            );

                            var obj = {
                                chid: null,
                                chid1: change.changelistId,
                                numberrf: partOfBuilding.parent.parent.parent.BrojLN,
                                numidxrf: rlsAndNumidxrf.numidxrf,
                                active: 0,
                                text: '',
                                rlp: nRsB.folio.RLP,
                                rlo: nRsB.folio.RLO,
                                rls: rlsAndNumidxrf.rls,
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: partOfBuilding.NepID,
                                nextNepID: partOfBuilding.NepID
                            };

                            folio = RealEstates.createFolio(obj);
                            folios.push(folio);

                            nRsPoB = PartsOfBuildings.createKnz(partOfBuilding, folio, nRsB);
                            nRsPartOfBuilding.push(nRsPoB);

                            Restrictions.process(nRsPoB, partOfBuilding.restrictions, RealEstateTypes.PARTOFBUILDING);

                            Ownership.process(nRsPoB, partOfBuilding.owners, RealEstateTypes.PARTOFBUILDING);

                            rlsAndNumidxrf = PartsOfBuildings.findrloAndNumidx(nRsB.folio.NUMBERRF,
                                nRsB.folio.RLP,
                                nRsB.folio.RLO,
                                rlsAndNumidxrf.rls,
                                rlsAndNumidxrf.numidxrf
                            );

                            var obj = {
                                chid: change.changelistId,
                                chid1: null,
                                numberrf: partOfBuilding.parent.parent.parent.BrojLN,
                                numidxrf: rlsAndNumidxrf.numidxrf,
                                active: 1,
                                text: '',
                                rlp: nRsB.folio.RLP,
                                rlo: nRsB.folio.RLO,
                                rls: rlsAndNumidxrf.rls,
                                changeType: change.VrstaZakljucavanja,
                                currentNepID: partOfBuilding.NepID,
                                nextNepID: change.NoviID
                            };

                            folio = RealEstates.createFolio(obj);
                            folios.push(folio);

                            nRsPoB = PartsOfBuildings.createKnz(partOfBuilding, folio, nRsB);
                            nRsPartOfBuilding.push(nRsPoB);

                            Restrictions.process(nRsPoB, partOfBuilding.restrictions, RealEstateTypes.PARTOFBUILDING);

                            Ownership.process(nRsPoB, partOfBuilding.owners, RealEstateTypes.PARTOFBUILDING);

                            advance = false;
                        }

                    }

                    oldFolio = folio;
                    oldNRsPoB = nRsPoB;
                }
            } else {
                throw new Error('GREŠKA: Nije pronađen deo parcele!');
            }
            return advance;
        });
    }
};

PartsOfBuildings.nClWayOfUse = [];

PartsOfBuildings.nClFloor = [];

PartsOfBuildings.nClRoom = [];

PartsOfBuildings.nClUsefulArea = [];

PartsOfBuildings.initCodelists = function() {
    PartsOfBuildings.nClWayOfUse = Utilities.loadCodelist('n_cl_wayofuse.json');
    PartsOfBuildings.nClFloor = Utilities.loadCodelist('n_cl_floor.json');
    PartsOfBuildings.nClRoom = Utilities.loadCodelist('n_cl_room.json');
    PartsOfBuildings.nClUsefulArea = Utilities.loadCodelist('n_cl_usefularea.json');
};

module.exports = PartsOfBuildings;



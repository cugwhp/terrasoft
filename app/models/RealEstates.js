var cm = require('./cm');

function RealEstates() {
}

RealEstates.clear = function() {
    var app = require('../../app');
    var mongo = app.db;
    return mongo.nepokretnosti.remove({})
        .then(function() {
            return mongo.odnosinep.remove({});
        });
};

RealEstates.toMongo = function() {
    var app = require('../../app');
    var conn = app.adodb.kn;
    var mongo = app.db;
    conn.query('SELECT MatBrKO, ' +
        'NepID, ' +
        'VrstaStanja, ' +
        'VrstaNepokretnosti, ' +
        'OrigID,' +
        'Format(CREATED, "yyyy/mm/dd HH:mm:ss") AS CREATED, ' +
        'Format(RETIRED, "yyyy/mm/dd HH:mm:ss") AS RETIRED ' +
        'FROM Nepokretnosti')
        .on('done', function(data) {
            var preparedData = data.records.map(function(rec) {
                rec.CREATED = rec.CREATED ? new Date(rec.CREATED) : null;
                rec.RETIRED = rec.RETIRED ? new Date(rec.RETIRED) : null;
                return rec;
            });
            mongo.nepokretnosti.insert(preparedData)
                .then(function() {
                    console.log('Učitana tabela Nepokretnosti');
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

RealEstates.relationsToMongo = function() {
    var app = require('../../app');
    var conn = app.adodb.kn;
    var mongo = app.db;
    conn.query('SELECT NepIDNadr, ' +
        'NepIDPodr, ' +
        'VrstaOdnosa,' +
        'Format(CREATED, "yyyy/mm/dd HH:mm:ss") AS CREATED, ' +
        'Format(RETIRED, "yyyy/mm/dd HH:mm:ss") AS RETIRED, ' +
        'ID ' +
        'FROM OdnosiMedjuNepokretnosti')
        .on('done', function(data) {
            var preparedData = data.records.map(function(rec) {
                rec.CREATED = rec.CREATED ? new Date(rec.CREATED) : null;
                rec.RETIRED = rec.RETIRED ? new Date(rec.RETIRED) : null;
                return rec;
            });
            mongo.odnosinep.insert(preparedData)
                .then(function() {
                    console.log('Učitana tabela OdnosiMedjuNepokretnosti');
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


/*RealEstates.processHistory = function(realEstate) {
    var reHistory = [[]];
    var i = 0;
    var newRe = true;
    if(!realEstate) {
        return [];
    } else {
        realEstate.sort(function(a, b) {
            return a.NepID - b.NepID;
        });
    }
    while(realEstate.length > 0) {
        console.log('Preostalo nepokretnosti: ' + realEstate.length);
        var nextRe = realEstate[0];
        realEstate.splice(0, 1);

        while(nextRe) {
            var j = 0;
            var newId = null;
            if (!nextRe.changes || nextRe.changes.length == 0) {
                var prevChange = null;
                if (!newRe) {
                    prevChange = reHistory[i][reHistory[i].length - 1].nextChange;
                }
                reHistory[i].push({
                    re: nextRe,
                    prevChange: prevChange,
                    nextChange: null
                });
                nextRe = null;
            } else {
                while (j < nextRe.changes.length && !newId) {
                    var prevChange = null;
                    if (j > 0 || !newRe) {
                        prevChange = reHistory[i][reHistory[i].length - 1].nextChange;
                    }
                    if (nextRe.changes[j].VrstaZakljucavanja == '\"O\"'
                        || nextRe.changes[j].VrstaZakljucavanja == '\"D\"'
                        || nextRe.changes[j].VrstaZakljucavanja == '\"U\"') {
                        reHistory[i].push({
                            re: nextRe,
                            prevChange: prevChange,
                            nextChange: nextRe.changes[j]
                        });
                        newId = null;
                        j++;
                    } else if (nextRe.changes[j].VrstaZakljucavanja == '\"A\"') {
                        reHistory[i].push({
                            re: nextRe,
                            prevChange: prevChange,
                            nextChange: nextRe.changes[j]
                        });
                        newId = nextRe.changes[j].NoviID
                        j++;
                    }

                }
                if (newId) {
                    realEstate.forEach(function (building, k) {
                        if (building.NepID == newId) {
                            nextRe = building;
                            realEstate.splice(k, 1);
                            newRe = false;
                        }
                    })
                } else {
                    nextRe = null;
                }
            }
        }

        newRe = true;
        reHistory.push([]);
        i++;

    }

    console.log('F');

    return reHistory;

};*/

RealEstates.uid = 0;
//RealEstates.rlp = 1;
//RealEstates.rlo = 1;
//RealEstates.rls = 1;

/**
 * obj: uid, chid, chid1, numberrf, numidxrf, active, text, rlp, changeType, currentNepID, nextNepID
 */

RealEstates.createFolio = function(obj) {
    var rlp = obj.rlp ? obj.rlp : null;
    var rlo = obj.rlo ? obj.rlo : null;
    var rls = obj.rls ? obj.rls : null;
    return {
        UID: RealEstates.uid++,
        CHANGELISTID: obj.chid,
        CHANGELISTID1: obj.chid1,
        COUNTRYID: cm.countryId,
        CADDISTID: cm.cadDistId,
        CADMUNID: cm.cadMunId,
        PARTYID: null,
        NAME: null,
        BEGINLIFESPANVERSION: null,
        ENDLIFESPANVERSION: null,
        NUMBERRF: obj.numberrf,
        NUMIDXRF: obj.numidxrf,
        ACTIVE: obj.active,
        TEXT: obj.text,
        JOURNALNUM: null,
        RLP: rlp,
        RLO: rlo,
        RLS: rls,
        changeType: obj.changeType,
        currentNepID: obj.currentNepID,
        nextNepID: obj.nextNepID
    };
};

/*RealEstates.process = function(realEstate, changes, folios) {
    var chid = null;
    var chid1 = null;
    var newUid = 0;
    var rlp = 1;
    var numidxrf = 1;

    //Treba proveriti da li je bilo prethodnih promena, odnosno da li je deo parcele već obrađivan
    //Ako jeste naći poslednji uid, chid1, rlp, numidxrf
    //Ako nije dodati uid++, rlp++, numidxrf = 1
    var oldFolio;
    for(var i = folios.length; i > 0; i--) {
        if (realEstate.NepID == folios[i].nextNepID) {
            oldFolio = folios[i];
            break;
        }
    }

    if(folios.length == 0) {
        newUid = 1;
    } else {
        newUid = folios.length;
    }

    if(changes.length == 0) {
        //Nema nikakvih promena na delu parcele
        if(!oldFolio) {
            var obj = {
                uid: newUid,
                chid: null,
                chid1: null,
                numberrf: realEstate.parent.BrojLN,
                numidxrf: 1,
                active: 1,
                text: '',
                rlp: 1,
                changeType: null,
                currentNepID: realEstate.NepID,
                nextNepID: realEstate.NepID
            };
            folio = PartsOfParcels.createFolio(obj);
            folios.push(folio);
        }
    } else {
        changes.forEach(function (change) {
            console.log(change);
            var advance = true;
            //Provera da li je promena već obrađena
            if (oldFolio && change.changelistId <= oldFolio.CHANGELISTID1) {
                advance = true;
            }
            if(oldFolio) { //Postoji staro stanje

                if (oldFolio.changeType == '\"D\"') {//Prethodna promena je dodavanje

                    if (change.VrstaZakljucavanja == '\"D\"') {//Promena je dodavanje
                        console.log("UPOZORENJE: Dve promene za redom su dodavanje!");
                        advance = false;
                    } else if (change.VrstaZakljucavanja = '\"O\"') {//Promena je ostajanje
                        oldFolio.chid1 = change.changelistId;
                        oldFolio.nextNepID = realEstate.NepID;
                        oldFolio.active = 0;
                        var obj = {
                            uid: newUid,
                            chid: change.changelistId,
                            chid1: null,
                            numberrf: realEstate.parent.BrojLN,
                            numidxrf: oldFolio.numidxrf + 1,
                            active: 1,
                            text: '',
                            rlp: 1,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: realEstate.NepID,
                            nextNepID: realEstate.NepID
                        };
                        folio = PartsOfParcels.createFolio(obj);
                        folios.push(folio);
                        advance = true;
                    } else if (change.VrstaZakljucavanja = '\"U\"') {//Promena je ukidanje, nepokretnost nije više aktivna, prekida se obrada promena
                        oldFolio.chid1 = change.changelistId;
                        oldFolio.changeType = change.VrstaZakljucavanja;
                        oldFolio.nextNepID = null;
                        oldFolio.active = 0;
                        advance = false;
                    } else if (change.VrstaZakljucavanja = '\"A\"') {//Promena je izmena, prekida se obrada promena
                        oldFolio.chid1 = change.changelistId;
                        oldFolio.nextNepID = realEstate.NepID;
                        oldFolio.active = 0;
                        var obj = {
                            uid: newUid,
                            chid: change.changelistId,
                            chid1: null,
                            numberrf: realEstate.parent.BrojLN,
                            numidxrf: oldFolio.numidxrf + 1,
                            active: 1,
                            text: '',
                            rlp: 1,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: realEstate.NepID,
                            nextNepID: change.NoviID
                        };
                        folio = PartsOfParcels.createFolio(obj);
                        folios.push(folio);
                        advance = false;
                    }

                } else if(oldFolio.changeType == '\"U\"') {
                    console.log('UPOZORENJE: Prethodna promena je bila ukidanje!')
                    advance = false;
                } else if(oldFolio.changeType == '\"O\"' || oldFolio.changeType == '\"A\"') {
                    if(change.VrstaZakljucavanja == '\"D\"') {
                        console.log('UPOZORENJE: Pokušaj dodavanja, a već postoje prethodna stanja!');
                        advance = false;
                    } else if(change.VrstaZakljucavanja == '\"U\"') {
                        oldFolio.chid1 = change.changelistId;
                        oldFolio.changeType = change.VrstaZakljucavanja;
                        oldFolio.nextNepID = null;
                        oldFolio.active = 0;
                        advance = false;
                    } else if(change.VrstaZakljucavanja == '\"O\"') {
                        oldFolio.active = 0;
                        oldFolio.CHANGELISTID1 = change.changelistId;
                        var obj = {
                            uid: newUid,
                            chid: change.changelistId,
                            chid1: null,
                            numberrf: realEstate.parent.BrojLN,
                            numidxrf: oldFolio.NUMIDXRF + 1,
                            active: 1,
                            text: '',
                            rlp: 1,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: realEstate.NepID,
                            nextNepID: realEstate.NepID
                        };
                        folio = PartsOfParcels.createFolio(obj);
                        folios.push(folio);
                        advance = true;
                    } else if(change.VrstaZakljucavanja == '\"A\"') {
                        oldFolio.active = 0;
                        oldFolio.CHANGELISTID1 = change.changelistId;
                        var obj = {
                            uid: newUid,
                            chid: change.changelistId,
                            chid1: null,
                            numberrf: realEstate.parent.BrojLN,
                            numidxrf: oldFolio.NUMIDXRF + 1,
                            active: 0,
                            text: '',
                            rlp: 1,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: realEstate.NepID,
                            nextNepID: change.NoviID
                        };
                        folio = PartsOfParcels.createFolio(obj);
                        folios.push(folio);
                        advance = false;
                    }
                }

            } else { //Ne postoji staro stanje

                if (change.VrstaZakljucavanja == '\"D\"') {//Promena je dodavanje
                    var obj = {
                        uid: newUid,
                        chid: change.changelistId,
                        chid1: null,
                        numberrf: realEstate.parent.BrojLN,
                        numidxrf: 1,
                        active: 1,
                        text: '',
                        rlp: 1,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: realEstate.NepID,
                        nextNepID: realEstate.NepID
                    };
                    folio = PartsOfParcels.createFolio(obj);
                    folios.push(folio);
                    advance = true;
                } else if (change.VrstaZakljucavanja == '\"O\"') {//Promena je ostajanje
                    var obj = {
                        uid: newUid,
                        chid: null,
                        chid1: change.changelistId,
                        numberrf: realEstate.parent.BrojLN,
                        numidxrf: 1,
                        active: 0,
                        text: '',
                        rlp: 1,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: realEstate.NepID,
                        nextNepID: realEstate.NepID
                    };
                    folio = PartsOfParcels.createFolio(obj);
                    folios.push(folio);
                    var obj = {
                        uid: newUid,
                        chid: change.changelistId,
                        chid1: null,
                        numberrf: realEstate.parent.BrojLN,
                        numidxrf: 2,
                        active: 1,
                        text: '',
                        rlp: 1,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: realEstate.NepID,
                        nextNepID: realEstate.NepID
                    };
                    folio = PartsOfParcels.createFolio(obj);
                    folios.push(folio);
                    advance = true;
                } else if (change.VrstaZakljucavanja = '\"U\"') {//Promena je ukidanje, nepokretnost nije više aktivna, prekida se obrada promena
                    var obj = {
                        uid: newUid,
                        chid: null,
                        chid1: change.changelistId,
                        numberrf: realEstate.parent.BrojLN,
                        numidxrf: 1,
                        active: 0,
                        text: '',
                        rlp: 1,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: realEstate.NepID,
                        nextNepID: null
                    };
                    folio = PartsOfParcels.createFolio(obj);
                    folios.push(folio);
                    advance = false;
                }
                else if (change.VrstaZakljucavanja = '\"A\"') {//Promena je izmena, prekida se obrada promena
                    var obj = {
                        uid: newUid,
                        chid: null,
                        chid1: change.changelistId,
                        numberrf: realEstate.parent.BrojLN,
                        numidxrf: 1,
                        active: 0,
                        text: '',
                        rlp: 1,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: realEstate.NepID,
                        nextNepID: realEstate.NepID
                    };
                    folio = PartsOfParcels.createFolio(obj);
                    folios.push(folio);
                    var obj = {
                        uid: newUid,
                        chid: change.changelistId,
                        chid1: null,
                        numberrf: realEstate.parent.BrojLN,
                        numidxrf: 2,
                        active: 0,
                        text: '',
                        rlp: 1,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: realEstate.NepID,
                        nextNepID: change.NoviID
                    };
                    folio = PartsOfParcels.createFolio(obj);
                    folios.push(folio);
                    advance = false;
                }

            }
            newUid = folios.length + 1;
            oldFolio = folio;
        });
    }
};*/

RealEstates.sort = function(reArray) {
    reArray.sort(function(a, b) {
        return a.NepID - b.NepID;
    });
};

module.exports = RealEstates;

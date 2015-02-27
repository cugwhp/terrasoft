var Q = require('q');
var HashMap = require('hashmap').HashMap;

var app = require('../../app');

var PartsOfParcels = require('./PartsOfParcels');
var RealEstates = require('./RealEstates');
var Restrictions = require('./Restrictions');
var RealEstateTypes = require('./RealEstateTypes');
var Ownership = require('./Ownership');
var Utilities = require('./Utilities');

var cm = require('./cm');

function Parcels() {
}

Parcels.clear = function() {
    var mongo = app.db;
    return mongo.parcele.remove({});
};

Parcels.toMongo = function() {
    var conn = app.adodb.kn;
    var mongo = app.db;
    conn.query('SELECT * FROM PARCELA')
        .on('done', function(data) {
            mongo.parcele.insert(data.records)
                .then(function() {
                    console.log('Učitana tabela PARCELA');
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

Parcels.find = function(parcelNum, parcelSubNum, result) {
    var condition = {};
    condition.BrParc = parcelNum;
    if(parcelSubNum) {
        condition.PodbrParc = parcelSubNum;
    }

    console.log(parcelNum + ' / ' + parcelSubNum);

    return app.db.parcele.find({$query: condition, $orderBy:{NepID: 1}}).toArray()
        .then(function(parcels) {
            return parcels.reduce(function(promise, parcel) {
                return promise.then(function() {
                    result.push(parcel);
                    return Q.all([PartsOfParcels.find(parcel), Restrictions.find(parcel), Ownership.find(parcel)]);
                });
            }, Q([]));
        });
};

Parcels.suid = 0;

Parcels.createKnz = function(p) {
    var knzP = {
        SUID: Utilities.createId(Parcels.suid),
        NUMBER: p.BrParc,
        NUMIDX: p.PodbrParc ? p.PodbrParc : 0,
        ADDRESSID: null,
        DIMENSIONID: null,
        VOLUMEVALUEID: null,
        COUNTRYID: cm.countryId,
        CADDISTID: cm.cadDistId,
        CADMUNID: cm.cadMunId,
        LABEL: null,
        AREA: p.Povrsina,
        BEGINLIFESPANVERSION: null,
        ENDLIFESPANVERSION: null
    };
    Parcels.suid += 1;
    return knzP;
};

/**
 * Prethodna vrednost numberrf koja se poredi sa trenutnim brojem lista
 * @type {number}
 */
Parcels.previosNumberrf = -1;

/**
 * HashMap koja cuva kombinacije {numberrf: [{rlp, numidxrf}, ...]}
 * @type {HashMap}
 */
Parcels.hashMap = new HashMap();

/**
 * Pronalazi maksimalne vrednosti RLP i NUMIDXRF za dati broj l.n.
 * kako bi se označavanje folia nastavilo od tih vrednosti
 *
 * @param numberrf
 * @returns promise
 */
Parcels.findrlpAndNumidx = function(numberrf) {
    'use strict';

    console.log(numberrf);

    var result = {};
    if(Parcels.hashMap.has(numberrf)) {
        var values = Parcels.hashMap.get(numberrf);

        /*
            Mozda ne treba sortiranje jer je uvek poslednji maksimalan?
         */
        values.sort(function(v1, v2) {
            if(v1.rlp < v2.rlp) {
                return -1;
            } else if(v1.rlp > v2.rlp) {
                return 1;
            } else {
                return v1.numidxrf - v2.numidxrf;
            }
        });
        result.rlp = values[values.length - 1].rlp;
        result.numidxrf = values[values.length - 1].numidxrf;
        if(numberrf == Parcels.previosNumberrf) {
            result.numidxrf += 1;
        } else {
            result.rlp += 1;
            result.numidxrf = 1;
        }
        values.push(result);
        Parcels.hashMap.set(numberrf, values);
    } else {
        result.rlp = 1;
        result.numidxrf = 1;
        Parcels.hashMap.set(numberrf, [result]);
    }
    Parcels.previosNumberrf = numberrf;

    console.log(result);

    return result;
};

/**
 * Kreira folie za svaku promenu na parceli
 * @param parcel
 * @param folios
 */
Parcels.process = function(parcel, folios, nRsP) {

    var folio;

    //pronaći odgovarajući RLP i NUMIDXRF
    var rlpAndNumidx = Parcels.findrlpAndNumidx(parcel.BrojLN); //kada ide ukidanje, a postojao je prethodni folio ne treba povećavati numidxrf

    var changes = parcel.changes ? parcel.changes : [];

    //oldFolio bi trebalo da je uvek poslednji u nizu folios
    var oldFolio;
    if(folios && folios.length > 0) {
        oldFolio = folios[folios.length - 1];
    }

    if(changes.length == 0) {
        //Nema nikakvih promena na parceli
        if(!oldFolio) {
            var obj = {
                chid: null,
                chid1: null,
                numberrf: parcel.BrojLN,
                numidxrf: rlpAndNumidx.numidxrf,
                active: 1,
                text: '',
                rlp: rlpAndNumidx.rlp,
                changeType: null,
                currentNepID: parcel.NepID,
                nextNepID: parcel.NepID
            };
            folio = RealEstates.createFolio(obj);
            folios.push(folio);
            nRsP.folio = folio;
            Restrictions.process(nRsP, parcel.restrictions, RealEstateTypes.PARCEL);

            Ownership.process(nRsP, parcel.owners, RealEstateTypes.PARCEL);
        }
    } else {
        changes.every(function (change) {
            var advance = true;

            if (oldFolio) { //Postoji staro stanje

                if (oldFolio.changeType == '\"D\"') {//Prethodna promena je dodavanje

                    if (change.VrstaZakljucavanja == '\"D\"') {//Promena je dodavanje
                        console.log("UPOZORENJE: Dve promene za redom su dodavanje!");
                        advance = false;
                    } else if (change.VrstaZakljucavanja == '\"O\"') {//Promena je ostajanje
                        oldFolio.CHANGELISTID1 = change.changelistId;
                        oldFolio.nextNepID = parcel.NepID;
                        oldFolio.ACTIVE = 0;
                        var obj = {
                            chid: change.changelistId,
                            chid1: null,
                            numberrf: parcel.BrojLN,
                            numidxrf: rlpAndNumidx.numidxrf,
                            active: 1,
                            text: '',
                            rlp: rlpAndNumidx.rlp,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: parcel.NepID,
                            nextNepID: parcel.NepID
                        };
                        folio = RealEstates.createFolio(obj);
                        folios.push(folio);

                        nRsP.folio = folio;
                        Restrictions.process(nRsP, parcel.restrictions, RealEstateTypes.PARCEL);

                        Ownership.process(nRsP, parcel.owners, RealEstateTypes.PARCEL);

                        rlpAndNumidx = Parcels.findrlpAndNumidx(parcel.BrojLN);

                        advance = true;
                    } else if (change.VrstaZakljucavanja == '\"U\"') {//Promena je ukidanje, nepokretnost nije više aktivna, prekida se obrada promena
                        oldFolio.CHANGELISTID1 = change.changelistId;
                        oldFolio.changeType = change.VrstaZakljucavanja;
                        oldFolio.currentNepID = parcel.NepID;
                        oldFolio.nextNepID = null;
                        oldFolio.ACTIVE = 0;
                        advance = false;
                    } else if (change.VrstaZakljucavanja == '\"A\"') {//Promena je izmena, prekida se obrada promena
                        oldFolio.CHANGELISTID1 = change.changelistId;
                        oldFolio.nextNepID = parcel.NepID;
                        oldFolio.ACTIVE = 0;
                        var obj = {
                            chid: change.changelistId,
                            chid1: null,
                            numberrf: parcel.BrojLN,
                            numidxrf: rlpAndNumidx.numidxrf,
                            active: 1,
                            text: '',
                            rlp: rlpAndNumidx.rlp,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: change.NoviID,
                            nextNepID: change.NoviID
                        };
                        folio = RealEstates.createFolio(obj);
                        folios.push(folio);

                        nRsP.folio = folio;

                        Restrictions.process(nRsP, parcel.restrictions, RealEstateTypes.PARCEL);

                        Ownership.process(nRsP, parcel.owners, RealEstateTypes.PARCEL);

                        advance = false;
                    }

                } else if (oldFolio.changeType == '\"U\"') {

                    if(change.VrstaZakljucavanja == '\"D\"') {
                        var obj = {
                            chid: change.changelistId,
                            chid1: null,
                            numberrf: parcel.BrojLN,
                            numidxrf: rlpAndNumidx.numidxrf,
                            active: 1,
                            text: '',
                            rlp: rlpAndNumidx.rlp,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: parcel.NepID,
                            nextNepID: parcel.NepID
                        };
                        folio = RealEstates.createFolio(obj);
                        folios.push(folio);

                        nRsP.folio = folio;
                        Restrictions.process(nRsP, parcel.restrictions, RealEstateTypes.PARCEL);

                        Ownership.process(nRsP, parcel.owners, RealEstateTypes.PARCEL);

                        rlpAndNumidx = Parcels.findrlpAndNumidx(parcel.BrojLN);

                        advance = true;
                    } else {
                        console.log('UPOZORENJE: Nije moguće Ostajanje ili Izmena nakon što je ukinuta parcela!');
                        advance = false;
                    }

                } else if (oldFolio.changeType == '\"O\"' || oldFolio.changeType == '\"A\"') {
                    if (change.VrstaZakljucavanja == '\"D\"') {
                        console.log('UPOZORENJE: Pokušaj dodavanja, a već postoje prethodna stanja!');
                        advance = false;
                    } else if (change.VrstaZakljucavanja == '\"U\"') {
                        oldFolio.CHANGELISTID1 = change.changelistId;
                        oldFolio.changeType = change.VrstaZakljucavanja;
                        //oldFolio.nextNepID = change.TabelaID;
                        oldFolio.currentNepID = parcel.NepID;
                        oldFolio.nextNepID = null;
                        oldFolio.ACTIVE = 0;
                        advance = false;
                    } else if (change.VrstaZakljucavanja == '\"O\"') {
                        oldFolio.ACTIVE = 0;
                        oldFolio.CHANGELISTID1 = change.changelistId;
                        var obj = {
                            chid: change.changelistId,
                            chid1: null,
                            numberrf: parcel.BrojLN,
                            numidxrf: rlpAndNumidx.numidxrf,
                            active: 1,
                            text: '',
                            rlp: rlpAndNumidx.rlp,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: parcel.NepID,
                            nextNepID: parcel.NepID
                        };
                        folio = RealEstates.createFolio(obj);
                        folios.push(folio);

                        nRsP.folio = folio;
                        Restrictions.process(nRsP, parcel.restrictions, RealEstateTypes.PARCEL);

                        Ownership.process(nRsP, parcel.owners, RealEstateTypes.PARCEL);

                        rlpAndNumidx = Parcels.findrlpAndNumidx(parcel.BrojLN);

                        advance = true;
                    } else if (change.VrstaZakljucavanja == '\"A\"') {
                        oldFolio.ACTIVE = 0;
                        oldFolio.CHANGELISTID1 = change.changelistId;
                        var obj = {
                            chid: change.changelistId,
                            chid1: null,
                            numberrf: parcel.BrojLN,
                            numidxrf: rlpAndNumidx.numidxrf,
                            active: 1,
                            text: '',
                            rlp: rlpAndNumidx.rlp,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: change.NoviID,
                            nextNepID: change.NoviID
                        };
                        folio = RealEstates.createFolio(obj);
                        folios.push(folio);

                        nRsP.folio = folio;
                        Restrictions.process(nRsP, parcel.restrictions, RealEstateTypes.PARCEL);

                        Ownership.process(nRsP, parcel.owners, RealEstateTypes.PARCEL);

                        advance = false;
                    }
                }

            } else { //Ne postoji staro stanje

                if (change.VrstaZakljucavanja == '\"D\"') {//Promena je dodavanje
                    var obj = {
                        chid: change.changelistId,
                        chid1: null,
                        numberrf: parcel.BrojLN,
                        numidxrf: rlpAndNumidx.numidxrf,
                        active: 1,
                        text: '',
                        rlp: rlpAndNumidx.rlp,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: parcel.NepID,
                        nextNepID: parcel.NepID
                    };
                    folio = RealEstates.createFolio(obj);
                    folios.push(folio);

                    nRsP.folio = folio;
                    Restrictions.process(nRsP, parcel.restrictions, RealEstateTypes.PARCEL);

                    Ownership.process(nRsP, parcel.owners, RealEstateTypes.PARCEL);

                    rlpAndNumidx = Parcels.findrlpAndNumidx(parcel.BrojLN);

                    advance = true;
                } else if (change.VrstaZakljucavanja == '\"O\"') {//Promena je ostajanje
                    var obj = {
                        chid: null,
                        chid1: change.changelistId,
                        numberrf: parcel.BrojLN,
                        numidxrf: rlpAndNumidx.numidxrf,
                        active: 0,
                        text: '',
                        rlp: rlpAndNumidx.rlp,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: parcel.NepID,
                        nextNepID: parcel.NepID
                    };
                    folio = RealEstates.createFolio(obj);
                    folios.push(folio);

                    nRsP.folio = folio;
                    Restrictions.process(nRsP, parcel.restrictions, RealEstateTypes.PARCEL);

                    Ownership.process(nRsP, parcel.owners, RealEstateTypes.PARCEL);

                    rlpAndNumidx = Parcels.findrlpAndNumidx(parcel.BrojLN);

                    var obj = {
                        chid: change.changelistId,
                        chid1: null,
                        numberrf: parcel.BrojLN,
                        numidxrf: rlpAndNumidx.numidxrf,
                        active: 1,
                        text: '',
                        rlp: rlpAndNumidx.rlp,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: parcel.NepID,
                        nextNepID: parcel.NepID
                    };
                    folio = RealEstates.createFolio(obj);
                    folios.push(folio);

                    nRsP.folio = folio;
                    Restrictions.process(nRsP, parcel.restrictions, RealEstateTypes.PARCEL);

                    Ownership.process(nRsP, parcel.owners, RealEstateTypes.PARCEL);

                    rlpAndNumidx = Parcels.findrlpAndNumidx(parcel.BrojLN);

                    advance = true;
                } else if (change.VrstaZakljucavanja == '\"U\"') {//Promena je ukidanje, nepokretnost nije više aktivna, prekida se obrada promena
                    var obj = {
                        chid: null,
                        chid1: change.changelistId,
                        numberrf: parcel.BrojLN,
                        numidxrf: rlpAndNumidx.numidxrf,
                        active: 0,
                        text: '',
                        rlp: rlpAndNumidx.rlp,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: parcel.NepID,
                        nextNepID: null //parcel.NepID
                    };
                    folio = RealEstates.createFolio(obj);
                    folios.push(folio);

                    nRsP.folio = folio;
                    Restrictions.process(nRsP, parcel.restrictions, RealEstateTypes.PARCEL);

                    Ownership.process(nRsP, parcel.owners, RealEstateTypes.PARCEL);

                    advance = false;
                }
                else if (change.VrstaZakljucavanja == '\"A\"') {//Promena je izmena, prekida se obrada promena
                    var obj = {
                        chid: null,
                        chid1: change.changelistId,
                        numberrf: parcel.BrojLN,
                        numidxrf: rlpAndNumidx.numidxrf,
                        active: 0,
                        text: '',
                        rlp: rlpAndNumidx.rlp,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: parcel.NepID,
                        nextNepID: parcel.NepID
                    };
                    folio = RealEstates.createFolio(obj);
                    folios.push(folio);

                    nRsP.folio = folio;
                    Restrictions.process(nRsP, parcel.restrictions, RealEstateTypes.PARCEL);

                    Ownership.process(nRsP, parcel.owners, RealEstateTypes.PARCEL);

                    rlpAndNumidx = Parcels.findrlpAndNumidx(parcel.BrojLN);

                    var obj = {
                        chid: change.changelistId,
                        chid1: null,
                        numberrf: parcel.BrojLN,
                        numidxrf: rlpAndNumidx.numidxrf,
                        active: 1,
                        text: '',
                        rlp: rlpAndNumidx.rlp,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: change.NoviID,
                        nextNepID: change.NoviID
                    };
                    folio = RealEstates.createFolio(obj);
                    folios.push(folio);

                    nRsP.folio = folio;
                    Restrictions.process(nRsP, parcel.restrictions, RealEstateTypes.PARCEL);

                    Ownership.process(nRsP, parcel.owners, RealEstateTypes.PARCEL);

                    advance = false;
                }

            }
            oldFolio = folio;

            return advance;
        });
    }


};

Parcels.findDistinct = function() {
    var mongo = app.db;
    return mongo.parcele.aggregate(
        [
            {"$group": { "_id": { BrParc: "$BrParc", PodbrParc: "$PodbrParc" } } },
            { $sort: { _id: 1 } }
        ]
    );
};

module.exports = Parcels;
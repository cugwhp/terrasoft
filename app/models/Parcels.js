var Q = require('q');

var app = require('../../app');

var PartsOfParcels = require('./PartsOfParcels');
var RealEstates = require('./RealEstates');

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
            this.data = data.records;
            mongo.parcele.insert(this.data)
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
    return app.db.parcele.find({$query: condition, $orderBy:{NepID: 1}}).toArray()
        .then(function(parcels) {
            return parcels.reduce(function(promise, parcel) {
                return promise.then(function() {
                    result.push(parcel);
                    return PartsOfParcels.find(parcel);
                });
            }, Q([]));
        });
};

Parcels.suid = 0;

Parcels.createKnz = function(p) {
    var knzP = {
        SUID: Parcels.suid++,
        NUMBER: p.BrParc,
        NUMIDX: p.PodbrParc,
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
    }
    return knzP;
};

/**
 * Pronalazi maksimalne vrednosti RLP i NUMIDXRF za dati broj l.n.
 * kako bi se označavanje folia nastavilo od tih vrednosti
 *
 * @param numberrf
 * @returns promise
 */
Parcels.prepareProcess = function(numberrf) {
    return {
        rlp: 1,
        numidxrf: 1
    }
};

/**
 * Kreira folie za svaku promenu na parceli
 * @param parcel
 * @param folios
 */
Parcels.process = function(parcel, folios) {
    var rlp = 1;
    var numidxrf;
    var folio;

    var changes = parcel.changes ? parcel.changes : [];

    //oldFolio bi trebalo da je uvek poslednji u nizu folios
    var oldFolio;
    if(folios && folios.length > 0) {
        oldFolio = folios[folios.length - 1];
    }

    //pronaći odgovarajući RLP i NUMIDXRF
    //select max(rlp) as rlp from n_rs_realestatefolio where numberrf=parcel.BrojLN
    //if(rlp) {rlp += 1} else {rlp = 1}
    //

    if(changes.length == 0) {
        //Nema nikakvih promena na parceli
        if(!oldFolio) {
            var obj = {
                chid: null,
                chid1: null,
                numberrf: parcel.BrojLN,
                numidxrf: 1,
                active: 1,
                text: '',
                rlp: rlp,
                changeType: null,
                currentNepID: partOfParcel.NepID,
                nextNepID: partOfParcel.NepID
            };
            folio = RealEstates.createFolio(obj);
            folios.push(folio);
        }
    } else {
        changes.every(function (change) {//Mislim da ću promeniti na forEach jer će se uvek gledati svaka promena
            var advance = true;

            if (oldFolio) { //Postoji staro stanje

                if(oldFolio.NUMBERRF == parcel.BrojLN) {
                    rlp++;
                } else {
                    rlp = 1;
                }

                if (oldFolio.changeType == '\"D\"') {//Prethodna promena je dodavanje

                    if (change.VrstaZakljucavanja == '\"D\"') {//Promena je dodavanje
                        console.log("UPOZORENJE: Dve promene za redom su dodavanje!");
                        advance = false;
                    } else if (change.VrstaZakljucavanja == '\"O\"') {//Promena je ostajanje
                        oldFolio.CHANGELISTID1 = change.changelistId;
                        oldFolio.nextNepID = partOfParcel.NepID;
                        oldFolio.ACTIVE = 0;
                        var obj = {
                            chid: change.changelistId,
                            chid1: null,
                            numberrf: parcel.BrojLN,
                            numidxrf: oldFolio.numidxrf + 1,
                            active: 1,
                            text: '',
                            rlp: rlp,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: parcel.NepID,
                            nextNepID: parcel.NepID
                        };
                        folio = RealEstates.createFolio(obj);
                        folios.push(folio);
                        advance = true;
                    } else if (change.VrstaZakljucavanja == '\"U\"') {//Promena je ukidanje, nepokretnost nije više aktivna, prekida se obrada promena
                        oldFolio.CHANGELISTID1 = change.changelistId;
                        oldFolio.changeType = change.VrstaZakljucavanja;
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
                            numidxrf: oldFolio.numidxrf + 1,
                            active: 1,
                            text: '',
                            rlp: rlp,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: parcel.NepID,
                            nextNepID: change.NoviID
                        };
                        folio = RealEstates.createFolio(obj);
                        folios.push(folio);
                        advance = false;
                    }

                } else if (oldFolio.changeType == '\"U\"') {

                    if(change.VrstaZakljucavanja == '\"D\"') {
                        var obj = {
                            chid: change.changelistId,
                            chid1: null,
                            numberrf: parcel.BrojLN,
                            numidxrf: 1, // Videti šta sa NUMIDXRF
                            active: 1,
                            text: '',
                            rlp: rlp,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: parcel.NepID,
                            nextNepID: parcel.NepID
                        };
                        folio = RealEstates.createFolio(obj);
                        folios.push(folio);
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
                            numidxrf: oldFolio.NUMIDXRF + 1,
                            active: 1,
                            text: '',
                            rlp: rlp,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: parcel.NepID,
                            nextNepID: parcel.NepID
                        };
                        folio = RealEstates.createFolio(obj);
                        folios.push(folio);
                        advance = true;
                    } else if (change.VrstaZakljucavanja == '\"A\"') {
                        oldFolio.active = 0;
                        oldFolio.CHANGELISTID1 = change.changelistId;
                        var obj = {
                            chid: change.changelistId,
                            chid1: null,
                            numberrf: parcel.BrojLN,
                            numidxrf: oldFolio.NUMIDXRF + 1,
                            active: 0,
                            text: '',
                            rlp: 1,
                            changeType: change.VrstaZakljucavanja,
                            currentNepID: parcel.NepID,
                            nextNepID: change.NoviID
                        };
                        folio = RealEstates.createFolio(obj);
                        folios.push(folio);
                        advance = false;
                    }
                }

            } else { //Ne postoji staro stanje

                if (change.VrstaZakljucavanja == '\"D\"') {//Promena je dodavanje
                    var obj = {
                        chid: change.changelistId,
                        chid1: null,
                        numberrf: parcel.BrojLN,
                        numidxrf: 1,
                        active: 1,
                        text: '',
                        rlp: rlp,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: parcel.NepID,
                        nextNepID: parcel.NepID
                    };
                    folio = RealEstates.createFolio(obj);
                    folios.push(folio);
                    advance = true;
                } else if (change.VrstaZakljucavanja == '\"O\"') {//Promena je ostajanje
                    var obj = {
                        chid: null,
                        chid1: change.changelistId,
                        numberrf: parcel.BrojLN,
                        numidxrf: 1,
                        active: 0,
                        text: '',
                        rlp: rlp,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: parcel.NepID,
                        nextNepID: parcel.NepID
                    };
                    folio = RealEstates.createFolio(obj);
                    folios.push(folio);
                    var obj = {
                        chid: change.changelistId,
                        chid1: null,
                        numberrf: parcel.BrojLN,
                        numidxrf: 2,
                        active: 1,
                        text: '',
                        rlp: rlp,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: parcel.NepID,
                        nextNepID: parcel.NepID
                    };
                    folio = RealEstates.createFolio(obj);
                    folios.push(folio);
                    advance = true;
                } else if (change.VrstaZakljucavanja == '\"U\"') {//Promena je ukidanje, nepokretnost nije više aktivna, prekida se obrada promena
                    var obj = {
                        chid: null,
                        chid1: change.changelistId,
                        numberrf: parcel.BrojLN,
                        numidxrf: 1,
                        active: 0,
                        text: '',
                        rlp: rlp,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: parcel.NepID,
                        nextNepID: null
                    };
                    folio = RealEstates.createFolio(obj);
                    folios.push(folio);
                    advance = false;
                }
                else if (change.VrstaZakljucavanja == '\"A\"') {//Promena je izmena, prekida se obrada promena
                    var obj = {
                        chid: null,
                        chid1: change.changelistId,
                        numberrf: parcel.BrojLN,
                        numidxrf: 1,
                        active: 0,
                        text: '',
                        rlp: rlp,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: parcel.NepID,
                        nextNepID: parcel.NepID
                    };
                    folio = RealEstates.createFolio(obj);
                    folios.push(folio);
                    var obj = {
                        chid: change.changelistId,
                        chid1: null,
                        numberrf: parcel.BrojLN,
                        numidxrf: 2,
                        active: 0,
                        text: '',
                        rlp: rlp,
                        changeType: change.VrstaZakljucavanja,
                        currentNepID: parcel.NepID,
                        nextNepID: change.NoviID
                    };
                    folio = RealEstates.createFolio(obj);
                    folios.push(folio);
                    advance = false;
                }

            }
            oldFolio = folio;

            return advance;
        });
    }


};

module.exports = Parcels;
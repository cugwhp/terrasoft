var app = require('../../app');
var RealEstateTypes = require('./RealEstateTypes');

function Restrictions() {};

Restrictions.clear = function() {
    var app = require('../../app');
    var mongo = app.db;
    return mongo.tereti.remove({})
        .then(function() {
            return mongo.tereti.remove({});
        });
};

Restrictions.toMongo = function() {
    'use strict;'

    var app = require('../../app');
    var conn = app.adodb.kn;
    var mongo = app.db;

    conn.query('SELECT TerID, ' +
        'Teret, ' +
        'LiceID, ' +
        'NepID, ' +
        'OpisTereta, ' +
        'Format(DatumUpisa, "yyyy/mm/dd HH:mm:ss") AS DatumUpisa, ' +
        'Format(Trajanje, "yyyy/mm/dd HH:mm:ss") AS Trajanje, ' +
        'Format(DatumBrisanja, "yyyy/mm/dd HH:mm:ss") AS DatumBrisanja, ' +
        'Format(CREATED, "yyyy/mm/dd HH:mm:ss") AS CREATED, ' +
        'Format(RETIRED, "yyyy/mm/dd HH:mm:ss") AS RETIRED, ' +
        'VrstaStanja, ' +
        'LiceIDTeret ' +
        'FROM Tereti')
        .on('done', function(data) {
            var preparedData = data.records.map(function(rec) {
                rec.CREATED = rec.CREATED ? new Date(rec.CREATED) : null;
                rec.RETIRED = rec.RETIRED ? new Date(rec.RETIRED) : null;
                rec.DatumUpisa = rec.DatumUpisa ? new Date(rec.DatumUpisa) : null;
                rec.Trajanje = rec.Trajanje ? new Date(rec.Trajanje) : null;
                rec.DatumBrisanja = rec.DatumBrisanja ? new Date(rec.DatumBrisanja) : null;
                return rec;
            });
            mongo.tereti.insert(preparedData)
                .then(function() {
                    console.log('Učitana tabela Tereti');
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
        });
};

Restrictions.find = function(realEstate) {
    var mongo = app.db;
    return mongo.tereti.find({NepID: realEstate.NepID})
        .toArray()
        .then(function(restrictions) {
            realEstate.restrictions = restrictions;
        });
};

Restrictions.oid = 0;

Restrictions.nRsRestrictions = [];

Restrictions.createKnz = function(restriction,
                                  realEstate,
                                  realEstateType,
                                  changelistId,
                                  changelistId1,
                                  active) {

    var result;
    var parcelid = null;
    var partofparcelid = null;
    var buildingid = null;
    var partofbuildingid = null;
    var sequence = null;
    var number = null;
    var numidx = null;

    console.log(realEstateType);
    console.log(realEstate.folio.UID);
    console.log(realEstate.folio.CHANGELISTID);
    console.log(realEstate.folio.CHANGELISTID1);
    console.log(changelistId);
    console.log(changelistId1);
    console.log(active);

    if( realEstateType == RealEstateTypes.PARCEL ) {
        parcelid = realEstate.SUID;
        number = realEstate.NUMBER;
        numidx = realEstate.NUMIDX;
    } else if( realEstateType == RealEstateTypes.BUILDING ) {
        parcelid = realEstate.PARCELID;
        partofparcelid = realEstate.PARTPARCELID;
        buildingid = realEstate.SUID;
        number = realEstate.NUMBER;
        numidx = realEstate.NUMIDX;
        sequence = realEstate.SEQUENCE;
    } else if( realEstateType == RealEstateTypes.PARTOFBUILDING ) {
        parcelid = realEstate.PARCELID;
        partofparcelid = realEstate.PARTPARCID;
        buildingid = realEstate.BUILDINGID;
        partofbuildingid = realEstate.SUID;
        number = realEstate.NUMBER;
        numidx = realEstate.NUMBERIDX;
        sequence = realEstate.SEQUENCE;
    } else {
        throw new Error('GREŠKA: Nije specificiran tip nepokretnosti!');
    }

    result = {
        OID: Restrictions.oid++,
        PARCELID: parcelid,
        NUMBER: number,
        NUMIDX: numidx,
        PARTOFPARCELID: partofparcelid,
        SEQUENCE: sequence,
        CHANGELISTID: changelistId,
        WAYUSEID: null,
        RIGHTTYPEID: null,
        BUILDINGID: buildingid,
        PARTOFBUILDINGID: partofbuildingid,
        PARTYID: null,
        TIMESPEC: null,
        DENOMINATOR: null,
        NUMERATOR: null,
        BEGINLIFESPANVERSION: null,
        ENDLIFESPANVERSION: null,
        UID: realEstate.folio.UID,
        RESTRICTIONTYPE: restriction.Teret, //SELECT ID FROM LA_RESTRICTIONTYPE where sign = restriction.Teret
        REGDATE: restriction.DatumUpisa,
        HOUR: 0,
        MINUTE: 0,
        AREA: null,
        RBR: null,
        ACTIVE: active,
        DELDATE: restriction.DatumBrisanja,
        SUBFOLIO: null,
        NUMREST: null,
        DESCRIPTION: restriction.OpisTereta,
        CHANGELISTID1: changelistId1,
        UNITNUM: realEstate.EvidBrDO ? realEstate.EvidBrDO : null, //nije null samo ako je deo objekta
        LOANPURPOSEID: null,
        MORTGAGETYPEID: null,
        REGBASIS: null,
        VALUE: null,
        DEADLINE: null,
        GRACE: null,
        CREDITORID: null,
        CREDITPART: null,
        INTEREST: null,
        DEBTORID: null,
        EASEMENTTYPEID: null,
        REGEASE: null,
        HOLDERID: null,
        DESCRIPTIONEASE: null,
        NOTICETYPEID: null,
        REGNOTICE: null,
        DESCRIPTIONNOT: null
    };

    return result;
};

/**
 * @param realEstate
 * @param realEstateType
 * @returns
 */
Restrictions.process = function(realEstate, restrictions, realEstateType) {
    'use strict';

    var changelistId = null;
    var changelistId1 = null;
    var nRsRestriction;

    restrictions.forEach( function( restriction ) {

        var nRsRestriction;

        if( restriction.changes ) {
            if (restriction.changes.length == 1) {
                if (restriction.changes[0].VrstaZakljucavanja == '\"D\"') {
                    changelistId = restriction.changes[0].changelistId;
                } else if (restriction.changes[0].VrstaZakljucavanja == '\"U\"') {
                    changelistId1 = restriction.changes[0].changelistId;
                }
            } else if (restriction.changes.length == 2) {
                changelistId = restriction.changes[0].changelistId;
                changelistId1 = restriction.changes[1].changelistId;
            }

            if (changelistId) {
                if (changelistId1) {
                    if (( changelistId >= realEstate.folio.CHANGELISTID ) &&
                        ( changelistId1 <= realEstate.folio.CHANGELISTID1 )) {
                        nRsRestriction = Restrictions.createKnz(restriction,
                            realEstate,
                            realEstateType,
                            changelistId,
                            changelistId1,
                            0); //active = 0

                    }
                } else {
                    if (changelistId >= realEstate.folio.CHANGELISTID) {
                        nRsRestriction = Restrictions.createKnz(restriction,
                            realEstate,
                            realEstateType,
                            changelistId,
                            changelistId1,
                            1); //active = 1

                    }
                }
            } else {
                if (changelistId1) {
                    if (changelistId1 <= realEstate.folio.CHANGELISTID1) {
                        nRsRestriction = Restrictions.createKnz(restriction,
                            realEstate,
                            realEstateType,
                            changelistId,
                            changelistId1,
                            0); //active = 0

                    }
                }
            }
        } else {
            nRsRestriction = Restrictions.createKnz(restriction,
                realEstate,
                realEstateType,
                changelistId,
                changelistId1,
                1); //active = 1
        }

        if( nRsRestriction ) {
            Restrictions.nRsRestrictions.push(nRsRestriction);
        }

    });

};

module.exports = Restrictions;
var app = require('../../app');
var cm = require('./cm');

var RealEstateTypes = require('./RealEstateTypes');
var Utilities = require('./Utilities');

function Ownership() {

}

Ownership.N_RS_OWNERSHIPPARCEL_SEQUENCE = 'KNZ_VOZD.NRSOWNERSHIPPARCEL_SEQ' + cm.cadMunId;
Ownership.N_RS_OWNERSHIPBUILDING_SEQUENCE = 'KNZ_VOZD.NRSOWNERSHIPBUILDING_SEQ' + cm.cadMunId;

Ownership.clear = function() {
    var mongo = app.db;
    return mongo.pravniodnosi.remove({});
};

Ownership.toMongo = function() {
    var conn = app.adodb.kn;
    var mongo = app.db;
    conn.query('SELECT * FROM PravniOdnosi')
        .on('done', function(data) {
            mongo.pravniodnosi.insert(data.records)
                .then(function() {
                    console.log('Učitana tabela PravniOdnosi');
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

Ownership.find = function(realEstate) {
    var mongo = app.db;
    return mongo.pravniodnosi.find({NepID: realEstate.NepID})
        .toArray()
        .then(function(ownership) {
            realEstate.owners = ownership;
        });
};

Ownership.nRsOwnershipParcelId = 0;

Ownership.nRsOwnershipBuildingId = 0;

Ownership.laRightType = [];

Ownership.nClRightShare = [];

Ownership.nClOwnershipType = [];

Ownership.createNRsOwnership = function(ownership, realEstate, realEstateType, ownershipChangelistId) {
    var result;
    if((realEstateType == RealEstateTypes.PARCEL) || (realEstateType == RealEstateTypes.PARTOFPARCEL)) {
        result = {
            OID: Utilities.createId(Ownership.nRsOwnershipParcelId),//Ownership.N_RS_OWNERSHIPPARCEL_SEQUENCE + '.NEXTVAL',
            RIGHTTYPEID: Utilities.findIdBySign(Ownership.laRightType, ownership.VrstaPrava),
            TIMESPEC: null,
            DESCRIPTION: null,
            DENOMINATOR: ownership.Imenilac,
            NUMERATOR: ownership.Brojilac,
            BEGINLIFESPANVERSION: null,
            ENDLIFESPANVERSION: null,
            PARTYID: Utilities.createId(ownership.LiceID),
            UID: realEstate.folio.UID,
            RIGHTSHAREID: Utilities.findIdBySign(Ownership.nClRightShare, ownership.ObimPrava),
            OWNERSHIPTYPEID: Utilities.findIdBySign(Ownership.nClOwnershipType, ownership.OblikSvojine),
            PREREG: null,
            FOUNDERID: null,
            CHANGELISTID: realEstate.folio.CHANGELISTID,
            POREZ: null,
            OSNOVUPISA: null
        }
        Ownership.nRsOwnershipParcelId += 1;
    } else {
        result = {
            OID: Utilities.createId(Ownership.nRsOwnershipBuildingId), //Ownership.N_RS_OWNERSHIPBUILDING_SEQUENCE + '.NEXTVAL',
            RIGHTTYPEID: Utilities.findIdBySign(Ownership.laRightType, ownership.VrstaPrava),
            TIMESPEC: null,
            DESCRIPTION: null,
            DENOMINATOR: ownership.Imenilac,
            NUMERATOR: ownership.Brojilac,
            BEGINLIFESPANVERSION: null,
            ENDLIFESPANVERSION: null,
            PARTYID: Utilities.createId(ownership.LiceID),
            UID: realEstate.folio.UID,
            SUBFOLIO: null,
            RIGHTSHAREID: Utilities.findIdBySign(Ownership.nClRightShare, ownership.ObimPrava),
            OWNERSHIPTYPEID: Utilities.findIdBySign(Ownership.nClOwnershipType, ownership.OblikSvojine),
            PREREG: null,
            FOUNDERID: null,
            CHANGELISTID: ownershipChangelistId,
            POREZ: null,
            OSNOVUPISA: null
        }
        Ownership.nRsOwnershipBuildingId += 1;
    }
    return result;
};

Ownership.nRsOwnershipParcel = [];

Ownership.nRsOwnershipBuilding = [];

Ownership.process = function(realEstate, owners, realEstateType) {
    'use strict';

    var changelistId = null;
    var changelistId1 = null;

    owners.forEach( function( ownership ) {

        var nRsOwnership;

        if( ownership.changes ) {
            if (ownership.changes.length == 1) {
                if (ownership.changes[0].VrstaZakljucavanja == '\"D\"') {
                    changelistId = ownership.changes[0].changelistId;
                } else if (ownership.changes[0].VrstaZakljucavanja == '\"U\"') {
                    changelistId1 = ownership.changes[0].changelistId;
                }
            } else if (ownership.changes.length == 2) {
                changelistId = ownership.changes[0].changelistId;
                changelistId1 = ownership.changes[1].changelistId;
            }

            if (changelistId) {
                if (changelistId1) {
                    if (( changelistId >= realEstate.folio.CHANGELISTID ) &&
                        ( changelistId1 <= realEstate.folio.CHANGELISTID1 )) {
                        nRsOwnership = Ownership.createNRsOwnership(ownership,
                            realEstate,
                            realEstateType,
                            changelistId);
                    }
                } else {
                    if (changelistId >= realEstate.folio.CHANGELISTID) {
                        nRsOwnership = Ownership.createNRsOwnership(ownership,
                            realEstate,
                            realEstateType,
                            changelistId);
                    }
                }
            } else {
                if (changelistId1) {
                    if (changelistId1 <= realEstate.folio.CHANGELISTID1) {
                        nRsOwnership = Ownership.createNRsOwnership(ownership,
                            realEstate,
                            realEstateType,
                            changelistId);
                    }
                }
            }
        } else {
            nRsOwnership = Ownership.createNRsOwnership(ownership,
                realEstate,
                realEstateType,
                changelistId);
        }

        if( nRsOwnership ) {
            if((realEstateType == RealEstateTypes.PARCEL) || (realEstateType == RealEstateTypes.PARTOFPARCEL)) {
                Ownership.nRsOwnershipParcel.push(nRsOwnership);
            } else {
                Ownership.nRsOwnershipBuilding.push(nRsOwnership);
            }
        }

    });

};

Ownership.initCodelists = function() {
    Ownership.nClRightShare = Utilities.loadCodelist('n_cl_rightshare.json');
    Ownership.laRightType = Utilities.loadCodelist('la_righttype.json');
    Ownership.nClOwnershipType = Utilities.loadCodelist('n_cl_ownershiptype.json');
};

module.exports = Ownership;
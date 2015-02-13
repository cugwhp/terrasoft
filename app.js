//MongoDB configuration
var pmongo = require('promised-mongo');
var Q = require('q');
var fs = require('fs');

var RealEstates = require('./app/models/RealEstates');

var cm = require('./app/models/cm');

var uristring = 'mongodb://localhost/knz';
var collections = [
    'nepokretnosti',
    'parcele',
    'deloviparcela',
    'objekti',
    'deloviobjekata',
    'transakcije',
    'elpromene',
    'odnosinep',
    'tereti',
    'predmeti',
    'lica'
];

var db = pmongo.connect(uristring, collections);

var ADODB = require('node-adodb');
var knsConn = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=D:\\KNZ\\Lazarevac\\KNS70165.mdb;');
var knConn = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=D:\\KNZ\\Lazarevac\\KN723070.mdb;');
var knlConn = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=D:\\KNZ\\Lazarevac\\KNL70165.mdb;');
var rpjConn = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=D:\\KNZ\\Lazarevac\\RPJ70165.mdb;');

module.exports = {
    db: db,
    adodb: {
        kns: knsConn,
        kn: knConn,
        knl: knlConn,
        rpj: rpjConn
    }
};

//var nepokretnosti = require('./app/models/nepokretnosti');
var parcel = require('./app/models/parcel');
var partofparcel = require('./app/models/partofparcel');

//nepokretnosti.toMongo();
//parcele.toMongo();
//deloviparcela.toMongo();

//var transakcije = require('./app/models/transakcije');
//transakcije.toMongo();

var elPromene = require('./app/models/elementarnepromene');
//elPromene.toMongo();

var odnosiNep = require('./app/models/odnosinepokretnosti');
//odnosiNep.toMongo();

var tereti = require('./app/models/tereti');
//tereti.toMongo();


/*tereti.findRestrictions(9141)
    .then(function(restrictions) {
        restrictions.forEach(function(restriction) {
            elPromene.findChanges(3, restriction.TerID)
                .then(function (change) {
                    restriction.promene = change;
                    console.log(restriction)
                })
                .done()
            })
    })
    .done();*/


/*db.parcele.group({
    key: {BrParc: 1, PodbrParc: 1},
    reduce: function(cur, result) {result.count += 1; result.NepIDs.push(cur.NepID)},
    initial: {count: 0, NepIDs: []}
    })
    .then(function(parcels) {
        var i = 1;
        parcels.forEach(function(parcel) {
            if(parcel.count > 1) {
                console.log(i++ + ': ' + parcel.BrParc + '/' + parcel.PodbrParc + ' [' + parcel.NepIDs + ']')
            }
        });
    })
    .done();*/

var building = require('./app/models/building');
var partofbuilding = require('./app/models/partofbuilding');
//zgrade.toMongo();


/*parcel.find(773)
    .then(function(parcels) {
       return Q.all(parcels.map(function(p) {
             return Q.all([parcel.findParts(p), parcel.findChanges(p)])
                 .then(function(results) {
                     p.parts = results[0]
                     p.changes = results[1]
                     return p
                 })
       }))
    })
    .then(function(results) {
        fs.writeFileSync('D:\\KNZ\\test\\parcela_773_0.json', JSON.stringify(results, undefined, 2))
        var p = results[0]
        var orcl = {};
        orcl.parcel = parcel.createKnzParcel(p);
        var temp = partofparcel.process(p);
        orcl.partsOfParcel = temp.partsOfParcel;
        orcl.folios = temp.folios;
        return orcl
    })
    .then(function(orcl) {
        fs.writeFileSync('D:\\KNZ\\test\\orcl.json', JSON.stringify(orcl, undefined, 2))
    })
    .done(process.exit)*/


//partofbuilding.toMongo();

/*building.find(10444)
    .done()*/

/*parcel.find(773)
    .then(function(parcels) {
       return  parcel.findParts(parcels[0])
    })
    .then(function(parts) {
        return Q.all(parts.map(function(part) {
            return partofparcel.processHistory(part)
        }))
    })
    .then(console.log)
    .done(process.exit)*/

/*parcel.find(1391)
    .then(function(parcels) {
        return  parcel.findParts(parcels[0])
    })
    .then(function(parts) {
        return partofparcel.findBuildings(parts[0])
    })
    .then(function(buildings) {
        return Q.all(buildings.map(function(building) {
            return odnosiNep.processHistory(building, 'objekti')
        }))
 })
 .then(console.log)
 .done(process.exit)*/

/*parcel.find(1391)
    .then(function(parcels) {
        return Q.all(parcels.map(function(p) {
            return Q.all([parcel.findParts(p), parcel.findChanges(p)])
                .then(function(results) {
                    p.parts = results[0];
                    p.changes = results[1];
                    return p;
                })
        }))
    })
    .then(function(parcels) {
        var buildings = [];
        var pparts = [];
        var bparts = [];
        parcels.forEach(function(parcel) {
            parcel.parts.forEach(function(part) {
                pparts.push(part);
                part.buildings.forEach(function(building) {
                    buildings.push(building);
                    building.parts.forEach(function(bpart) {
                        bparts.push(bpart);
                    })
                })
            })
        });
        console.log(bparts.length);
        return building.process(bparts);
    })
    .then(function(results) {
        console.log(results.length);
        var history = [];
        var soh = [];
        results.forEach(function(r) {
            r.forEach(function(h) {
                soh.push({
                    building: h.building.NepID,
                    parent: h.building.parent.NepID,
                    chid: h.prevChange,
                    chid1: h.nextChange
                });
            });
            history.push(soh);
            soh = [];
        });
        fs.writeFileSync('D:\\KNZ\\test\\history.json', JSON.stringify(history, undefined, 2))
        var util = require('util');
        console.log(util.inspect(process.memoryUsage()));    })
    .done(process.exit)*/

var Evidentions = require('./app/models/Evidentions.js');
var Transactions = require('./app/models/Transactions.js');
var ElementaryChanges = require('./app/models/ElementaryChanges.js');

var trans = new Transactions();
var elChan = new ElementaryChanges();

//evids.toMongo();
//trans.read();

/**
 * Učitavanje nepokretnosti i tereta iznova jer se zapisi u MongoDB menjaju tokom obrade
 */

/*var realEstatesToMongo = require('./acc2mng');
realEstatesToMongo();*/


/**
 * Rekonstruisanje istorije promena prema istorijatu predmeta
 */


/*Evidentions.load()
    .then(function(evidentions) {
        return Evidentions.process(evidentions);
    })
    .then(function() {
        //fs.writeFileSync('C:\\node\\knz\\n_rs_changelist.sql', Transactions.insertStatements);
        console.log('Rekonstruisana je istorija promena');
    })
    .done();*/

/*var ChangeTypes = require('./app/models/ChangeTypes');
var changeTypesCodeList = ChangeTypes.createInsertStatements('KNZ_VOZD.N_CL_CHANGETYPE');
fs.writeFileSync('C:\\node\\knz\\n_cl_changetype.sql', changeTypesCodeList);*/

var Parcels = require('./app/models/Parcels');
var PartsOfParcels = require('./app/models/PartsOfParcels');
var Buildings = require('./app/models/Buildings');
var PartsOfBuildings = require('./app/models/PartsOfBuildings');
var Restrictions = require('./app/models/Restrictions');
var Utilities = require('./app/models/Utilities');
/**
 * Konstruisanje redosleda promena na nepokretnostima
 */
var result = [];
var parcelNumber = 1627;// 1391, 773, 1625, 1627
var parcelSubNumber = null;

Parcels.find(parcelNumber, parcelSubNumber, result)
    .then(function() {

        console.log(JSON.stringify(result, function(key, value) {
            if(key === 'parent') {
                return null;
            } else {
                return value;
            }
        }, 2));

        var parcels = result;
        var parcel = parcels[0];
        var nRsParcel = [];
        var pFolios = [];
        var ppFolios = [];
        var nRsPartOfParcel = [];
        var bFolios = [];
        var nRsBuilding = [];
        var pbFolios = [];
        var nRsPartOfBuilding = [];
        if(!parcels) {
            throw new Error('GREŠKA: Nije pronađena parcela 1391!');
        } else if(parcels.length == 0) {
            throw new Error('GREŠKA: Nije pronađena parcela 1391!');
        }
        RealEstates.sort(parcels);
        var nRsP = Parcels.createKnz(parcels[0]);
        var parcelSuid = nRsP.SUID;
        nRsParcel.push(nRsP);
        parcels.forEach(function(parcel) {
            console.log('PARCELA ' + parcel.NepID);
            Parcels.process(parcel, pFolios, nRsP);
            var parts = parcel.parts;
            RealEstates.sort(parts);
            parts.forEach(function(part) {
                console.log('DEO PARCELE ' + part.NepID);
                PartsOfParcels.process(part, pFolios, parcelSuid, nRsPartOfParcel);
                var buildings = part.buildings;
                RealEstates.sort(buildings);
                buildings.forEach(function(building) {
                    console.log('OBJEKAT ' + building.NepID);
                    Buildings.process(building, nRsPartOfParcel, bFolios, nRsBuilding);

                    var partsOfBuilding = building.parts;

                    RealEstates.sort(partsOfBuilding);

                    partsOfBuilding.forEach(function(partOfBuilding) {
                        console.log('DEO OBJEKTA ' + partOfBuilding.NepID);
                        PartsOfBuildings.process(partOfBuilding, nRsBuilding, pbFolios, nRsPartOfBuilding);
                    });
                });
            });
        });
        //console.log(JSON.stringify(pbFolios));

        var allFolios = pFolios.concat(bFolios, pbFolios);
        //fs.appendFileSync('C:\\node\\knz\\folios' + parcelNumber + '_' + parcelSubNumber + '.sql', Utilities.createInsertStatements('KNZ_VOZD.N_RS_REALESTATEFOLIO', allFolios));
        //fs.appendFileSync('C:\\node\\knz\\parcels' + parcelNumber + '_' + parcelSubNumber + '.sql', Utilities.createInsertStatements('KNZ_VOZD.N_RS_PARCEL', nRsParcel));
        //fs.appendFileSync('C:\\node\\knz\\parts' + parcelNumber + '_' + parcelSubNumber + '.sql', Utilities.createInsertStatements('KNZ_VOZD.N_RS_PARTOFPARCEL', nRsPartOfParcel));
        //fs.appendFileSync('C:\\node\\knz\\buildings' + parcelNumber + '_' + parcelSubNumber + '.sql', Utilities.createInsertStatements('KNZ_VOZD.N_RS_BUILDING', nRsBuilding));
        //fs.writeFileSync('C:\\node\\knz\\partsbuildings' + parcelNumber + '_' + parcelSubNumber + '.sql', Utilities.createInsertStatements('KNZ_VOZD.N_RS_PARTOFBUILDING', nRsPartOfBuilding));
        fs.writeFileSync('C:\\node\\knz\\n_rs_restrictions.sql', Utilities.createInsertStatements('KNZ_VOZD.N_RS_RESTRICTIONS', Restrictions.nRsRestrictions));
    })
    /*.then(function(parcels) {
        var buildings = [];
        var pparts = [];
        var bparts = [];
        parcels.forEach(function(parcel) {
            parcel.parts.forEach(function(part) {
                pparts.push(part);
                part.buildings.forEach(function(building) {
                    buildings.push(building);
                    building.parts.forEach(function(bpart) {
                        bparts.push(bpart);
                    })
                })
            })
        });
        console.log('Pripremljene nepokretnosti');
        var completeHistory = {};
        completeHistory.parcels = RealEstates.processHistory(parcels);
        completeHistory.partsofparcels = RealEstates.processHistory(pparts);
        completeHistory.buildings = RealEstates.processHistory(buildings);
        completeHistory.partsofbuildings = RealEstates.processHistory(bparts);
        return completeHistory;
    })*/
    /*.then(function(results) {
        var history = [];
        var soh = [];

        console.log('Parcels KNZ');

        results.parcels.forEach(function(r) {
            r.forEach(function(h) {
                h.re.knz = Parcels.createKnzParcel(h.re);
                console.log(h.re.knz);
                soh.push({
                    realestate: h.re.NepID,
                    parent: null,
                    chid: h.prevChange,
                    chid1: h.nextChange
                });
            });
            history.push(soh);
            soh = [];
        });

        console.log('Parts of Parcels KNZ');

        fs.writeFileSync('D:\\KNZ\\test\\history_parcels.json', JSON.stringify(history, undefined, 2));
        history = [];
        soh = [];
        results.partsofparcels.forEach(function(r) {
            r.forEach(function(h) {
                h.re.knz = PartsOfParcels.createKnzPartOfParcel(h.re);
                console.log(h.re.knz);
                soh.push({
                    realestate: h.re.NepID,
                    parent: h.re.parent.NepID,
                    chid: h.prevChange,
                    chid1: h.nextChange
                });
            });
            history.push(soh);
            soh = [];
        });
        fs.writeFileSync('D:\\KNZ\\test\\history_partsofparcels.json', JSON.stringify(history, undefined, 2));
        history = [];
        soh = [];
        results.buildings.forEach(function(r) {
            r.forEach(function(h) {
                soh.push({
                    realestate: h.re.NepID,
                    parent: h.re.parent.NepID,
                    chid: h.prevChange,
                    chid1: h.nextChange
                });
            });
            history.push(soh);
            soh = [];
        });
        fs.writeFileSync('D:\\KNZ\\test\\history_buildings.json', JSON.stringify(history, undefined, 2));
        var history = [];
        var soh = [];
        results.partsofbuildings.forEach(function(r) {
            r.forEach(function(h) {
                soh.push({
                    realestate: h.re.NepID,
                    parent: h.re.parent.NepID,
                    chid: h.prevChange,
                    chid1: h.nextChange
                });
            });
            history.push(soh);
            soh = [];
        });
        fs.writeFileSync('D:\\KNZ\\test\\history_partsofbuildings.json', JSON.stringify(history, undefined, 2));
    })*/
    /*.then(function(completeHistory) {
        var parcelPartsHistory = completeHistory.partsofparcels;
        var buildingsHistory = completeHistory.buildings;
        var folios = [];
        var knzPartsOfParcel = [];
        var knzBuildings = [];
        var numberrf = 1;
        var rlp = 1;
        var rlo = 1;
        var uid = 2000000;
        parcelPartsHistory.forEach(function(parcelPartHistory) {
            parcelPartHistory.forEach(function(part, i, thisArray) {
                var chid = null;
                var chid1 = null;
                var active = 0;
                if(part.prevChange) {
                    chid = part.prevChange.changelistId;
                }
                if(part.nextChange) {
                    chid1 = part.nextChange.changelistId;
                }
                if(i == thisArray.length - 1) {
                    active = 1;
                }
                var folio = {
                    UID: uid++,
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
                    NUMIDXRF: i + 1,
                    ACTIVE: active,
                    TEXT: '',
                    JOURNALNUM: null,
                    RLP: rlp,
                    RLO: null,
                    RLS: null
                };
                folios.push(folio);
                var partKnz = PartsOfParcels.createKnzPartOfParcel(part.re, folio);
                knzPartsOfParcel.push(partKnz);
            });
        });
        buildingsHistory.forEach(function(buildingHistory) {
            buildingHistory.forEach(function(building, i, thisArray) {
                var chid = null;
                var chid1 = null;
                var active = 0;
                if (building.prevChange) {
                    chid = building.prevChange.changelistId;
                }
                if (building.nextChange) {
                    chid1 = building.nextChange.changelistId;
                }
                if (i == thisArray.length - 1) {
                    active = 1;
                }
                var folio = {
                    UID: uid++,
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
                    NUMIDXRF: i + 1,
                    ACTIVE: active,
                    TEXT: '',
                    JOURNALNUM: null,
                    RLP: rlp,
                    RLO: rlo,
                    RLS: null
                };
                folios.push(folio);
                var buildingKnz = Buildings.createKnzBuilding(building.re, folio, knzPartsOfParcel);
                knzBuildings.push(buildingKnz);
            });
        });
        /*console.log(folios);
        console.log(knzPartsOfParcel);
        console.log(knzBuildings);*/

    /*    var replacer = function(key, value) {
            if(key == 'source') {
                return undefined;
            }
            return value;
        };
        fs.writeFileSync('D:\\KNZ\\test\\folios.json', JSON.stringify(folios, undefined, 2));
        fs.writeFileSync('D:\\KNZ\\test\\partsofparcels.json', JSON.stringify(knzPartsOfParcel, replacer, 2));
        fs.writeFileSync('D:\\KNZ\\test\\buildings.json', JSON.stringify(knzBuildings, replacer, 2));
    })*/
    .done(process.exit);

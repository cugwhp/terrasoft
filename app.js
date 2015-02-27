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
    'lica',
    'pravniodnosi'
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

/*var realEstatesToMongo = require('./access2mongo');
realEstatesToMongo();*/


/**
 * Rekonstruisanje istorije promena prema istorijatu predmeta
 */

/*var allEvidentions = [];
Evidentions.loadByTimeOfExecution()
    .then(function(evidentions) {
        allEvidentions = allEvidentions.concat(evidentions);
        return Evidentions.loadByTimeOfSubmission();
    })
    .then(function(evidentions) {
        allEvidentions = allEvidentions.concat(evidentions);
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
var Ownership = require('./app/models/Ownership');
var Utilities = require('./app/models/Utilities');

/**
 * Konstruisanje redosleda promena na nepokretnostima
 */

PartsOfParcels.initCodelists();
Buildings.initCodelists();
PartsOfBuildings.initCodelists();
Restrictions.initCodelists();
Ownership.initCodelists();

var result = [];
Parcels.findDistinct()
    .then(function(parcels) {
        //parcels = [{_id: {BrParc: 158, PodbrParc: 1}}];

        //parcels = [{_id: {BrParc: 5, PodbrParc: 0}}];

        parcels = [{_id: {BrParc: 1627, PodbrParc: 0}}];

        //parcels = [{_id: {BrParc: 15, PodbrParc: 0}}];

        return parcels.reduce(function(promise, parcel) {
            return promise.then(function() {
                var parcelNumber = parcel._id.BrParc;
                var parcelSubNumber = parcel._id.PodbrParc ? parcel._id.PodbrParc : 0;

                /*if(parcelNumber > 200) {  //158/1, 170/1, 171/1, 182/2, 229/1, 240/0, 506/0, 569/1, 608/2, 786/0, 859/3
                    return Q();
                }
                /*if(
                    ((parcelNumber == 158) && (parcelSubNumber == 1)) ||
                    ((parcelNumber == 170) && (parcelSubNumber == 1)) ||
                    ((parcelNumber == 171) && (parcelSubNumber == 1)) ||
                    ((parcelNumber == 182) && (parcelSubNumber == 2)) ||
                    ((parcelNumber == 229) && (parcelSubNumber == 1)) ||
                    ((parcelNumber == 240) && (parcelSubNumber == 0)) ||
                    ((parcelNumber == 506) && (parcelSubNumber == 0)) ||
                    ((parcelNumber == 569) && (parcelSubNumber == 1)) ||
                    ((parcelNumber == 608) && (parcelSubNumber == 2)) ||
                    ((parcelNumber == 786) && (parcelSubNumber == 0))
                ){
                    return Q();
                }*/

                return Parcels.find(parcelNumber, parcelSubNumber, result)
                    .then(function () {

                        console.log(JSON.stringify(result, function(key, value) {
                            if(key === 'parent') {
                                return null;
                            } else {
                                return value;
                            }
                        }, 2));

                        var parcels = result;
                        result = [];
                        var nRsParcel = [];
                        var pFolios = [];
                        var nRsPartOfParcel = [];
                        var bFolios = [];
                        var nRsBuilding = [];
                        var pbFolios = [];
                        var nRsPartOfBuilding = [];
                        if (!parcels) {
                            throw new Error('GREŠKA: Nije pronađena parcela!');
                        } else if (parcels.length == 0) {
                            throw new Error('GREŠKA: Nije pronađena parcela!');
                        }
                        RealEstates.sort(parcels);
                        var nRsP = Parcels.createKnz(parcels[0]);
                        var parcelSuid = nRsP.SUID;
                        nRsParcel.push(nRsP);
                        /*parcels.forEach(function (parcel) {
                            console.log('PARCELA ' + parcel.NepID);
                            Parcels.process(parcel, pFolios, nRsP);


                            var parts = parcel.parts;
                            RealEstates.sort(parts);
                            parts.forEach(function (part) {
                                console.log('DEO PARCELE ' + part.NepID);
                                PartsOfParcels.process(part, pFolios, parcelSuid, nRsPartOfParcel);

                                var buildings = part.buildings;
                                RealEstates.sort(buildings);
                                buildings.forEach(function (building) {
                                    console.log('OBJEKAT ' + building.NepID);
                                    Buildings.process(building, nRsPartOfParcel, bFolios, nRsBuilding);

                                    //console.log(bFolios);

                                    var partsOfBuilding = building.parts;

                                    RealEstates.sort(partsOfBuilding);

                                    partsOfBuilding.forEach(function (partOfBuilding) {
                                        console.log('DEO OBJEKTA ' + partOfBuilding.NepID);
                                        PartsOfBuildings.process(partOfBuilding, nRsBuilding, pbFolios, nRsPartOfBuilding);
                                    });
                                });
                            });
                        });*/
                        parcels.forEach(function (parcel) {
                            Parcels.process(parcel, pFolios, nRsP);
                        });

                        parcels.forEach(function (parcel) {
                            var parts = parcel.parts;
                            RealEstates.sort(parts);
                            parts.forEach(function (part) {
                                PartsOfParcels.process(part, pFolios, parcelSuid, nRsPartOfParcel);
                            });
                        });

                        var directory = 'C:\\node\\knz\\output\\';

                        fs.writeFileSync(directory + 'parcels.sql', Utilities.createInsertStatements('KNZ_VOZD1.N_RS_PARCEL', nRsParcel));
                        fs.writeFileSync(directory + 'parts.sql', Utilities.createInsertStatements('KNZ_VOZD1.N_RS_PARTOFPARCEL', nRsPartOfParcel));
                        parcels.forEach(function (parcel) {
                            var parts = parcel.parts;
                            RealEstates.sort(parts);
                            parts.forEach(function (part) {
                                var buildings = part.buildings;
                                RealEstates.sort(buildings);
                                buildings.forEach(function (building) {
                                    console.log('OBJEKAT ' + building.NepID);
                                    Buildings.process(building, nRsPartOfParcel, bFolios, nRsBuilding);
                                });
                            });
                        });

                        var allFolios = pFolios.concat(bFolios, pbFolios);

                        //fs.appendFileSync(directory + 'folios_' + parcelNumber + '_' + parcelSubNumber + '.sql', Utilities.createInsertStatements('KNZ_VOZD.N_RS_REALESTATEFOLIO', allFolios));
                        //fs.appendFileSync(directory + 'parcels_' + parcelNumber + '_' + parcelSubNumber + '.sql', Utilities.createInsertStatements('KNZ_VOZD.N_RS_PARCEL', nRsParcel));
                        //fs.appendFileSync(directory + 'parts_' + parcelNumber + '_' + parcelSubNumber + '.sql', Utilities.createInsertStatements('KNZ_VOZD.N_RS_PARTOFPARCEL', nRsPartOfParcel));
                        //fs.appendFileSync(directory + 'buildings_' + parcelNumber + '_' + parcelSubNumber + '.sql', Utilities.createInsertStatements('KNZ_VOZD.N_RS_BUILDING', nRsBuilding));
                        //fs.appendFileSync(directory + 'partsbuildings_' + parcelNumber + '_' + parcelSubNumber + '.sql', Utilities.createInsertStatements('KNZ_VOZD.N_RS_PARTOFBUILDING', nRsPartOfBuilding));
                        //fs.appendFileSync(directory + 'n_rs_restrictions_' + parcelNumber + '_' + parcelSubNumber + '.sql', Utilities.createInsertStatements('KNZ_VOZD.N_RS_RESTRICTIONS', Restrictions.nRsRestrictions));
                        //fs.appendFileSync(directory + 'n_rs_ownershipparcel_' + parcelNumber + '_' + parcelSubNumber + '.sql', Utilities.createInsertStatements('KNZ_VOZD.N_RS_OWNERSHIPPARCEL', Ownership.nRsOwnershipParcel));
                        //fs.appendFileSync(directory + 'n_rs_ownershipbuilding_' + parcelNumber + '_' + parcelSubNumber + '.sql', Utilities.createInsertStatements('KNZ_VOZD.N_RS_OWNERSHIPBUILDING', Ownership.nRsOwnershipBuilding));



                        fs.writeFileSync(directory + 'folios.sql', Utilities.createInsertStatements('KNZ_VOZD1.N_RS_REALESTATEFOLIO', allFolios));
                        fs.writeFileSync(directory + 'buildings.sql', Utilities.createInsertStatements('KNZ_VOZD1.N_RS_BUILDING', nRsBuilding));
                        fs.writeFileSync(directory + 'partsbuildings.sql', Utilities.createInsertStatements('KNZ_VOZD1.N_RS_PARTOFBUILDING', nRsPartOfBuilding));
                        fs.writeFileSync(directory + 'n_rs_restrictions.sql', Utilities.createInsertStatements('KNZ_VOZD1.N_RS_RESTRICTIONS', Restrictions.nRsRestrictions));
                        fs.writeFileSync(directory + 'n_rs_ownershipparcel.sql', Utilities.createInsertStatements('KNZ_VOZD1.N_RS_OWNERSHIPPARCEL', Ownership.nRsOwnershipParcel));
                        fs.writeFileSync(directory + 'n_rs_ownershipbuilding.sql', Utilities.createInsertStatements('KNZ_VOZD1.N_RS_OWNERSHIPBUILDING', Ownership.nRsOwnershipBuilding));
                    })
            })
        }, Q([]))
    })
    .done(process.exit);

var Q = require('q');

var app = require('../../app');

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
            this.data = data.records;
            mongo.deloviobjekata.insert(this.data)
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
            parts.forEach(function(part) {
                part.parent = building;
            });
        })
    return retPromise;
};


PartsOfBuildings.suid = 0;

PartsOfBuildings.createKnz = function(partOfBuilding, folio, knzBuildings) {
    var knzBuilding = null;
    knzBuildings.forEach(function (knzB) {
        var found = false;
        if (partOfBuilding.parent.NepID == knzB.source.NepID) {
            if (knzB.CHANGELISTID < folio.CHANGELISTID1) {
                knzBuilding = knzB;
                found = true;
            }
        }
        return !found;
    });
    var knzPoB = {
        SUID: PartsOfBuildings.suid++,
        UID: folio.UID,
        BUILDINGID: knzBuilding.SUID,
        ADDRESSID: null,
        DIMENSION: null,
        WAYUSEID: null, //SELECT ID FROM N_CL_WAYOFUSE WHERE SIGN = partOfBuilding.KoriscenjeOD
        VOLUMEVALUE: null,
        FLOORID: partOfBuilding.BrojSprata,//SELECT ID FROM N_CL_ROOM WHERE SIGN = partOfBuilding.BrojSprata (videti kod Dude)
        ROOMID: partOfBuilding.BrojSoba,//SELECT ID FROM N_CL_ROOM WHERE NAME = partOfBuilding.BrojSoba (videti kod Dude)
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
        PARCELID: knzBuilding.PARCELID,
        NUMBER: knzBuilding.NUMBER,
        NUMBERIDX: knzBuilding.NUMIDX,
        PARTPARCID: knzBuilding.PARTPARCELID,
        SEQUENCE: knzBuilding.SEQUENCE,
        CHANGELISTID1: folio.CHANGELISTID1,
        CHANGELISTID: folio.CHANGELISTID,
        BASISID: null,
        SIGNPB: partOfBuilding.BrStana,
        USEFULAREA: partOfBuilding.PovDO,
        USEFULAREAID: partOfBuilding.NacUtvPov,//SELECT ID FROM N_CL_USEFULAREA WHERE SIGN = partOfBuilding.NacUtvPov
        ENTNO: null,
        SPECPURPOSE: null
    };
    return knzPoB;
};

module.exports = PartsOfBuildings;



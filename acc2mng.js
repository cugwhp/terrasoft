var RealEstates = require('./app/models/RealEstates');
var Parcels = require('./app/models/Parcels');
var PartsOfParcels = require('./app/models/PartsOfParcels');
var Buildings = require('./app/models/Buildings');
var PartsOfBuildings = require('./app/models/PartsOfBuildings');

function realEstatesToMongo() {
    RealEstates.clear()
        .then(function() {
            RealEstates.toMongo();
            RealEstates.relationsToMongo();

        })
        .catch(console.log)
        .done();

    Parcels.clear()
        .then(Parcels.toMongo)
        .catch(console.log)
        .done();

    PartsOfParcels.clear()
        .then(PartsOfParcels.toMongo)
        .catch(console.log)
        .done();

    Buildings.clear()
        .then(Buildings.toMongo)
        .catch(console.log)
        .done();

    PartsOfBuildings.clear()
        .then(PartsOfBuildings.toMongo)
        .catch(console.log)
        .done();
}

module.exports = realEstatesToMongo;

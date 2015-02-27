var RealEstates = require('./app/models/RealEstates');
var Parcels = require('./app/models/Parcels');
var PartsOfParcels = require('./app/models/PartsOfParcels');
var Buildings = require('./app/models/Buildings');
var PartsOfBuildings = require('./app/models/PartsOfBuildings');
var Restrictions = require('./app/models/Restrictions');
var Owners = require('./app/models/Owners');
var Ownership = require('./app/models/Ownership');

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

    Restrictions.clear()
        .then(Restrictions.toMongo())
        .catch(console.log)
        .done();

    Owners.clear()
        .then(Owners.toMongo())
        .catch(console.log)
        .done();

    Ownership.clear()
        .then(Ownership.toMongo())
        .catch(console.log)
        .done();
}

module.exports = realEstatesToMongo;

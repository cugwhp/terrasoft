var Ownership = require('./../app/models/Ownership');

Ownership.clear()
    .then(Ownership.toMongo())
    .catch(function(err) {
        console.log(err);
    })
    .done();

/*app.db.lica.find({})
    .limit(10)
    .toArray()
    .then(function(data) {
        console.log('Success');
        console.log(JSON.stringify(data, undefined, 2));
    })
    .catch(function(err) {
        console.log(err);
    })
    .done(process.exit());*/





var Owners = require('./../app/models/Owners');

Owners.clear()
    .then(Owners.toMongo())
    .catch(function(err) {
        console.log(err);
    })
    .done(process.exit);

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





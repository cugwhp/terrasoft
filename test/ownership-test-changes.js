var app = require('./../app');

app.db.pravniodnosi.find({})
    .toArray()
    .then(function(data) {
        console.log(JSON.stringify(data, undefined, 2));
    })
    .catch(function(err) {
        console.log(err);
    })
    .done();


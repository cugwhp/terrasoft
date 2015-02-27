var Parcels = require('./app/models/Parcels');
var app = require('./app');

var result =[];
Parcels.find(2, 0, result)
    .then(function() {
        console.log(JSON.stringify(result, function(key, value) {
             if(key === 'parent') {
                return null;
             } else {
                return value;
             }
         }, 2));

    })
    .done();

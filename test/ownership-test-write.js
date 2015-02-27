var Owners = require('./../app/models/Owners');
var Utilities = require('./../app/models/Utilities');
var fs = require('fs');

Owners.process()
    .then(function(rsOwner) {
        fs.writeFileSync('C:\\node\\knz\\rs_owner.sql', Utilities.createInsertStatements('KNZ_VOZD.RS_OWNER', 'PARTYID', rsOwner));
    })
    .catch(console.log)
    .done(process.exit);

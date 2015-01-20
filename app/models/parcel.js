var app = require('../../app')
var cm = require('./cm')
var relations = require('./odnosinepokretnosti')
var partofparcel = require('./partofparcel')
var changes = require('./elementarnepromene')
var Q = require('q');

var suid = 0;

module.exports = {
    toMongo: function() {
        'use strict;'

        var parcele = [];

        var fs = require('fs');
        fs.readFile(__dirname + '/../../csv/PARCELA.txt',{encoding: 'utf8'}, function(err, data) {
            if(err) {
                console.log('GREŠKA: PARCELА.txt nije konvertovan uspešno!')
            } else {
                var rows = data.split('\n');
                rows.forEach(function(row, i) {
                    var fields = row.split(',');
                    if(fields.length > 1) {
                        var obj = {
                            BrParc      : parseInt(fields[0]),
                            PodbrParc   : parseInt(fields[1]),
                            MatBrSK     : parseInt(fields[2]),
                            VrZem       : parseInt(fields[4]),
                            MatBrNas    : parseInt(fields[5]),
                            MatBrUli    : parseInt(fields[6]),
                            NepID       : parseInt(fields[7]),
                            BrPlana     : parseInt(fields[8]),
                            BrSkice     : parseInt(fields[9]),
                            BrManuala   : parseInt(fields[10]),
                            GodSkMan    : parseInt(fields[11]),
                            Povrsina    : parseInt(fields[12]),
                            BrojLN      : parseInt(fields[13]),
                            Fakticko    : parseInt(fields[17])
                        }
                        parcele.push(obj);
                    }
                })
                var db = app.db;
                db.parcele.insert(parcele, function(err, docs) {
                    if(err) {
                        console.log(err)
                    }
                })
            }
        })
    },

/*    findParts: function(cmNum, parcelNum, parcelSubNum) {
        'use strict;'

        var db = app.db;

        var parceleNove = [];

        db.parcele.find({BrParc: parcelNum, PodbrParc: parcelSubNum}, function(err, parcele) {
            if(err) {
                console.log(err)
            } else {
                parcele.forEach(function(parcela) {
                    parceleNove.push(parcela)
                    db.odnosinep.find({NepIDNadr: parcela.NepID, VrstaOdnosa: 1}, function(err, odnosiNep) {
                        if(err) {
                            console.log(err)
                        } else {
                            var nepIds = [];
                            odnosiNep.forEach(function(odnosNep) {
                                nepIds.push(odnosNep.NepIDPodr)
                            })
                            db.deloviparcela.find({NepID: { $in: nepIds}}, function(err, delovi){
                                if(err) {
                                    console.log(err)
                                } else {
                                    parcela.delovi = delovi;
                                    db.elpromene.find({Tabela: 1, TabelaID: parcela.NepID}, function(err, promene) {
                                        if(err) {
                                            console.log(err)
                                        } else {
                                            parcela.promene = promene;
                                            db.tereti.find({NepID: parcela.NepID}, function(err, tereti) {
                                                if(err) {
                                                    console.log(err)
                                                } else {
                                                    parcela.tereti = tereti
                                                    console.log(parcela)
                                                }
                                            })
                                        }
                                    })
                                }
                            })

                        }
                    })

                })
            }
        });
    },*/

    find: function(parcelNum, parcelSubNum) {
        var condition = {};
        condition.BrParc = parcelNum;
        if(parcelSubNum) {
            condition.PodbrParc = parcelSubNum;
        }
        return app.db.parcele.find(condition).toArray();
    },

    findParts: function(parcel) {
        return partofparcel.find(parcel)
    },

    findChanges: function(parcel) {
        return changes.find(1, parcel.NepID)
    },

    createKnzParcel: function(p) {
        var orclP = {
            SUID: suid++,
            NUMBER: p.BrParc,
            NUMIDX: p.PodbrParc,
            ADDRESSID: null,
            DIMENSIONID: null,
            VOLUMEVALUEID: null,
            COUNTRYID: cm.countryId,
            CADDISTID: cm.cadDistId,
            CADMUNID: cm.cadMunId,
            LABEL: null,
            AREA: p.Povrsina,
            BEGINLIFESPANVERSION: null,
            ENDLIFESPANVERSION: null
        }
        return orclP
    }


}
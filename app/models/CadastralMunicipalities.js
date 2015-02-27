var config = require('./OracleConfig.js');

function CadastralMunicipalities() {}

//NRSCADASTRALMUNICIPALITY_SEQ

CadastralMunicipalities.SUSID = 0;

CadastralMunicipalities.SIGN = 20000;

CadastralMunicipalities.COUNTRYID = 1;

CadastralMunicipalities.ADMINMUNID = 270;

CadastralMunicipalities.CADDISTID = 46;

CadastralMunicipalities.LABEL = 723070;

CadastralMunicipalities.NAME = 'LAZAREVAC';

CadastralMunicipalities.insert = function() {
    var statment = 'INSERT INTO ' + config.DB_USER + '.N_RS_CADASTRALMUNICIPALITY (COUNTRYID, CADDISTID, SUSID, ADMINMUNID, LABEL, ' +
        'NAME, SIGN, ACTIVE) VALUES (:countryid, :caddisid, NRSCADASTRALMUNICIPALITY_SEQ.NEXTVAL, :adminmunid, :label, :name, :sign, :active)';
    var values = {
        countryid: CadastralMunicipalities.COUNTRYID,
        caddistid: CadastralMunicipalities.CADDISTID,
        adminmunid: CadastralMunicipalities.ADMINMUNID,
        label: CadastralMunicipalities.LABEL,
        name: CadastralMunicipalities.NAME,
        sign: CadastralMunicipalities.SIGN,
        active: '1'
    };



};

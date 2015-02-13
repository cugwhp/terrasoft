function MotionStatus() {};


/**
 * Kreiranje inserta za šifarnik MotionStatus u N_CL_CHANGETYPE. Već postoje unosi koji se donekle poklapaju.
 * REŠENJE: Unos novih redova gde će SIGN biti jednak 100 + StatusPredmeta.
 *
 * StatusPredmeta	NazivStatusaPredmeta
 * 1	U RADU
 * 2	OD[TAMPANO RE[EWE
 * 3	DOSTAVQENO RE[EWE
 * 4	ULO@ENA @ALBA
 * 5	PONI[TENO RE[EWE
 * 6	PROVEDENO
 * 7	POTPISANO RE[EWE
 *
 * @param tablename
 * @param data
 */
MotionStatus.createInsertStatements = function(tablename) {
    var result = 'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (101, 101, \'U RADU\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (102, 102, \'ODŠTAMPANO REŠENJE\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (103, 103, \'DOSTAVLJENO REŠENJE\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (104, 104, \'ULOŽENA ŽALBA\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (105, 105, \'PONIŠTENO REŠENJE\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (106, 106, \'PROVEDENO\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (107, 107, \'POTPISANO REŠENJE\');\n';
    return result;
};

function ChangeTypes() {};

/**
 *
 * @param tablename
 */
ChangeTypes.createInsertStatements = function(tablename) {
    var result = 'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (1, 1, \'DEOBA PARCELE\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (2, 2, \'SPAJANJE I DEOBA VIŠE PARCELA\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (3, 3, \'PROMENA STRUKTURE JEDNE PARCELE\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (4, 4, \'PROMENA KULTURE DELA PARCELE\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (5, 5, \'PROMENA OSOBINA PARCELE\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (6, 6, \'PROMENA PRAVNIH ODNOSA PARCELE\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (7, 7, \'PROMENA TERETA PARCELE\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (8, 8, \'IZGRADNJA OBJEKTA\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (9, 9, \'RUŠENJE OBJEKTA\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (10, 10, \'DOGRADNJA OBJEKTA\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (11, 11, \'DELIMIČNO RUŠENJE OBJEKTA\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (12, 12, \'PROMENA OSOBINA OBJEKTA\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (13, 13, \'PROMENA PRAVNIH ODNOSA OBJEKTA\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (14, 14, \'PROMENA TERETA OBJEKTA\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (15, 15, \'IZGRADNJA DELA OBJEKTA\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (16, 16, \'RUŠENJE DELA OBJEKTA\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (17, 17, \'PROMENA OSOBINA DELA OBJEKTA\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (18, 18, \'PROMENA PRAVNIH ODNOSA DELA OBJEKTA\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (19, 19, \'PROMENA TERETA DELA OBJEKTA\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (20, 20, \'PROMENA TERETA NA LICU\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (21, 21, \'OSTALO\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (22, 22, \'UPIS JAVNE SVOJINE\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (23, 23, \'PRENOS PRAVA KORIŠĆENJA U PRAVO SVOJINE\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (24, 24, \'FORMIRANJE GRAĐEVINSKE PARCELE\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (25, 25, \'IZMENA HIPOTEKE NA PARCELI\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (26, 26, \'IZMENA HIPOTEKE NA OBJEKTU\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (27, 27, \'IZMENA HIPOTEKE NA DELU OBJEKTA\');\n' +
        'INSERT INTO ' + tablename + ' (ID, SIGN, NAME) VALUES (28, 28, \'ZAKON O POSEBNIM USLOVIMA ZA UPIS PRAVA SVOJINE\');\n';
    return result;
}

module.exports = ChangeTypes;
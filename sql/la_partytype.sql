SET PAGESIZE 0

SET LINESIZE 10000

WITH lapartytype AS 
(
SELECT '{' ||
		'"ID" : ' || "ID" || ', ' || '"NAME" : "' || "NAME" || '", ' || '"SIGN" : "' || "SIGN"  || '"}' json
	FROM KNZ_VOZD.LA_PARTYTYPE
)
SELECT '[' ||
	(SELECT listagg(json, ',') WITHIN group (order by 1) FROM lapartytype) ||
	']'
FROM DUAL;

QUIT;
/
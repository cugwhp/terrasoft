SET PAGESIZE 0

SET LINESIZE 10000

WITH larestrictiontype AS 
(
SELECT '{' ||
		'"ID" : ' || "ID" || ', ' || '"NAME" : "' || "NAME" || '", ' || '"SIGN" : "' || "SIGN"  || '"}' json
	FROM KNZ_VOZD.LA_RESTRICTIONTYPE
)
SELECT '[' ||
	(SELECT listagg(json, ',') WITHIN group (order by 1) FROM larestrictiontype) ||
	']'
FROM DUAL;

QUIT;
/
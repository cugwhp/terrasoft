SET PAGESIZE 0

SET LINESIZE 10000

WITH larighttype AS 
(
SELECT '{' ||
		'"ID" : ' || "ID" || ', ' || '"NAME" : "' || "NAME" || '", ' || '"SIGN" : "' || "SIGN"  || '"}' json
	FROM KNZ_VOZD.LA_RIGHTTYPE
)
SELECT '[' ||
	(SELECT listagg(json, ',') WITHIN group (order by 1) FROM larighttype) ||
	']'
FROM DUAL;

QUIT;
/
SET PAGESIZE 0

SET LINESIZE 10000

WITH nclfloor AS 
(
SELECT '{' ||
		'"ID" : ' || "ID" || ', ' || '"NAME" : "' || "NAME" || '", ' || '"SIGN" : "' || "SIGN"  || '"}' json
	FROM KNZ_VOZD.N_CL_FLOOR
)
SELECT '[' ||
	(SELECT listagg(json, ',') WITHIN group (order by 1) FROM nclfloor) ||
	']'
FROM DUAL;

QUIT;
/
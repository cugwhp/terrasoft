SET PAGESIZE 0

SET LINESIZE 10000

WITH nclrightshare AS 
(
SELECT '{' ||
		'"ID" : ' || "ID" || ', ' || '"NAME" : "' || "NAME" || '", ' || '"SIGN" : "' || "SIGN"  || '"}' json
	FROM KNZ_VOZD.N_CL_RIGHTSHARE
)
SELECT '[' ||
	(SELECT listagg(json, ',') WITHIN group (order by 1) FROM nclrightshare) ||
	']'
FROM DUAL;

QUIT;
/
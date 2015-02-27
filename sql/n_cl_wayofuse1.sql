SET PAGESIZE 0

SET LINESIZE 10000


SELECT '{' ||
		'"ID" : ' || "ID" || ', ' || '"NAME" : "' || "NAME" || '", ' || '"SIGN" : "' || "SIGN" || '", "TYPE" : "' || "TYPE"  || '"},' json
	FROM KNZ_VOZD.N_CL_WAYOFUSE;

QUIT;
/
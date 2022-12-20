#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include "conn.h"

MQLONG mqconnect_x(char QMName[MQ_Q_MGR_NAME_LENGTH], char * const argv[], const int argc, MQCNO * cno, MQHCONN* Hcon){
	MQLONG   CompCode;               /* completion code  */
	MQLONG   CReason;                /* reason code for MQCONNX */

	/* Connect to queue manager */
	QMName[0] = 0;
	if (argc > 2)
		strncpy(QMName, argv[2], MQ_Q_MGR_NAME_LENGTH);

	/*   Connect to queue manager */
	MQCONNX(QMName,                 /* queue manager */
				 cno,	                   /* connection options */
				 Hcon,                   /* connection handle */
				 &CompCode,               /* completion code */
				 &CReason);               /* reason code */

	/* report reason and stop if it failed */
	if (CompCode == MQCC_FAILED)
	{
		printf("MQCONNX ended with reason code %d\n", CReason);
		exit( (int)CReason );
	}

	/* if there was a warning report the cause and continue */
	if (CompCode == MQCC_WARNING)
	{
		printf("MQCONNX generated a warning with reason code %d\n", CReason);
		printf("Continuing...\n");
	}

	return CReason;
}

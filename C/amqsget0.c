/* @(#) MQMBID sn=p931-L220929.1 su=_rc_f-UABEe28rbfryugV4g pn=samples/c/amqsget0.c */
 /********************************************************************/
 /*                                                                   */
 /* Program name: AMQSGET0                                            */
 /*                                                                   */
 /* Description: Sample C program that gets messages from             */
 /*              a message queue (example using MQGET)                */
 /*   <copyright                                                      */
 /*   notice="lm-source-program"                                      */
 /*   pids="5724-H72"                                                 */
 /*   years="1994,2019"                                               */
 /*   crc="4225925856" >                                              */
 /*   Licensed Materials - Property of IBM                            */
 /*                                                                   */
 /*   5724-H72                                                        */
 /*                                                                   */
 /*   (C) Copyright IBM Corp. 1994, 2019 All Rights Reserved.         */
 /*                                                                   */
 /*   US Government Users Restricted Rights - Use, duplication or     */
 /*   disclosure restricted by GSA ADP Schedule Contract with         */
 /*   IBM Corp.                                                       */
 /*   </copyright>                                                    */
 /********************************************************************/
 
 #include <stdio.h>
 #include <stdlib.h>
 #include <string.h>
/* includes for MQI */
 #include <cmqc.h>
#include "get_pass.h"
	#include "conn.h"

 int main(int argc, char * const * argv)
 {

   /* Declare MQI structures needed */
   MQOD     od = {MQOD_DEFAULT};    /* Object Descriptor  */
   MQMD     md = {MQMD_DEFAULT};    /* Message Descriptor */
   MQGMO   gmo = {MQGMO_DEFAULT};   /* get message options */
   MQCNO   cno = {MQCNO_DEFAULT};   /* connection options */
   MQCSP   csp = {MQCSP_DEFAULT};   /* security parameters */
  /** note, sample uses defaults where it can **/

   MQHCONN  Hcon;                   /* connection handle  */
   MQHOBJ   Hobj;                   /* object handle */
   MQLONG   O_options;              /* MQOPEN options */
   MQLONG   C_options;              /* MQCLOSE options */
   MQLONG   CompCode;               /* completion code */
   MQLONG   OpenCode;               /* MQOPEN completion code */
   MQLONG   Reason;                 /* reason code */
   MQLONG   CReason;                /* reason code for MQCONNX */
   MQBYTE   buffer[65536];          /* message buffer */
   MQLONG   buflen;                 /* buffer length */
   MQLONG   messlen;                /* message length received */
   char     QMName[MQ_Q_MGR_NAME_LENGTH];             /* queue manager name */

   printf("Sample AMQSGET0 start\n");
   if (argc < 2)
   {
     printf("Required parameter missing - queue name\n");
     exit(99);
   }

   /* Create object descriptor for subject queue */
   strncpy(od.ObjectName, argv[1], MQ_Q_NAME_LENGTH);

   /* Setup any authentication information supplied in the local environment. */
   setup_mqsamp_user_id(&cno, &csp);

   CReason = mqconnect_x(QMName, argv, argc, &cno, &Hcon);

   /*  Open the named message queue for input; exclusive or shared use of the queue is controlled by the queue definition here  */

   if (argc > 3)
   {
     O_options = atoi( argv[3] );
     printf("open  options are %d\n", O_options);
   }
   else
   {
     O_options = MQOO_INPUT_AS_Q_DEF    /* open queue for input      */
               | MQOO_FAIL_IF_QUIESCING /* but not if MQM stopping   */
               ;                        /* = 0x2001 = 8193 decimal   */
   }

   MQOPEN(Hcon,                      /* connection handle */
          &od,                       /* object descriptor for queue  */
          O_options,                 /* open options      */
          &Hobj,                     /* object handle     */
          &OpenCode,                 /* completion code   */
          &Reason);                  /* reason code       */

   /* report reason, if any; stop if failed */
   if (Reason != MQRC_NONE)
   {
     printf("MQOPEN ended with reason code %d\n", Reason);
   }

   if (OpenCode == MQCC_FAILED)
   {
     printf("unable to open queue for input\n");
   }

   CompCode = OpenCode;       /* use MQOPEN result for initial test  */

                                      /* every MQGET      */
   gmo.Options = MQGMO_WAIT           /* wait for new messages       */
               | MQGMO_NO_SYNCPOINT   /* no transaction   */
               | MQGMO_CONVERT;       /* convert if necessary        */
   gmo.WaitInterval = 15000;          /* 15 second limit for waiting */

   while (CompCode != MQCC_FAILED)
   {
     buflen = sizeof(buffer) - 1; /* buffer size available for GET  */
     memcpy(md.MsgId, MQMI_NONE, sizeof(md.MsgId));
     memcpy(md.CorrelId, MQCI_NONE, sizeof(md.CorrelId));

     md.Encoding       = MQENC_NATIVE;
     md.CodedCharSetId = MQCCSI_Q_MGR;

     MQGET(Hcon,                /* connection handle */
           Hobj,                /* object handle */
           &md,                 /* message descriptor */
           &gmo,                /* get message options */
           buflen,              /* buffer length */
           buffer,              /* message buffer */
           &messlen,            /* message length */
           &CompCode,           /* completion code */
           &Reason);            /* reason code */

     /* report reason, if any     */
     if (Reason != MQRC_NONE)
     {
       if (Reason == MQRC_NO_MSG_AVAILABLE)
       {                         /* special report for normal end */
         printf("no more messages\n");
       }
       else                      /* general report for other reasons */
       {
         printf("MQGET ended with reason code %d\n", Reason);

         /* treat truncated message as a failure for this sample */
         if (Reason == MQRC_TRUNCATED_MSG_FAILED)
         {
           CompCode = MQCC_FAILED;
         }
       }
     }

     /* Display each message received */
     if (CompCode != MQCC_FAILED)
     {
       buffer[messlen] = '\0'; /* add terminator */
       printf("message <%s>\n", buffer);
     }
   }

   /* Close the source queue (if it was opened) */
   if (OpenCode != MQCC_FAILED)
   {
     if (argc > 4)
     {
       C_options = atoi( argv[4] );
       printf("close options are %d\n", C_options);
     }
     else
     {
       C_options = MQCO_NONE;         /* no close options */
     }

     MQCLOSE(Hcon,                    /* connection handle */
             &Hobj,                   /* object handle */
             C_options,
             &CompCode,               /* completion code */
             &Reason);                /* reason code */

     /* report reason, if any */
     if (Reason != MQRC_NONE)
     {
       printf("MQCLOSE ended with reason code %d\n", Reason);
     }
   }


   /* Disconnect from MQM if not already connected */
   if (CReason != MQRC_ALREADY_CONNECTED )
   {
     MQDISC(&Hcon,                     /* connection handle */
            &CompCode,                 /* completion code */
            &Reason);                  /* reason code */

     /* report reason, if any */
     if (Reason != MQRC_NONE)
     {
       printf("MQDISC ended with reason code %d\n", Reason);
     }
   }

   /* END OF AMQSGET0 */
   printf("Sample AMQSGET0 end\n");
   return(0);
 }

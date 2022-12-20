 /* @(#) MQMBID sn=p931-L220929.1 su=_rc_f-UABEe28rbfryugV4g pn=samples/c/amqspuba.c */
 /********************************************************************/
 /*                                                                  */
 /* Program name: AMQSPUBA                                           */
 /*                                                                  */
 /* Description: Sample C program that publishes messages to         */
 /*              a topic (example using MQPUT)                       */
 /*   <copyright                                                     */
 /*   notice="lm-source-program"                                     */
 /*   pids="5724-H72"                                                */
 /*   years="1994,2019"                                              */
 /*   crc="1775946524" >                                             */
 /*   Licensed Materials - Property of IBM                           */
 /*                                                                  */
 /*   5724-H72                                                       */
 /*                                                                  */
 /*   (C) Copyright IBM Corp. 1994, 2019 All Rights Reserved.        */
 /*                                                                  */
 /*   US Government Users Restricted Rights - Use, duplication or    */
 /*   disclosure restricted by GSA ADP Schedule Contract with        */
 /*   IBM Corp.                                                      */
 /*   </copyright>                                                   */
 /********************************************************************/
 
 #include <stdio.h>
 #include <stdlib.h>
 #include <string.h>
    /* includes for MQI */
 #include <cmqc.h>
#include "get_pass.h"
#include "conn.h"

 int main(int argc, char * const *argv)
 {
   /*  Declare file and character for sample input */
   FILE *fp;

   /*   Declare MQI structures needed */
   MQOD     od = {MQOD_DEFAULT};    /* Object Descriptor */
   MQMD     md = {MQMD_DEFAULT};    /* Message Descriptor */
   MQPMO   pmo = {MQPMO_DEFAULT};   /* put message options */
   MQCNO   cno = {MQCNO_DEFAULT};   /* connection options */
   MQCSP   csp = {MQCSP_DEFAULT};   /* security parameters */
      /** note, sample uses defaults where it can **/

   MQHCONN  Hcon;                   /* connection handle */
   MQHOBJ   Hobj;                   /* object handle */
   MQLONG   CompCode;               /* completion code */
   MQLONG   OpenCode;               /* MQOPEN completion code */
   MQLONG   Reason;                 /* reason code */
   MQLONG   CReason;                /* reason code for MQCONNX */
   MQLONG   messlen;                /* message length */
   char     buffer[100];            /* message buffer */
   char     QMName[MQ_Q_MGR_NAME_LENGTH];             /* queue manager name */

   printf("Sample AMQSPUBA start\n");
   if (argc < 2)
   {
     printf("Required parameter missing - topic string\n");
     exit(99);
   }

	 if (argc > 3)
   {
     pmo.Options = atoi( argv[3] );
     printf("publish options are %d\n", pmo.Options);
   }
   else
   {
     pmo.Options = MQPMO_FAIL_IF_QUIESCING
                 | MQPMO_NO_SYNCPOINT;
   }

	 /* Setup any authentication information supplied in the local environment. */
	 setup_mqsamp_user_id(&cno, &csp);

	 CReason = mqconnect_x(QMName, argv, argc, &cno, &Hcon);

   /* Use parameter as the name of the target topic */
   od.ObjectString.VSPtr=argv[1];
   od.ObjectString.VSLength=(MQLONG)strlen(argv[1]);
   printf("target topic is %s\n", (char*)od.ObjectString.VSPtr);

   /* Open the target topic for output */
   od.ObjectType = MQOT_TOPIC;
   od.Version = MQOD_VERSION_4;

   MQOPEN(Hcon,                      /* connection handle */
          &od,                       /* object descriptor for topic  */
          MQOO_OUTPUT | MQOO_FAIL_IF_QUIESCING, /* open options  */
          &Hobj,                     /* object handle */
          &OpenCode,                 /* MQOPEN completion code */
          &Reason);                  /* reason code  */

   /* report reason, if any; stop if failed */
   if (Reason != MQRC_NONE)
   {
     printf("MQOPEN ended with reason code %d\n", Reason);
   }

   if (OpenCode == MQCC_FAILED)
   {
     printf("unable to open topic for publish\n");
   }

   /* Read lines from the file and publish them on the topic. */
   CompCode = OpenCode;        /* use MQOPEN result for initial test */
   fp = stdin;

   memcpy(md.Format,           /* character string format */
          MQFMT_STRING, (size_t)MQ_FORMAT_LENGTH);

   while (CompCode != MQCC_FAILED)
   {
     if (fgets(buffer, sizeof(buffer), fp) != NULL)
     {
       messlen = (MQLONG)strlen(buffer); /* length without null */
       if (buffer[messlen-1] == '\n')  /* last char is a new-line */
       {
         buffer[messlen-1]  = '\0';    /* replace new-line with null */
         --messlen;                    /* reduce buffer length */
       }
     }
     else messlen = 0;        /* treat EOF same as null line */

     /*   Publish each buffer to the topic */
     if (messlen > 0)
     {
       MQPUT(Hcon,                /* connection handle */
             Hobj,                /* object handle */
             &md,                 /* message descriptor */
             &pmo,                /* default options (datagram) */
             messlen,             /* message length */
             buffer,              /* message buffer */
             &CompCode,           /* completion code */
             &Reason);            /* reason code */

       /* report reason, if any */
       if (Reason != MQRC_NONE)
       {
         printf("MQPUT ended with reason code %d\n", Reason);
       }
     }
     else   /* satisfy end condition when empty line is read */
       CompCode = MQCC_FAILED;
   }

   /* Close the target topic (if it was opened) */
   if (OpenCode != MQCC_FAILED)
   {
     MQCLOSE(Hcon,                   /* connection handle */
             &Hobj,                  /* object handle */
             MQCO_NONE,
             &CompCode,              /* completion code */
             &Reason);               /* reason code */

     /* report reason, if any     */
     if (Reason != MQRC_NONE)
     {
       printf("MQCLOSE ended with reason code %d\n", Reason);
     }
   }

   /* Disconnect from MQM if not already connected */
   if (CReason != MQRC_ALREADY_CONNECTED)
   {
     MQDISC(&Hcon,                   /* connection handle */
            &CompCode,               /* completion code */
            &Reason);                /* reason code */

     /* report reason, if any */
     if (Reason != MQRC_NONE)
     {
       printf("MQDISC ended with reason code %d\n", Reason);
     }
   }

   /* END OF AMQSPUBA */
   printf("Sample AMQSPUBA end\n");
   return(0);
 }

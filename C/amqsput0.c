/* @(#) MQMBID sn=p931-L220929.1 su=_rc_f-UABEe28rbfryugV4g pn=samples/c/amqsput0.c */
 /********************************************************************/
 /*                                                                   */
 /* Program name: AMQSPUT0                                            */
 /*                                                                   */
 /* Description: Sample C program that puts messages to               */
 /*              a message queue (example using MQPUT)                */
 /*   <copyright                                                      */
 /*   notice="lm-source-program"                                      */
 /*   pids="5724-H72"                                                 */
 /*   years="1994,2019"                                               */
 /*   crc="2248028677" >                                              */
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

 int main(int argc, char * const *argv)
 {
   /*  Declare file and character for sample input */
   FILE *fp;

   /*   Declare MQI structures needed  */
   MQOD     od = {MQOD_DEFAULT};    /* Object Descriptor  */
   MQMD     md = {MQMD_DEFAULT};    /* Message Descriptor */
   MQPMO   pmo = {MQPMO_DEFAULT};   /* put message options  */
   MQCNO   cno = {MQCNO_DEFAULT};   /* connection options */
   MQCSP   csp = {MQCSP_DEFAULT};   /* security parameters */
      /** note, sample uses defaults where it can **/

   MQHCONN  Hcon;                   /* connection handle */
   MQHOBJ   Hobj;                   /* object handle */
   MQLONG   O_options;              /* MQOPEN options */
   MQLONG   C_options;              /* MQCLOSE options */
   MQLONG   CompCode;               /* completion code */
   MQLONG   OpenCode;               /* MQOPEN completion code */
   MQLONG   Reason;                 /* reason code */
   MQLONG   CReason;                /* reason code for MQCONNX */
   MQLONG   messlen;                /* message length */
   char     buffer[65535];          /* message buffer */
   char     QMName[MQ_Q_MGR_NAME_LENGTH];             /* queue manager name */

   printf("Sample AMQSPUT0 start\n");
   if (argc < 2)
   {
     printf("Required parameter missing - queue name\n");
     exit(99);
   }

   /* Setup any authentication information supplied in the local environment. */
   setup_mqsamp_user_id(&cno, &csp);

   CReason = mqconnect_x(QMName, argv, argc, &cno, &Hcon);

   /* Use parameter as the name of the target queue  */
   /******************************************************************/
   strncpy(od.ObjectName, argv[1], (size_t)MQ_Q_NAME_LENGTH);
   printf("target queue is %s\n", od.ObjectName);

   if (argc > 5)
   {
     strncpy(od.ObjectQMgrName, argv[5], (size_t) MQ_Q_MGR_NAME_LENGTH);
     printf("target queue manager is %s\n", od.ObjectQMgrName);
   }

   if (argc > 6)
   {
     strncpy(od.DynamicQName, argv[6], (size_t) MQ_Q_NAME_LENGTH);
     printf("dynamic queue name is %s\n", od.DynamicQName);
   }


   /* Open the target message queue for output */

   if (argc > 3)
   {
     O_options = atoi( argv[3] );
     printf("open  options are %d\n", O_options);
   }
   else
   {
     O_options = MQOO_OUTPUT            /* open queue for output */
               | MQOO_FAIL_IF_QUIESCING /* but not if MQM stopping */
               ;                        /* = 0x2010 = 8208 decimal  */
   }

   MQOPEN(Hcon,                      /* connection handle */
          &od,                       /* object descriptor for queue */
          O_options,                 /* open options */
          &Hobj,                     /* object handle */
          &OpenCode,                 /* MQOPEN completion code */
          &Reason);                  /* reason code */

   /* report reason, if any; stop if failed */
   if (Reason != MQRC_NONE)
   {
     printf("MQOPEN ended with reason code %d\n", Reason);
   }

   if (OpenCode == MQCC_FAILED)
   {
     printf("unable to open queue for output\n");
   }


   /*   Read lines from the file and put them to the message queue */
   /*   Loop until null line or end of file, or there is a failure */
   CompCode = OpenCode;        /* use MQOPEN result for initial test */
   fp = stdin;

   memcpy(md.Format,           /* character string format */
          MQFMT_STRING, (size_t)MQ_FORMAT_LENGTH);

   pmo.Options = MQPMO_NO_SYNCPOINT
               | MQPMO_FAIL_IF_QUIESCING;

   /* pmo.Options |= MQPMO_NEW_MSG_ID; */
   /* pmo.Options |= MQPMO_NEW_CORREL_ID; */

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

     /*   Put each buffer to the message queue */
     if (messlen > 0)
     {
       /* The following statement is not required if the MQPMO_NEW_MSG_ID option is used. */
       memcpy(md.MsgId,           /* reset MsgId to get a new one */
              MQMI_NONE, sizeof(md.MsgId) );

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


   /*  Close the target queue (if it was opened) */
   if (OpenCode != MQCC_FAILED)
   {
     if (argc > 4)
     {
       C_options = atoi( argv[4] );
       printf("close options are %d\n", C_options);
     }
     else
     {
       C_options = MQCO_NONE;        /* no close options  */
     }

     MQCLOSE(Hcon,                   /* connection handle */
             &Hobj,                  /* object handle */
             C_options,
             &CompCode,              /* completion code  */
             &Reason);               /* reason code */

     /* report reason, if any     */
     if (Reason != MQRC_NONE)
     {
       printf("MQCLOSE ended with reason code %d\n", Reason);
     }
   }


   /*   Disconnect from MQM if not already connected */
   if (CReason != MQRC_ALREADY_CONNECTED)
   {
     MQDISC(&Hcon,                   /* connection handle */
            &CompCode,               /* completion code */
            &Reason);                /* reason code */

     /* report reason, if any     */
     if (Reason != MQRC_NONE)
     {
       printf("MQDISC ended with reason code %d\n", Reason);
     }
   }


   /* END OF AMQSPUT0 */
   printf("Sample AMQSPUT0 end\n");
   return(0);
 }

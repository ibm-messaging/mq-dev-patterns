/* @(#) MQMBID sn=p931-L220929.1 su=_rc_f-UABEe28rbfryugV4g pn=samples/c/amqsreq0.c */
 /********************************************************************/
 /*                                                                  */
 /* Program name: AMQSREQ0                                           */
 /*                                                                  */
 /* Description: Sample C program that puts request messages to      */
 /*              a message queue and shows the replies (example      */
 /*              using REPLY queue)                                  */
 /*   <copyright                                                     */
 /*   notice="lm-source-program"                                     */
 /*   pids="5724-H72,"                                               */
 /*   years="1994,2020"                                              */
 /*   crc="1303214634" >                                             */
 /*   Licensed Materials - Property of IBM                           */
 /*                                                                  */
 /*   5724-H72,                                                      */
 /*                                                                  */
 /*   (C) Copyright IBM Corp. 1994, 2020 All Rights Reserved.        */
 /*                                                                  */
 /*   US Government Users Restricted Rights - Use, duplication or    */
 /*   disclosure restricted by GSA ADP Schedule Contract with        */
 /*   IBM Corp.                                                      */
 /*   </copyright>                                                   */
 /********************************************************************/

 #include <stdio.h>
 #include <stdlib.h>
 #include <string.h>
    /* includes for MQI  */
 #include <cmqc.h>

 int main(int argc, char * const *argv)
 {

   /*   Declare file for sample input */
   FILE *fp;

   /*   Declare MQI structures needed                                */
   MQOD     od = {MQOD_DEFAULT};    /* Object Descriptor             */
   MQOD    odr = {MQOD_DEFAULT};    /* Object Descriptor for reply   */
   MQMD     md = {MQMD_DEFAULT};    /* Message Descriptor            */
   MQGMO   gmo = {MQGMO_DEFAULT};   /* get message options           */
   MQPMO   pmo = {MQPMO_DEFAULT};   /* put message options           */
      /** note, sample uses defaults where it can **/

   MQHCONN  Hcon;                   /* connection handle             */
   MQHOBJ   Hobj;                   /* object handle (server)        */
   MQHOBJ   Hreply;                 /* object handle for reply       */
   MQLONG   O_options;              /* MQOPEN options                */
   MQLONG   C_options;              /* MQCLOSE options               */
   MQLONG   CompCode;               /* completion code               */
   MQLONG   OpenCode;               /* MQOPEN completion code        */
   MQLONG   Reason;                 /* reason code                   */
   MQLONG   CReason;                /* reason code for MQCONN        */
   char     buffer[100];            /* message buffer                */
   MQLONG   buflen;                 /* buffer length                 */
   MQLONG   replylen;               /* reply length                  */
   MQCHAR   replyQ[MQ_Q_NAME_LENGTH + 1]; /* reply queue name        */
   char     QMName[MQ_Q_MGR_NAME_LENGTH + 1];  /* queue manager name */

   printf("Sample AMQSREQ0 start\n");
   if (argc < 2)
   {
     printf("Required parameter missing - queue name\n");
     exit(99);
   }

   /*   Connect to queue manager  */
   QMName[0] = 0;    /* default */
   if (argc > 2)
     strncpy(QMName, argv[2], MQ_Q_MGR_NAME_LENGTH);
   MQCONN(QMName,                  /* queue manager                  */
          &Hcon,                   /* connection handle              */
          &CompCode,               /* completion code                */
          &CReason);               /* reason code                    */

   /* report reason and stop if it failed */
   if (CompCode == MQCC_FAILED)
   {
     printf("MQCONN ended with reason code %d\n", CReason);
     exit(CReason);
   }

   /* Use parameter as the name of the target queue */
   strncpy(od.ObjectName, argv[1], MQ_Q_NAME_LENGTH);
   printf("server queue is %s\n", od.ObjectName);


   /* Open the server message queue for output */
   O_options = MQOO_OUTPUT         /* open queue for output          */
        | MQOO_FAIL_IF_QUIESCING;  /* but not if MQM stopping        */
   MQOPEN(Hcon,                    /* connection handle              */
          &od,                     /* object descriptor for queue    */
          O_options,               /* open options                   */
          &Hobj,                   /* object handle                  */
          &OpenCode,               /* completion code                */
          &Reason);                /* reason code                    */

   /* report reason, if any; stop if failed */
   if (Reason != MQRC_NONE)
   {
     printf("MQOPEN ended with reason code %d\n", Reason);
   }

   if (OpenCode == MQCC_FAILED)
   {
     printf("unable to open server queue for output\n");
     exit(Reason);
   }

   /*   Open the queue to receive the reply messages; allow a dynamic queue to be created from a model queue */
   O_options = MQOO_INPUT_EXCLUSIVE /* open queue for input          */
          | MQOO_FAIL_IF_QUIESCING; /* but not if MQM stopping       */

   if (argc > 3)                    /* specified reply queue name    */
   {
     strncpy(odr.ObjectName, argv[3], MQ_Q_NAME_LENGTH);
   }
   else                             /* default reply queue name      */
   {
     strcpy(odr.ObjectName, "SYSTEM.SAMPLE.REPLY");
     strcpy(odr.DynamicQName, "*"); /* dynamic queue name */
   }

   MQOPEN(Hcon,                    /* connection handle              */
          &odr,                    /* object descriptor for queue    */
          O_options,               /* open options                   */
          &Hreply,                 /* reply object handle            */
          &OpenCode,               /* completion code                */
          &Reason);                /* reason code                    */
   /* report reason, if any; stop if failed  */
   if (Reason != MQRC_NONE)
   {
     printf("MQOPEN ended with reason code %d\n", Reason);
   }

   if (OpenCode == MQCC_FAILED)
   {
     printf("unable to open reply queue\n");
   }
   else
   {
     /*   Save reply queue name - ObjectName is either the specified local queue, or a generated dynamic queue name */
     strncpy(replyQ, odr.ObjectName, MQ_Q_NAME_LENGTH);
     replyQ[MQ_Q_NAME_LENGTH] = 0;
     printf("replies to %s\n", replyQ);
   }

   /*   Read lines from the file and put them to the message queue. */
   CompCode = OpenCode;       /* use MQOPEN result for initial test  */
   fp = stdin;

   md.MsgType  = MQMT_REQUEST; /* message is a request */
   /* ask for exceptions to be reported with original text */
   md.Report = MQRO_EXCEPTION_WITH_DATA;
   strncpy(md.ReplyToQ,        /* reply queue name */
           replyQ, MQ_Q_NAME_LENGTH);
   memcpy(md.Format,           /* character string format  */
           MQFMT_STRING, MQ_FORMAT_LENGTH);

   pmo.Options |= MQPMO_NEW_MSG_ID;
   pmo.Options |= MQPMO_NO_SYNCPOINT;

   while (CompCode != MQCC_FAILED)
   {
     if (fgets(buffer, sizeof(buffer) - 1, fp)
                               != NULL)  /* read next line  */
     {
       buflen = (MQLONG)strlen(buffer) - 1; /* length without end-line */
       buffer[buflen] = '\0';        /* remove end-line              */
     }
     else buflen = 0;                /* treat EOF same as null line  */

     /*   Put each buffer to the message queue  */
     if (buflen > 0)
     {
       MQPUT(Hcon,                /* connection handle               */
             Hobj,                /* object handle                   */
             &md,                 /* message descriptor              */
             &pmo,                /* default options                 */
             buflen,              /* buffer length                   */
             buffer,              /* message buffer                  */
             &CompCode,           /* completion code                 */
             &Reason);            /* reason code                     */

       /* report reason, if any */
       if (Reason != MQRC_NONE)
       {
         printf("MQPUT ended with reason code %d\n", Reason);
       }

     }
     else        /* close the message loop if null line in file */
       CompCode = MQCC_FAILED;
   }

   /*   Get and display the reply messages */
   CompCode = OpenCode;          /* only if the reply queue is open  */
   gmo.Version = MQGMO_VERSION_2;    /* Avoid need to reset Message  */
   gmo.MatchOptions = MQMO_NONE;     /* ID and Correlation ID after  */
                                     /* every MQGET                  */
   gmo.WaitInterval = 60000;     /* 1 minute limit for first reply   */
   gmo.Options = MQGMO_WAIT        /* wait for replies               */
       | MQGMO_CONVERT             /* request conversion if needed   */
       | MQGMO_ACCEPT_TRUNCATED_MSG; /* can truncate if needed       */

   while (CompCode != MQCC_FAILED)
   {
     /** specify representation that is required **/
     md.Encoding = MQENC_NATIVE;
     md.CodedCharSetId = MQCCSI_Q_MGR;

     /* Get reply message  */
     buflen = 64;                 /* get first 64 bytes only         */
     MQGET(Hcon,                  /* connection handle               */
           Hreply,                /* object handle for reply         */
           &md,                   /* message descriptor              */
           &gmo,                  /* get options                     */
           buflen,                /* buffer length                   */
           buffer,                /* message buffer                  */
           &replylen,             /* reply length                    */
           &CompCode,             /* completion code                 */
           &Reason);              /* reason code                     */
     gmo.WaitInterval = 15000;    /* 15 second limit for others      */

     /* report reason, if any */
     switch(Reason)
     {
       case MQRC_NONE:
         break;
       case MQRC_NO_MSG_AVAILABLE:
         printf("no more replies\n");
         break;
       default:
         printf("MQGET ended with reason code %d\n", Reason);
         break;
     }

     /*   Display reply message */
     if (CompCode != MQCC_FAILED)
     {
       if (replylen < buflen)      /* terminate (truncated) string   */
         buffer[replylen] = '\0';
       else
         buffer[buflen] = '\0';

       printf("response <%s>\n", buffer); /* display the response    */
       if (md.MsgType == MQMT_REPORT)     /* display report feedback */
         printf("  report with feedback = %d\n", md.Feedback);
     }
   }

   /*   Close server queue - program terminated if open failed       */
   C_options = 0;                   /* no close options              */

   MQCLOSE(Hcon,                    /* connection handle             */
           &Hobj,                   /* object handle                 */
           C_options,
           &CompCode,               /* completion code               */
           &Reason);                /* reason code                   */

   /* report reason, if any     */
   if (Reason != MQRC_NONE)
   {
     printf("MQCLOSE (server) ended with reason code %d\n", Reason);
   }

   /*   Close reply queue - if it was opened */
   if (OpenCode != MQCC_FAILED)
   {
     if (argc > 3)                    /* specified reply queue name  */
        C_options = 0;                /* no close options            */
     else
        C_options = MQCO_DELETE;      /* delete dynamic queue        */

     MQCLOSE(Hcon,                    /* connection handle           */
             &Hreply,                 /* object handle               */
             C_options,
             &CompCode,               /* completion code             */
             &Reason);                /* reason code                 */

     /* report reason, if any  */
     if (Reason != MQRC_NONE)
     {
       printf("MQCLOSE (reply) ended with reason code %d\n", Reason);
     }
   }

   /*   Disconnect from MQM  (unless previously connected) */
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

   /* END OF AMQSREQ0 */
   printf("Sample AMQSREQ0 end\n");
   return(0);
 }

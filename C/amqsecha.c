/* @(#) MQMBID sn=p931-L220929.1 su=_rc_f-UABEe28rbfryugV4g pn=samples/c/amqsecha.c */
 /********************************************************************/
 /*                                                                  */
 /* Program name: AMQSECHA                                           */
 /*                                                                  */
 /* Description: Sample C program - echo messages to reply to queue  */
 /*   <copyright                                                     */
 /*   notice="lm-source-program"                                     */
 /*   pids="5724-H72,"                                               */
 /*   years="1994,2016"                                              */
 /*   crc="2091878105" >                                             */
 /*   Licensed Materials - Property of IBM                           */
 /*                                                                  */
 /*   5724-H72,                                                      */
 /*                                                                  */
 /*   (C) Copyright IBM Corp. 1994, 2016 All Rights Reserved.        */
 /*                                                                  */
 /*   US Government Users Restricted Rights - Use, duplication or    */
 /*   disclosure restricted by GSA ADP Schedule Contract with        */
 /*   IBM Corp.                                                      */
 /*   </copyright>                                                   */
 /********************************************************************/

 #include <stdio.h>
 #include <stdlib.h>
 #include <string.h>
     /*  includes for MQI  */
 #include <cmqc.h>

 int main(int argc, char * const * argv)
 {

   /*   Declare MQI structures needed                                */
   MQOD    odG = {MQOD_DEFAULT};    /* Object Descriptor for GET     */
   MQOD    odR = {MQOD_DEFAULT};    /* Object Descriptor for reply   */
   MQMD     md = {MQMD_DEFAULT};    /* Message Descriptor            */
   MQGMO   gmo = {MQGMO_DEFAULT};   /* get message options           */
   MQPMO   pmo = {MQPMO_DEFAULT};   /* put message options           */
      /** note, sample uses defaults where it can **/
   MQTMC2   *trig;                  /* trigger message structure     */

   MQHCONN  Hcon;                   /* connection handle             */
   MQHOBJ   Hobj;                   /* object handle, server queue   */
   MQLONG   O_options;              /* MQOPEN options                */
   MQLONG   C_options;              /* MQCLOSE options               */
   MQLONG   CompCode;               /* completion code               */
   MQLONG   Reason;                 /* reason code                   */
   MQLONG   CReason;                /* reason code (MQCONN)          */
   MQBYTE   buffer[100];            /* message buffer                */
   MQLONG   buflen;                 /* buffer length                 */
   MQLONG   messlen;                /* message length received       */

   printf("Sample AMQSECHA start\n");
   if (argc < 2)
   {
     printf("Missing parameter - start program by MQI trigger\n");
     exit(99);
   }
   else if (argc > 2)
   {
     printf("Extra input parameters ignored\n");
   }

   /*   Set the program argument into the trigger message */
   /*   Check the struc_id of the trigger message. */
   trig = (MQTMC2*)argv[1];        /* -> trigger message */

   if (memcmp(trig -> StrucId
             ,MQTMC_STRUC_ID
             ,sizeof(MQCHAR4)) != 0)
   {
     printf("Invalid input trigger message provided\n");
     exit(99);
   }

   MQCONN(trig->QMgrName,          /* queue manager  */
          &Hcon,                   /* connection handle */
          &CompCode,               /* completion code */
          &CReason);               /* reason code */

   /* report reason and stop if it failed     */
   if (CompCode == MQCC_FAILED)
   {
     printf("MQCONN ended with reason code %d\n", CReason);
     exit(CReason);
   }

   memcpy(odG.ObjectName,          /* name of input queue  */
          trig -> QName, MQ_Q_NAME_LENGTH);
   O_options = MQOO_INPUT_SHARED   /* open queue for shared input  */
             | MQOO_FAIL_IF_QUIESCING; /* but not if MQM stopping  */
   MQOPEN(Hcon,                    /* connection handle  */
          &odG,                    /* object descriptor for queue  */
          O_options,               /* open options */
          &Hobj,                   /* object handle  */
          &CompCode,               /* MQOPEN completion code */
          &Reason);                /* reason code */

   /* report reason if any; stop if it failed */
   if (Reason != MQRC_NONE)
   {
     printf("MQOPEN (input) ended with reason code %d\n", Reason);
   }

   if (CompCode == MQCC_FAILED)
   {
     exit(Reason);
   }

   /* Get messages from the message queue */
   buflen = sizeof(buffer) - 1;

   gmo.Version = MQGMO_VERSION_2;     /* Avoid need to reset Message */
   gmo.MatchOptions = MQMO_NONE;      /* ID and Correlation ID after */
                                      /* every MQGET                 */
   gmo.Options = MQGMO_ACCEPT_TRUNCATED_MSG
          | MQGMO_CONVERT         /* receive converted messages      */
          | MQGMO_WAIT            /* wait for new messages           */
          | MQGMO_NO_SYNCPOINT;   /* No syncpoint                    */
   gmo.WaitInterval = 5000;       /* 5 second limit for waiting      */

   pmo.Options = MQPMO_NO_SYNCPOINT;   /* No syncpoint               */

   while (CompCode == MQCC_OK)
   {
     md.Encoding       = MQENC_NATIVE;
     md.CodedCharSetId = MQCCSI_Q_MGR;

     MQGET(Hcon,                /* connection handle                 */
           Hobj,                /* object handle                     */
           &md,                 /* message descriptor                */
           &gmo,                /* GET options                       */
           buflen,              /* buffer length                     */
           buffer,              /* message buffer                    */
           &messlen,            /* message length                    */
           &CompCode,           /* completion code                   */
           &Reason);            /* reason code                       */

     /* report reason if any  (loop ends if it failed) */
     if (Reason != MQRC_NONE)
     {
       printf("MQGET ended with reason code %d\n", Reason);
     }

     /* Only process REQUEST messages */
     if ((CompCode == MQCC_OK)  ||  (CompCode == MQCC_WARNING))
     {
       buffer[messlen] = '\0';  /* end string ready to use */
       printf("%s\n", buffer);

       if (md.MsgType != MQMT_REQUEST)
       {
         printf("  -- not a request and discarded\n");
         continue;
       }

       /* Send reply using MQPUT1 */
       md.MsgType = MQMT_REPLY;

       /* Copy the ReplyTo queue name to the object descriptor */

       strncpy(odR.ObjectName, md.ReplyToQ, MQ_Q_NAME_LENGTH);
       strncpy(odR.ObjectQMgrName,
               md.ReplyToQMgr, MQ_Q_MGR_NAME_LENGTH);

       if ( !(md.Report & MQRO_PASS_CORREL_ID) )
       {
         memcpy(md.CorrelId, md.MsgId, sizeof(md.MsgId));
       }

       if ( !(md.Report & MQRO_PASS_MSG_ID) )
       {
         memcpy(md.MsgId, MQMI_NONE, sizeof(md.MsgId));
       }

       if (md.Report & MQRO_PASS_DISCARD_AND_EXPIRY)
       {
         if (md.Report & MQRO_DISCARD_MSG)
         {
           md.Report = MQRO_DISCARD_MSG;
         }
         else
         {
           md.Report = MQRO_NONE;         /*  stop further reports */
         }
       }
       else
       {
         md.Report = MQRO_NONE;           /* stop further reports */
       }

       /*   Put the message                                          */
       MQPUT1(Hcon,            /* connection handle                  */
              &odR,            /* object descriptor                  */
              &md,             /* message descriptor                 */
              &pmo,            /* default options                    */
              messlen,         /* message length                     */
              buffer,          /* message buffer                     */
              &CompCode,       /* completion code                    */
              &Reason);        /* reason code                        */

       /* report reason if any  (loop ends if it failed) */
       if (Reason != MQRC_NONE)
       {
         printf("MQPUT1 ended with reason code %d\n", Reason);
       }
     }     /* end message for reply */
   }     /* end Get message loop */

   /*   Close server queue when no messages left */
   C_options = 0;                   /* no close options */
   MQCLOSE(Hcon,                    /* connection handle */
           &Hobj,                   /* object handle */
           C_options,
           &CompCode,               /* completion code */
           &Reason);                /* reason code */

   /* report reason, if any     */
   if (Reason != MQRC_NONE)
   {
     printf("MQCLOSE ended with reason code %d\n", Reason);
   }

   /*   Disconnect from MQM  (unless previously connected) */
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

   /* END OF AMQSECHA */
   printf("Sample AMQSECHA end\n");
   return(0);
 }

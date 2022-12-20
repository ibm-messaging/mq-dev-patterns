 /* @(#) MQMBID sn=p931-L220929.1 su=_rc_f-UABEe28rbfryugV4g pn=samples/c/amqssuba.c */
 /********************************************************************/
 /*                                                                  */
 /* Program name: AMQSSUBA                                           */
 /*                                                                  */
 /* Description: Sample C program that subscribes and gets messages  */
 /*              from a topic (example using MQSUB). A managed       */
 /*              destination queue is used.                          */
 /*   <copyright                                                     */
 /*   notice="lm-source-program"                                     */
 /*   pids="5724-H72"                                                */
 /*   years="1994,2019"                                              */
 /*   crc="806299572" >                                              */
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
     /* includes for MQI  */
 #include <cmqc.h>
  #include "get_pass.h"
	#include "conn.h"

 int main(int argc, char * const *argv)
 {

   /*   Declare MQI structures needed                                */
   MQSD     sd = {MQSD_DEFAULT};    /* Subscription Descriptor       */
   MQMD     md = {MQMD_DEFAULT};    /* Message Descriptor            */
   MQGMO   gmo = {MQGMO_DEFAULT};   /* get message options           */
   MQCNO   cno = {MQCNO_DEFAULT};   /* connection options            */
   MQCSP   csp = {MQCSP_DEFAULT};   /* security parameters           */
      /** note, sample uses defaults where it can **/

   MQHCONN  Hcon;                   /* connection handle             */
   MQHOBJ   Hobj = MQHO_NONE;       /* object handle used for MQGET  */
   MQHOBJ   Hsub = MQHO_NONE;       /* object handle                 */
   MQLONG   C_options;              /* MQCLOSE options               */
   MQLONG   CompCode;               /* completion code               */
   MQLONG   S_CompCode;             /* MQSUB completion code         */
   MQLONG   Reason;                 /* reason code                   */
   MQLONG   CReason;                /* reason code for MQCONNX       */
   MQBYTE   buffer[1024];           /* message buffer                */
   MQLONG   buflen;                 /* buffer length                 */
   MQLONG   messlen;                /* message length received       */
   char     QMName[MQ_Q_MGR_NAME_LENGTH];             /* queue manager name            */

   printf("Sample AMQSSUBA start\n");
   if (argc < 2)
   {
     printf("Required parameter missing - topic string\n");
     exit(99);
   }

	 /* Setup any authentication information supplied in the local environment. */
   setup_mqsamp_user_id(&cno, &csp);

	 CReason = mqconnect_x(QMName, argv, argc, &cno, &Hcon);

   /*   Subscribe using a managed destination queue */

   sd.Options =   MQSO_CREATE
                | MQSO_NON_DURABLE
                | MQSO_FAIL_IF_QUIESCING
                | MQSO_MANAGED;
   if (argc > 3)
   {
     sd.Options = atoi( argv[3] );
     printf("MQSUB SD.Options are %d\n", sd.Options);
   }

   sd.ObjectString.VSPtr = argv[1];
   sd.ObjectString.VSLength = (MQLONG)strlen(argv[1]);

   MQSUB(Hcon,                       /* connection handle            */
         &sd,                        /* object descriptor for queue  */
         &Hobj,                      /* object handle (output)       */
         &Hsub,                      /* object handle (output)       */
         &S_CompCode,                /* completion code              */
         &Reason);                   /* reason code                  */

   /* report reason, if any; stop if failed      */
   if (Reason != MQRC_NONE)
   {
     printf("MQSUB ended with reason code %d\n", Reason);
   }

   if (S_CompCode == MQCC_FAILED)
   {
     printf("unable to subscribe to topic\n");
   }

   CompCode = S_CompCode;       /* use MQOPEN result for initial test  */

   gmo.Options =   MQGMO_WAIT         /* wait for new messages       */
                 | MQGMO_NO_SYNCPOINT /* no transaction              */
                 | MQGMO_CONVERT      /* convert if necessary        */
                 | MQGMO_NO_PROPERTIES;

   gmo.WaitInterval = 30000;        /* 30 second limit for waiting   */

   while (CompCode != MQCC_FAILED)
   {
     buflen = sizeof(buffer) - 1; /* buffer size available for GET  */

     memcpy(md.MsgId, MQMI_NONE, sizeof(md.MsgId));
     memcpy(md.CorrelId, MQCI_NONE, sizeof(md.CorrelId));

     md.Encoding       = MQENC_NATIVE;
     md.CodedCharSetId = MQCCSI_Q_MGR;
     printf("Calling MQGET : %d seconds wait time\n",
            gmo.WaitInterval / 1000);

     MQGET(Hcon,                /* connection handle                 */
           Hobj,                /* object handle                     */
           &md,                 /* message descriptor                */
           &gmo,                /* get message options               */
           buflen,              /* buffer length                     */
           buffer,              /* message buffer                    */
           &messlen,            /* message length                    */
           &CompCode,           /* completion code                   */
           &Reason);            /* reason code                       */

     /* report reason, if any     */
     if (Reason != MQRC_NONE)
     {
       if (Reason == MQRC_NO_MSG_AVAILABLE)
       {                         /* special report for normal end    */
         printf("no more messages\n");
       }
       else                      /* general report for other reasons */
       {
         printf("MQGET ended with reason code %d\n", Reason);

         /*   treat truncated message as a failure for this sample   */
         if (Reason == MQRC_TRUNCATED_MSG_FAILED)
         {
           CompCode = MQCC_FAILED;
         }
       }
     }

     /*   Display each message received */
     if (CompCode != MQCC_FAILED)
     {
       buffer[messlen] = '\0';            /* add terminator */
       printf("message <%s>\n", buffer);
     }
   }

   /*   Close the subscription handle */
   if (S_CompCode != MQCC_FAILED)
   {
     C_options = MQCO_NONE;        /* no close options             */

     MQCLOSE(Hcon,                    /* connection handle           */
             &Hsub,                   /* object handle               */
             C_options,
             &CompCode,               /* completion code             */
             &Reason);                /* reason code                 */

     /* report reason, if any */
     if (Reason != MQRC_NONE)
     {
       printf("MQCLOSE ended with reason code %d\n", Reason);
     }
   }

   /*   Close the managed destination queue (if it was opened) */
   if (S_CompCode != MQCC_FAILED)
   {
     C_options = MQCO_NONE;

     MQCLOSE(Hcon,                    /* connection handle */
             &Hobj,                   /* object handle  */
             C_options,
             &CompCode,               /* completion code */
             &Reason);                /* reason code */

     /* report reason, if any */
     if (Reason != MQRC_NONE)
     {
       printf("MQCLOSE ended with reason code %d\n", Reason);
     }
   }

   /*   Disconnect from MQM if not already connected */
   if (CReason != MQRC_ALREADY_CONNECTED )
   {
     MQDISC(&Hcon,                     /* connection handle */
            &CompCode,                 /* completion code  */
            &Reason);                  /* reason code */

     /* report reason, if any */
     if (Reason != MQRC_NONE)
     {
       printf("MQDISC ended with reason code %d\n", Reason);
     }
   }

   /* END OF AMQSSUBA */
   printf("Sample AMQSSUBA end\n");
   return(0);
 }

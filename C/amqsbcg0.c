/* @(#) MQMBID sn=p931-L220929.1 su=_rc_f-UABEe28rbfryugV4g pn=samples/c/amqsbcg0.c */
/**********************************************************************/
/*                                                                    */
/* Program name: AMQSBCG0                                             */
/*                                                                    */
/* Description : Sample program to read and output the message        */
/*                 descriptor fields, any other message properties    */
/*                 and the message content of all the messages on a   */
/*                 queue                                              */
/*   <copyright                                                       */
/*   notice="lm-source-program"                                       */
/*   pids="5724-H72"                                                  */
/*   years="1994,2021"                                                */
/*   crc="2777991688" >                                               */
/*   Licensed Materials - Property of IBM                             */
/*                                                                    */
/*   5724-H72                                                         */
/*                                                                    */
/*   (C) Copyright IBM Corp. 1994, 2021 All Rights Reserved.          */
/*                                                                    */
/*   US Government Users Restricted Rights - Use, duplication or      */
/*   disclosure restricted by GSA ADP Schedule Contract with          */
/*   IBM Corp.                                                        */
/*   </copyright>                                                     */
/**********************************************************************/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <ctype.h>
#include <locale.h>
#include <cmqc.h>
#include "get_pass.h"
#include "conn.h"

#define    CHARS_PER_LINE  16  /* Used in formatting the message */
#define    BUFFERLENGTH  65536 /* Max length of message accepted */
#define    NAMELENGTH     256  /* Initial returned name buffer length */
#define    VALUELENGTH   32767 /* Initial property value length */

typedef enum                   /* Property options */
{
  PROPS_AS_Q_DEF = 0,
  PROPS_IN_MSG_HANDLE,
  PROPS_NONE,
  PROPS_IN_MQRFH2,
  PROPS_COMPATIBILITY,
  PROPS_LAST
} PropOptions;

#if MQAT_DEFAULT == MQAT_WINDOWS_NT /* printf 64-bit integer type */
  #define  Int64 "I64"
#elif defined(MQ_64_BIT)
  #define  Int64 "l"
#else
  #define  Int64 "ll"
#endif

void printMD(MQMD *MDin)
{
   int i;

   printf("\n****Message descriptor****\n");
   printf("\n  StrucId  : '%.4s'", MDin->StrucId);
   printf("  Version : %d", MDin->Version);
   printf("\n  Report   : %d", MDin->Report);
   printf("  MsgType : %d", MDin->MsgType);
   printf("\n  Expiry   : %d", MDin->Expiry);
   printf("  Feedback : %d", MDin->Feedback);
   printf("\n  Encoding : %d", MDin->Encoding);
   printf("  CodedCharSetId : %d", MDin->CodedCharSetId);
   printf("\n  Format : '%.*s'", MQ_FORMAT_LENGTH, MDin->Format);
   printf("\n  Priority : %d", MDin->Priority);
   printf("  Persistence : %d", MDin->Persistence);
   printf("\n  MsgId : X'");

   for (i = 0 ; i < MQ_MSG_ID_LENGTH ; i++)
     printf("%02X",MDin->MsgId[i] );

   printf("'");
   printf("\n  CorrelId : X'");

   for (i = 0 ; i < MQ_CORREL_ID_LENGTH ; i++)
     printf("%02X",MDin->CorrelId[i] );

   printf("'");
   printf("\n  BackoutCount : %d", MDin->BackoutCount);
   printf("\n  ReplyToQ       : '%.*s'", MQ_Q_NAME_LENGTH,
          MDin->ReplyToQ);
   printf("\n  ReplyToQMgr    : '%.*s'", MQ_Q_MGR_NAME_LENGTH,
          MDin->ReplyToQMgr);
   printf("\n  ** Identity Context");
   printf("\n  UserIdentifier : '%.*s'", MQ_USER_ID_LENGTH,
          MDin->UserIdentifier);
   printf("\n  AccountingToken : \n   X'");

   for (i = 0 ; i < MQ_ACCOUNTING_TOKEN_LENGTH ; i++)
     printf("%02X",MDin->AccountingToken[i] );

   printf("'");
   printf("\n  ApplIdentityData : '%.*s'", MQ_APPL_IDENTITY_DATA_LENGTH,
          MDin->ApplIdentityData);
   printf("\n  ** Origin Context");
   printf("\n  PutApplType    : '%d'", MDin->PutApplType);
   printf("\n  PutApplName    : '%.*s'", MQ_PUT_APPL_NAME_LENGTH,
          MDin->PutApplName);
   printf("\n  PutDate  : '%.*s'", MQ_PUT_DATE_LENGTH, MDin->PutDate);
   printf("    PutTime  : '%.*s'", MQ_PUT_TIME_LENGTH, MDin->PutTime);
   printf("\n  ApplOriginData : '%.*s'\n", MQ_APPL_ORIGIN_DATA_LENGTH,
          MDin->ApplOriginData);
   printf("\n  GroupId : X'");

   for (i = 0 ; i < MQ_GROUP_ID_LENGTH ; i++)
     printf("%02X",MDin->GroupId[i] );

   printf("'");
   printf("\n  MsgSeqNumber   : '%d'", MDin->MsgSeqNumber);
   printf("\n  Offset         : '%d'", MDin->Offset);
   printf("\n  MsgFlags       : '%d'", MDin->MsgFlags);
   printf("\n  OriginalLength : '%d'", MDin->OriginalLength);
}  /* end printMD */


void printProperties(MQHCONN Hconn, MQHMSG Hmsg)
{
  /*                                                                  */
  /* variable declaration and initialisation                          */
  /*                                                                  */
  int     i;                              /* loop counter             */
  int     j;                              /* another loop counter     */
  MQIMPO  InqPropOpts = {MQIMPO_DEFAULT}; /* inquire prop options     */
  MQLONG  NameLength = NAMELENGTH;     /* returned name buffer length */
  PMQCHAR NameBuffer = NULL;              /* returned name buffer     */
  MQCHARV InqName = {MQPROP_INQUIRE_ALL}; /* browse all properties    */
  MQPD    PropDesc = {MQPD_DEFAULT};      /* property descriptor      */
  MQLONG  Type;                           /* property type            */
  MQLONG  ValueLength = VALUELENGTH;      /* value buffer length      */
  PMQBYTE Value = NULL;                   /* value buffer             */
  MQLONG  PropsLength;                    /* length of property value */
  MQLONG  CompCode = MQCC_OK;             /* MQINQMP completion code  */
  MQLONG  Reason = MQRC_NONE;             /* MQINQMP reason code      */

  /* Initialise storage                    */
  Value = (PMQBYTE)malloc(ValueLength);
  NameBuffer = (PMQCHAR)malloc(NameLength);

  /* Initialise the inquire prop options   */
  InqPropOpts.Options |= MQIMPO_CONVERT_VALUE;
  InqPropOpts.ReturnedName.VSPtr     = NameBuffer;
  InqPropOpts.ReturnedName.VSBufSize = NameLength;

  /* then dump the message properties */
  printf("\n ");
  printf("\n****Message properties****\n");

  /* Loop until MQINQMP unsuccessful */
  for (i = 0; CompCode == MQCC_OK; i++)
  {
    MQINQMP(Hconn,
            Hmsg,
            &InqPropOpts,
            &InqName,
            &PropDesc,
            &Type,
            ValueLength,
            Value,
            &PropsLength,
            &CompCode,
            &Reason);

    /* Check for success */
    if (CompCode != MQCC_OK)
    {
      switch(Reason)
      {
        case MQRC_PROPERTY_NOT_AVAILABLE:
          /* This message contains no more properties ....  */
          if (i == 0)
          {
            /* In fact there were no properties at all */
            printf("\n  None\n");
          }
          break;

        case MQRC_PROPERTY_VALUE_TOO_BIG:
          /* The Value buffer is too small - inquire the same prop again, but with a bigger value buffer */
          if (PropsLength <= ValueLength)
          {
            /* We expect to be allocating a bigger buffer than before */
            Reason = MQRC_STORAGE_NOT_AVAILABLE;
            printf("\n Unable to allocate property value buffer");
          }
          else
          {
            ValueLength = PropsLength;
            free(Value);
            Value = (PMQBYTE)malloc(ValueLength);
            if (Value)
            {
              CompCode = MQCC_OK;
              InqPropOpts.Options = MQIMPO_CONVERT_VALUE | MQIMPO_INQ_PROP_UNDER_CURSOR;
            }
            else
            {
              Reason = MQRC_STORAGE_NOT_AVAILABLE;
              printf("\n Unable to allocate property value buffer");
            }
          }
          break;

        case MQRC_PROPERTY_NAME_TOO_BIG:
          /* The returned name buffer is too small - inquire the same prop again, but with a bigger returned name buffer */
          NameLength = InqPropOpts.ReturnedName.VSLength;
          free(NameBuffer);
          NameBuffer = (PMQCHAR)malloc(NameLength);
          if (NameBuffer)
          {
            CompCode = MQCC_OK;
            InqPropOpts.ReturnedName.VSPtr = NameBuffer;
            InqPropOpts.ReturnedName.VSBufSize = NameLength;
            InqPropOpts.Options = MQIMPO_CONVERT_VALUE | MQIMPO_INQ_PROP_UNDER_CURSOR;
          }
          else
          {
            Reason = MQRC_STORAGE_NOT_AVAILABLE;
            printf("\n Unable to allocate property name buffer");
          }
          break;

        default:
          /* MQINQMP failed for some other reason */
          printf("\n MQINQMP failed with CompCode:%d Reason:%d",
                 CompCode,Reason);
          break;
      }
    }
    else
    {
      /* MQINQMP succeeded. */

      /* Print the property name */
      printf("\n  %.*s : ",
             InqPropOpts.ReturnedName.VSLength,
             (char*)InqPropOpts.ReturnedName.VSPtr);

      /* Print the property value */
      switch (Type)
      {
        /* Boolean value */
        case MQTYPE_BOOLEAN:
          printf("%s", *(PMQBOOL)Value ? "TRUE" : "FALSE");
          break;

        /* Byte-string value */
        case MQTYPE_BYTE_STRING:
          printf("X'");
          for (j = 0 ; j < PropsLength ; j++)
            printf("%02X",Value[j] );
          printf("'");
          break;

        /* 32-bit floating-point number value */
        case MQTYPE_FLOAT32:
          printf("%.12g", *(PMQFLOAT32)Value);
          break;

        /* 64-bit floating-point number value */
        case MQTYPE_FLOAT64:
          printf("%.18g", *(PMQFLOAT64)Value);
          break;

        /* 8-bit integer value */
        case MQTYPE_INT8:
          printf("%u", Value[0]);
          break;

        /* 16-bit integer value */
        case MQTYPE_INT16:
          printf("%hd", *(PMQINT16)Value);
          break;

        /* 32-bit integer value */
        case MQTYPE_INT32:
          printf("%d", *(PMQLONG)Value);
          break;

        /* 64-bit integer value */
        case MQTYPE_INT64:
          printf("%"Int64"d", *(PMQINT64)Value);
          break;

        /* Null value */
        case MQTYPE_NULL:
          printf("NULL");
          break;

        /* String value */
        case MQTYPE_STRING:
          printf("'%.*s'", PropsLength, Value);
          break;

        /* A value with an unrecognized type */
        default:
          printf("<unrecognized data type>\n");
          break;
      }

      /* Inquire on the next property      */
      InqPropOpts.Options = MQIMPO_CONVERT_VALUE | MQIMPO_INQ_NEXT;
    }
  }

  free(Value);
  free(NameBuffer);

  return;
}

int  main(int argc, char * const * argv)
{
  /* variable declaration and initialisation                          */
  int i = 0;       /* loop counter                                    */
  int j = 0;       /* another loop counter                            */

  /* variables for MQCONNX */
  MQCHAR  QMgrName[MQ_Q_MGR_NAME_LENGTH];
  MQHCONN Hconn = MQHC_UNUSABLE_HCONN;
  MQLONG  CompCode = MQCC_OK, Reason = MQRC_NONE;
  MQLONG  ShutdownCompCode, ShutdownReason;
  MQCNO   cno = {MQCNO_DEFAULT};   /* connection options            */
  MQCSP   csp = {MQCSP_DEFAULT};   /* security parameters           */

  /* variables for MQOPEN */
  MQCHAR  Queue[MQ_Q_NAME_LENGTH + 1];
  MQOD    ObjDesc = { MQOD_DEFAULT };
  MQLONG  OpenOptions;
  MQHOBJ  Hobj = MQHO_UNUSABLE_HOBJ;

  /* variables for message properties */
  int     PropOption = PROPS_AS_Q_DEF;
  MQCMHO  CrtMsgHOpts = { MQCMHO_DEFAULT };
  MQDMHO  DltMsgHOpts = { MQDMHO_DEFAULT };
  MQHMSG  Hmsg = MQHM_UNUSABLE_HMSG;

  /* variables for MQGET */
  MQMD    MsgDesc = { MQMD_DEFAULT };
  PMQMD   pmdin ;
  MQGMO   GetMsgOpts = { MQGMO_DEFAULT };
  PMQGMO  pgmoin;
  PMQBYTE Buffer;
  MQLONG  BufferLength = BUFFERLENGTH;
  MQLONG  DataLength;
  MQLONG  LengthToPrint;

  /* variables for message formatting *****/
  int  ch;
  int  overrun;  /* used on MBCS characters */
  int  mbcsmax;  /* used for MBCS characters */
  int  char_len;  /* used for MBCS characters */
  char line_text[CHARS_PER_LINE + 4]; /* allows for up to 3 MBCS bytes overrun */
  int  chars_this_line = 0;
  int  lines_printed   = 0;
  int  page_number     = 1;

  /* Use a version 2 MQMD incase the */
  /* message is Segmented/Grouped */
  MsgDesc.Version = MQMD_VERSION_2 ;

  /* Initialise storage... */
  pmdin  = (PMQMD)malloc(sizeof(MQMD));
  pgmoin = (PMQGMO)malloc(sizeof(MQGMO));
  Buffer = (PMQBYTE)malloc(BUFFERLENGTH);

  /* determine locale for MBCS handling */
  setlocale(LC_ALL,"");  /* for mbcs charactersets */
  mbcsmax = MB_CUR_MAX;  /* for mbcs charactersets */

  /* Handle the arguments passed */
  printf("\nAMQSBCG0 - starts here\n");
  printf(  "**********************\n ");

  if (argc < 2)
  {
    printf("Required parameter missing - queue name\n");
    printf("\n  Usage: %s QName [ QMgrName ] [ PropOption ]\n",argv[0]);
    CompCode = 4;
    goto MOD_EXIT;
  }

  if (argc > 3)
  {
    PropOption = (MQLONG)atoi(argv[3]);
    if ( (PropOption < PROPS_AS_Q_DEF) ||
         (PropOption >= PROPS_LAST)    )
    {
      printf("PropOption \"%d\" invalid - specify %d-%d\n",
             PropOption, PROPS_AS_Q_DEF, PROPS_LAST-1);
      printf("\n  Usage: %s QName [ QMgrName ] [ PropOption ]\n",argv[0]);
      CompCode = 4;
      goto MOD_EXIT;
    }
  }

	/* Setup any authentication information supplied in the local environment. */
	setup_mqsamp_user_id(&cno, &csp);

	mqconnect_x(QMgrName, argv, argc, &cno, &Hconn);

  /* Set the options for the open call */

  OpenOptions = MQOO_BROWSE;

  /* @@@@ Use this for destructive read nstead of the above. */
  /* OpenOptions = MQOO_INPUT_SHARED; */

  strncpy(ObjDesc.ObjectName, Queue, MQ_Q_NAME_LENGTH);

  printf("\n MQOPEN - '%s'", Queue);
  MQOPEN(Hconn,
         &ObjDesc,
         OpenOptions,
         &Hobj,
         &CompCode,
         &Reason);

  if (CompCode != MQCC_OK)
  {
    printf("\n MQOPEN failed with CompCode:%d, Reason:%d",
           CompCode,Reason);
    goto MOD_EXIT;
  }

  if(PropOption == PROPS_IN_MSG_HANDLE)
  {
    printf("\n MQCRTMH");

    MQCRTMH(Hconn,
            &CrtMsgHOpts,
            &Hmsg,
            &CompCode,
            &Reason);

    if (CompCode != MQCC_OK)
    {
      printf("\n  failed with CompCode:%d, Reason:%d",
             CompCode,Reason);
      goto MOD_EXIT;
    }

    GetMsgOpts.MsgHandle = Hmsg;

    /* Set the version number for the Get Message Options with properties */
    GetMsgOpts.Version = MQGMO_VERSION_4;
  }
  else
  {
    /* Set the version number for the Get Message Options */
    GetMsgOpts.Version = MQGMO_VERSION_2;
  }

  printf("\n ");

  /* Avoid need to reset Message ID and Correlation ID after every MQGET */
  GetMsgOpts.MatchOptions = MQMO_NONE;

  /* Set the options for the get calls */
  GetMsgOpts.Options = MQGMO_NO_WAIT ;

  /* Accept but truncate the data received for messages  */
  /* larger than the 64K buffer */
  GetMsgOpts.Options += MQGMO_ACCEPT_TRUNCATED_MSG ;

  /* @@@@ Comment out the next line for destructive read */

  GetMsgOpts.Options += MQGMO_BROWSE_NEXT ;

  if(PropOption == PROPS_IN_MSG_HANDLE)
  {
    /* If specified, request that the non-message descriptor */
    /* properties are returned in the message handle */
    GetMsgOpts.Options += MQGMO_PROPERTIES_IN_HANDLE;
  }
  else if(PropOption == PROPS_IN_MQRFH2)
  {
    /* If specified, request that the non-message descriptor */
    /* properties are returned in an MQRFH2 header */
    GetMsgOpts.Options += MQGMO_PROPERTIES_FORCE_MQRFH2;
  }
  else if(PropOption == PROPS_NONE)
  {
    /* If specified, request that only message descriptor */
    /* properties are returned */
    GetMsgOpts.Options += MQGMO_NO_PROPERTIES;
  }
  else if(PropOption == PROPS_COMPATIBILITY)
  {
    /* If specified, request that the non-message descriptor */
    /* properties are returned in an MQRFH2 header, but only */
    /* if the message contains MQ v6 compatible properties.  */
    GetMsgOpts.Options += MQGMO_PROPERTIES_COMPATIBILITY;
  }

  /* Set the message descriptor and get message */
  /* options to the defaults */
  memcpy(pmdin, &MsgDesc, sizeof(MQMD) );
  memcpy(pgmoin, &GetMsgOpts, sizeof(MQGMO) );

  /* Loop until MQGET unsuccessful  */
  for (j = 1; CompCode != MQCC_FAILED; j++)
  {
     /* Set up the output format of the report */
     if (page_number == 1)
     {
       lines_printed = 29;
       page_number = -1;
     }
     else
     {
       printf("\n ");
       lines_printed = 22;
     }

     /* Initialize the buffer to blanks */
     memset(Buffer,' ',BUFFERLENGTH);

     MQGET(Hconn,
           Hobj,
           pmdin,
           pgmoin,
           BufferLength,
           Buffer,
           &DataLength,
           &CompCode,
           &Reason);

     if  (CompCode == MQCC_FAILED)
     {
       if (Reason != MQRC_NO_MSG_AVAILABLE)
       {
         printf("\n MQGET %d, failed with CompCode:%d Reason:%d",
                j,CompCode,Reason);
       }
       else
       {
         printf("\n \n \n No more messages ");
         CompCode = MQCC_OK;
         Reason   = MQRC_NONE;
         break;
       }
     }
     else
     {
       /* Print the message */
       printf("\n ");
       printf("\n MQGET of message number %d, CompCode:%d Reason:%d",
              j, CompCode, Reason);

       /* first the Message Descriptor */
       printMD(pmdin);

       /* next any other properties */
       if (PropOption == PROPS_IN_MSG_HANDLE)
       {
         printProperties(Hconn, Hmsg);
       }

       /* then dump the Message */
       printf("\n ");
       printf("\n****   Message      ****\n ");

       /* If the messages has been truncated ensure we only print out as much data was actually returned. */
       LengthToPrint = (DataLength < BufferLength)?DataLength:BufferLength;

       printf("\n length - %d of %d bytes\n ", LengthToPrint, DataLength);
       ch = 0;
       overrun = 0;
       do
       {
         chars_this_line = 0;
         printf("\n%08X: ",ch);
         for (;overrun>0; overrun--) /* for MBCS overruns */
         {
           printf("  ");            /* dummy space for characters  */
           line_text[chars_this_line] = ' ';
                                /* included in previous line */
           chars_this_line++;
           if (overrun % 2)
             printf(" ");
         }
         while ( (chars_this_line < CHARS_PER_LINE) &&
                 (ch < LengthToPrint) )
         {
           char_len = mblen((char *)&Buffer[ch],mbcsmax);
           if (char_len < 1)   /* badly formed mbcs character */
             char_len = 1;     /* or NULL treated as sbcs     */
           if (char_len > 1 )
           { /* mbcs case, assumes mbcs are all printable */
             for (;char_len >0;char_len--)
             {
               if ((chars_this_line % 2 == 0) &&
                   (chars_this_line < CHARS_PER_LINE))
                 printf(" ");
               printf("%02X",Buffer[ch] );
               line_text[chars_this_line] = Buffer[ch];
               chars_this_line++;
               ch++;
             }
           }
           else
           {  /* sbcs case */
             if (chars_this_line % 2 == 0)
               printf(" ");
             printf("%02X",Buffer[ch] );
             line_text[chars_this_line] =
                 isprint(Buffer[ch]) ? Buffer[ch] : '.';
             chars_this_line++;
             ch++;
           }
         }

         /* has an mbcs character overrun the usual end? */
         if (chars_this_line > CHARS_PER_LINE)
            overrun = chars_this_line - CHARS_PER_LINE;

         /* pad with blanks to format the last line correctly */
         if (chars_this_line < CHARS_PER_LINE)
         {
           for ( ;chars_this_line < CHARS_PER_LINE;
                chars_this_line++)
           {
             if (chars_this_line % 2 == 0) printf(" ");
             printf("  ");
             line_text[chars_this_line] = ' ';
           }
         }

         /* leave extra space between columns if MBCS characters possible */
         for (i=0;i < ((mbcsmax - overrun - 1) *2);i++)
         {
           printf(" "); /* prints space between hex representation and character */
         }

         line_text[chars_this_line] = '\0';
         printf(" '%s'",line_text);
         lines_printed += 1;
         if (lines_printed >= 60)
         {
           lines_printed = 0;
           printf("\n ");
         }
       }
       while (ch < LengthToPrint);

     } /* end of message received 'else' */

  } /* end of for loop */

MOD_EXIT:
  if (Hmsg != MQHM_UNUSABLE_HMSG)
  {
    printf("\n MQDLTMH");
    MQDLTMH(Hconn,
            &Hmsg,
            &DltMsgHOpts,
            &ShutdownCompCode,
            &ShutdownReason);

    if (ShutdownCompCode != MQCC_OK)
    {
      printf("\n  failed with CompCode:%d, Reason:%d",
             ShutdownCompCode,ShutdownReason);
    }
  }

  if (Hobj != MQHO_UNUSABLE_HOBJ)
  {
    printf("\n MQCLOSE");
    MQCLOSE(Hconn,
            &Hobj,
            MQCO_NONE,
            &ShutdownCompCode,
            &ShutdownReason);

    if (ShutdownCompCode != MQCC_OK)
    {
      printf("\n  failed with CompCode:%d, Reason:%d",
             ShutdownCompCode,ShutdownReason);
    }
  }

  if (Hconn != MQHC_UNUSABLE_HCONN)
  {
    printf("\n MQDISC");
    MQDISC(&Hconn,
           &ShutdownCompCode,
           &ShutdownReason);

    if (ShutdownCompCode != MQCC_OK)
    {
      printf("\n  failed with CompCode:%d, Reason:%d",
             ShutdownCompCode,ShutdownReason);
    }
  }

  free(pmdin);
  free(pgmoin);
  free(Buffer);

  printf("\n");

  return(CompCode);
}

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "get_pass.h"

#if (MQAT_DEFAULT == MQAT_OS400)
 void get_password(char *buffer, size_t size)
 {
   if (Qp0zIsATerminal(fileno(stdin)))
   {
     Qp0zSetTerminalMode( QP0Z_TERMINAL_INPUT_MODE, QP0Z_TERMINAL_HIDDEN, NULL );
     fgets(buffer, size, stdin);
     Qp0zSetTerminalMode( QP0Z_TERMINAL_INPUT_MODE, QP0Z_TERMINAL_PREVIOUS, NULL );
   }
   else
   {
     fgets(buffer, size, stdin);
   }
 }
#elif (MQAT_DEFAULT == MQAT_WINDOWS_NT)
 void get_password(char *buffer, size_t size)
 {
   int c;
   size_t i;
   HANDLE h;
   DWORD  readChars, oldMode, mode;
   BOOL b;
   char charBuf[1];

   h = GetStdHandle(STD_INPUT_HANDLE);
   if (_isatty(fileno(stdin)) && h != INVALID_HANDLE_VALUE)
   {
     GetConsoleMode(h, &mode);
     oldMode = mode;
     mode = (mode & ~(ENABLE_LINE_INPUT | ENABLE_ECHO_INPUT));
     SetConsoleMode(h, mode);

     i=0;
     do
     {
       b = ReadConsole(h, charBuf, 1, &readChars, NULL);
       c = charBuf[0];
       if (b && readChars != 0 && c != '\n' && c != '\r')
       {
         if (c == '\b')
         {
           if (i > 0)
           {
             buffer[--i]=0;
             fprintf(stdout, "\b \b");
             fflush(stdout);
           }
         }
         else
         {
           fputc('*', stdout);
           fflush(stdout);
           buffer[i++] = c;
         }
       }
     } while (b && c != '\n' && c != '\r' && i <= size);
     printf("\n");
     SetConsoleMode(h, oldMode);
   }
   else
   {
     fgets(buffer, (int)size, stdin);
   }
 }
#elif (MQAT_DEFAULT == MQAT_UNIX)
 void get_password(char *buffer, size_t size)
 {
   int c;
   size_t i;
   struct termios savetty, newtty;
   const char BACKSPACE=8;
   const char DELETE=127;
   const char RETURN=10;
   int min = 1;
   int time = 0;

   if (isatty(fileno(stdin)))
   {
     tcgetattr(fileno(stdin), &savetty);
     newtty = savetty;
     newtty.c_cc[VMIN] = min;
     newtty.c_cc[VTIME] = time;
     newtty.c_lflag &= ~(ECHO|ICANON);
     tcsetattr(fileno(stdin), TCSANOW, &newtty);

     i=0;
     do
     {
       c = fgetc(stdin);
       if (c != EOF && c != RETURN)
       {
         if ( (c == BACKSPACE) || (c == DELETE) )
         {
           if (i > 0)
           {
             buffer[--i]=0;
             fprintf(stdout, "\b \b");
             fflush(stdout);
           }
         }
         else
         {
           fputc('*', stdout);
           fflush(stdout);
           buffer[i++] = c;
         }
       }
       else
       {
         buffer[i]=0;
       }
     } while (c != EOF && c != RETURN && i <= size);

     printf("\n");
     fflush(stdout);
     tcsetattr(fileno(stdin), TCSANOW, &savetty);
   }
   else
   {
     fgets(buffer, size, stdin);
   }
 }
#else
 void get_password(char *buffer, size_t size)
 {
   fgets(buffer, (int)size, stdin);
 }
#endif

void setup_mqsamp_user_id(MQCNO * cno, MQCSP * csp){
	char   *UserId;                  /* UserId for authentication  */
  char    Password[MQ_CSP_PASSWORD_LENGTH + 1] = {0};  /* For auth  */


	UserId = getenv("MQSAMP_USER_ID");
  if (UserId != NULL)
  {
    cno->SecurityParmsPtr = csp;
    cno->Version = MQCNO_VERSION_5;

    csp->AuthenticationType = MQCSP_AUTH_USER_ID_AND_PWD;
    csp->CSPUserIdPtr = UserId;
    csp->CSPUserIdLength = (MQLONG)strlen(UserId);

    printf("Enter password: ");
    get_password(Password,sizeof(Password)-1);

    if (strlen(Password) > 0 && Password[strlen(Password) - 1] == '\n')
      Password[strlen(Password) -1] = 0;
    csp->CSPPasswordPtr = Password;
    csp->CSPPasswordLength = (MQLONG)strlen(csp->CSPPasswordPtr);
  }
}

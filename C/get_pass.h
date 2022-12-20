#include <cmqc.h>

/* Platform includes for masked input */
#if (MQAT_DEFAULT == MQAT_OS400)
 #include <qp0ztrml.h>
#elif (MQAT_DEFAULT == MQAT_WINDOWS_NT)
 #define WIN32_LEAN_AND_MEAN
 #include <windows.h>
 #include <io.h>
#elif (MQAT_DEFAULT == MQAT_UNIX)
 #include <termios.h>
 #include <unistd.h>
#endif

void get_password(char *buffer, size_t size);

void setup_mqsamp_user_id(MQCNO * cno, MQCSP * csp);

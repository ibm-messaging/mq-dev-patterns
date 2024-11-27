
set MQ_FILE_PATH=c:\Program Files\IBM\MQ

cl -MD /Fesampleget.exe common.c config.c sampleget.c "%MQ_FILE_PATH%\Tools\Lib64\mqm.lib"
cl -MD /Fesampleput.exe common.c config.c sampleput.c "%MQ_FILE_PATH%\Tools\Lib64\mqm.lib"

cl -MD /Fesamplepublish.exe   common.c config.c samplepublish.c   "%MQ_FILE_PATH%\Tools\Lib64\mqm.lib"
cl -MD /Fesamplesubscribe.exe common.c config.c samplesubscribe.c "%MQ_FILE_PATH%\Tools\Lib64\mqm.lib"

cl -MD /Fesamplerequest.exe  common.c config.c samplerequest.c  "%MQ_FILE_PATH%\Tools\Lib64\mqm.lib"
cl -MD /Fesampleresponse.exe common.c config.c sampleresponse.c "%MQ_FILE_PATH%\Tools\Lib64\mqm.lib"

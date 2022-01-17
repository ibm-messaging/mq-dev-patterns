# IBM MQ Python samples
The python samples are based on https://dsuch.github.io/pymqi/
and have been tested with python 2.7.10 and 3.5.1

Python PyMQI library uses the IBM MQ C client libraries through the MQI interface.

The library needs to be compiled with a C compiler which you need to have installed in your development environment.

For example, on MacOS we used `XCode`, on Windows the `Desktop development with C++` module inside Visual Studio and on Ubuntu the `gcc` GNU Compiler Collection.

Install/unzip IBM MQ client

## Mac

[IBM MQ MacOS toolkit for developers download](https://public.dhe.ibm.com/ibmdl/export/pub/software/websphere/messaging/mqdev/mactoolkit/)

Add
`/opt/mqm/bin` and
`/opt/mqm/samp/bin`, to the PATH by editing `/etc/paths`

`export DYLD_LIBRARY_PATH=/opt/mqm/lib64`

## Windows

[Windows MQ client v 9.1.1.0 download](https://www-945.ibm.com/support/fixcentral/swg/selectFixes?parent=ibm~WebSphere&product=ibm/WebSphere/WebSphere+MQ&release=9.1.1&platform=Windows+64-bit,+x86&function=fixId&fixids=9.1.1.0-IBM-MQC-Win64+&useReleaseAsTarget=true&includeSupersedes=0)



## Linux

[Linux Ubuntu MQ client v 9.1.1.0 download](https://www-945.ibm.com/support/fixcentral/swg/selectFixes?parent=ibm~WebSphere&product=ibm/WebSphere/WebSphere+MQ&release=9.1.1&platform=Linux+64-bit,x86_64&function=fixId&fixids=9.1.1.0-IBM-MQC-UbuntuLinuxX64+&useReleaseAsTarget=true&includeSupersedes=0)



## Run samples

To run the examples cd to the Python directory, and install the prerequsites by running :

`pip install pymqi`

### Put / Get
`python basicput.py`

and

`python basicget.py`

### Publish / Subscribe
`python basicpublish.py`

and

`python basicsubscribe.py`

### Request / Response

`python basicrequest.py`

and

`python basicresponse.py`

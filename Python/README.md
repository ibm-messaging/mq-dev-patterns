# IBM MQ Python samples
The python samples are based on https://dsuch.github.io/pymqi/
and have been tested with python 2.7.10, 3.5.1, 3.11.9 and 3.12.5

Python PyMQI library uses the IBM MQ C client libraries through the MQI interface.

The library needs to be compiled with a C compiler which you need to have installed in your development environment.

For example, on MacOS we used `XCode`, on Windows the `Desktop development with C++` module inside Visual Studio and on Ubuntu the `gcc` GNU Compiler Collection.

Install/unzip IBM MQ client

## Mac

[IBM MQ MacOS toolkit for developers download](https://public.dhe.ibm.com/ibmdl/export/pub/software/websphere/messaging/mqdev/mactoolkit/)

Add
`/opt/mqm/bin` and
`/opt/mqm/samp/bin`, to the PATH by editing `/etc/paths`

execute the following command:
`export DYLD_LIBRARY_PATH=/opt/mqm/lib64`

## Windows

[Windows MQ client v 9.4.0.0 download](https://www.ibm.com/support/fixcentral/swg/downloadFixes?parent=ibm%7EWebSphere&product=ibm/WebSphere/WebSphere+MQ&release=9.4.0.0&platform=Windows+64-bit,+x86&function=fixId&fixids=9.4.0.0-IBM-MQC-Win64&includeRequisites=1&includeSupersedes=0&downloadMethod=http)

For installation instructions, please visit the IBM Documentation: https://www.ibm.com/docs/en/ibm-mq/9.4?topic=windows-installing-mq-client

## Linux Ubuntu

[Linux MQ redist client download](https://public.dhe.ibm.com/ibmdl/export/pub/software/websphere/messaging/mqdev/redist/)

For installation instructions please go to 
#### [linux installation](installationDocs/linuxUbuntu-installationSteps.md)


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

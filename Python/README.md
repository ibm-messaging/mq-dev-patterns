# IBM MQ Python samples
These Python samples are based on https://github.com/ibm-messaging/mq-mqi-python which 
needs a minimum level of Python 3.9.

The Python `ibmmq` library uses the IBM MQ C client libraries through the MQI interface.

The library needs to be compiled with a C compiler which you need to have installed in your development environment.
For example, on MacOS we used `XCode`, on Windows the `Desktop development with C++` module inside Visual Studio and on Ubuntu the `gcc` GNU Compiler Collection.

The samples use the same configuration file as other language samples in this repository.

## Client and SDK installation
### Mac

[IBM MQ MacOS toolkit for developers download](https://public.dhe.ibm.com/ibmdl/export/pub/software/websphere/messaging/mqdev/mactoolkit/)

Add
`/opt/mqm/bin` and
`/opt/mqm/samp/bin`, to the PATH by editing `/etc/paths`

and execute the following command:
`export DYLD_LIBRARY_PATH=/opt/mqm/lib64`

### Windows

[Windows MQ redist client download](https://public.dhe.ibm.com/ibmdl/export/pub/software/websphere/messaging/mqdev/redist/)

### Linux

[Linux MQ redist client download](https://public.dhe.ibm.com/ibmdl/export/pub/software/websphere/messaging/mqdev/redist/)

For installation instructions please go to
#### [linux installation](../../mq-dev-patterns/installationDocs/linuxUbuntu-installationSteps.md)

## Run samples
To run the examples cd to the Python directory, and install the prerequsites by running:

`pip install ibmmq`

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

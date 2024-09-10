# Steps to install the MQ redist Client on Linux Ubuntu

## Create directory for MQ installation
Creating a directory and setting permissions:

`mkdir -p /opt/mqm && chmod a+rx /opt/mqm`
`cd /opt/mqm`

## Installating the MQ redist Client
Setting the version and architecture variable:

default to MQ v 9.4.0.0 and architecure X64

`mqVersion="9.4.0.0"`
`platformArch="X64"`

Install the MQ client from the Redistributable package:

`curl -LO https://public.dhe.ibm.com/ibmdl/export/pub/software/websphere/messaging/mqdev/redist/$mqVersion-IBM-MQC-Redist-Linux$platformArch.tar.gz`
`tar -zxf ./*.tar.gz`
`rm -f ./*.tar.gz`

## Setting environment variables
Add
`/opt/mqm/bin` and
`/opt/mqm/samp/bin`, to the PATH by editing `/etc/environment`

execute the following command:
`export LD_LIBRARY_PATH=/opt/mqm/lib64`

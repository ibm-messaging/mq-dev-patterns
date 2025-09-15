# IBM MQ Python samples
These samples use a Python library for the MQI to demonstrate basic messaging operations.

The Python `ibmmq` library uses the IBM MQ C client libraries through the MQI interface.

The Python library needs to be compiled with a C compiler which you need to have installed in your development
environment. For example, on MacOS we used `XCode`, on Windows the `Desktop development with C++` module inside Visual
Studio and on Ubuntu the `gcc` GNU Compiler Collection.

The samples use the same configuration file as other language samples in this repository.

## Client and SDK installation
### MacOS
Follow Step 1 from [this page](https://developer.ibm.com/tutorials/mq-macos-dev/) to install the SDK using brew. None of
the other steps on that page are required in order to run these Python samples.

Alternatively you can download the IBM MQ MacOS toolkit from
[here](https://public.dhe.ibm.com/ibmdl/export/pub/software/websphere/messaging/mqdev/mactoolkit/)

### Windows
The MQ Redistributable Client for Windows can be downloaded from
[here](https://public.dhe.ibm.com/ibmdl/export/pub/software/websphere/messaging/mqdev/redist/)

### Linux
The MQ Redistributed Client for Linux x64 can be downloaded from
[here](https://public.dhe.ibm.com/ibmdl/export/pub/software/websphere/messaging/mqdev/redist/)

For other platforms, you can use the regular MQ iamges to install, at minimum, the MQ Client and SDK components.

## IBM MQ Python package installation
You may like to work inside a Python virtual environment. If so, create and initialise that in the usual ways.
For example:

```
python -m venv my_venv
. my_venv/bin/activate
```

Then install the prerequsite package by running: `pip install ibmmq`.

## Sample Configuration
All of the programs read a JSON-formatted configuration file. The name of the file can be given by setting the
`JSON_CONFIG` environment variable. If that is not set, the _env.json_ file from the parent directory is used. Edit the
configuration to match the configuration of the queue manager you are going to work with.

## Running the programs
There are no parameters to any of the programs.

You might need to run `setmqenv` to create environment variables pointing at your MQ installation libraries.

On MacOS, the `DYLD_LIBRARY_PATH` will usually need to be set to include the `/opt/mqm/lib64` directory:

`export DYLD_LIBRARY_PATH=/opt/mqm/lib64`

If you are on Linux, you might need set the `LD_LIBRARY_PATH` to include the `/opt/mqm/lib64` directory:

`export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/opt/mqm/lib64`

See [here](https://www.ibm.com/docs/en/ibm-mq/latest?topic=reference-setmqenv-set-mq-environment) for
more information about `setmqenv`.

On some systems, you might need to explicitly use the `python3` command instead of `python`.

### Put/Get
The `basicput` application places a short string message onto the queue.

`python ./basicput`

The `basicget` application reads all messages from the queue and displays the contents.

`python ./basicget`

### Publish/Subscribe
Run these samples as a pair.

Start the `basicsubcribe` program in one window (or in the background) and immediately afterwards start the
`basicpublish` program in another window.

`python ./basicsubscribe`

`python ./basicpublish`

### Request/Response
Run these samples as a pair.

Start the `basicresponse` program in one window (or in the background) and immediately afterwards start the
`basicrequest` program in another window.

`python ./basicresponse`

`python ./basicrequest`
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

This project uses [uv](https://docs.astral.sh/uv/) for fast, reproducible dependency management.
Install `uv` once (if you don't already have it):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Then, from the `Python/` directory, sync all dependencies (creates `.venv` automatically):

```bash
cd Python
uv sync
```

To add or upgrade a package (e.g. after a new `ibmmq` release):

```bash
uv sync --upgrade
```

If you prefer a plain venv workflow, you can still do:

```bash
python -m venv my_venv
. my_venv/bin/activate
pip install ibmmq
```

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

```bash
uv run python basicput.py
```

The `basicget` application reads all messages from the queue and displays the contents.

```bash
uv run python basicget.py
```

### Publish/Subscribe
Run these samples as a pair.

Start the `basicsubscribe` program in one window (or in the background) and immediately afterwards start the
`basicpublish` program in another window.

```bash
uv run python basicsubscribe.py   # window 1
uv run python basicpublish.py     # window 2
```

### Request/Response
Run these samples as a pair.

Start the `basicresponse` program in one window (or in the background) and immediately afterwards start the
`basicrequest` program in another window.

```bash
uv run python basicresponse.py    # window 1
uv run python basicrequest.py     # window 2
```

## Running the unit tests

The tests require no live IBM MQ broker — the `ibmmq` C extension is fully stubbed.

```bash
cd Python
uv sync --extra dev        # install pytest + pytest-mock into the venv
uv run pytest              # runs tests/ with -v (configured in pyproject.toml)
```
# Tools directory
This directory contains some tools to help with maintenance of the repo.

Scripts in here might require editing for specific tests or for looking at particular directories. But they give a good
starting point.

* checkVer.sh - Looks at many of the configuration files to see where they have outdated MQ prerequisites or
  descriptions. Run with ".." as the parameter.
* linter.sh - Runs some linting operations across Python code. Has hardcoded directories of where to look.

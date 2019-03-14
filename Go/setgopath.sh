if [ $_ == $0 ]
  then 
    echo "set path failed, run the script as . $0"
  else
    export GOPATH=$PWD
fi 

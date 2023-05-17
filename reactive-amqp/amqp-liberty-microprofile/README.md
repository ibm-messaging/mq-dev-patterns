# IBMMQ-Liberty-reactive-messaging


cd ~/app-consumer
mvn liberty:dev

cd ~/app-producer
mvn liberty:dev

curl http://localhost:9080/app-producer/system/producer

#!/bin/bash

topic_name="balances"
partitions=3
replication_factor=2

kafka-topics --create --bootstrap-server localhost:9092 --topic $topic_name --partitions $partitions --replication-factor $replication_factor

echo "Tópico $topic_name criado com sucesso!"

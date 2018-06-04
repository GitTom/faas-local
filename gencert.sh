#!/bin/bash
# 2018-05-15
echo "Generate key and certificate for HTTPS server"

# http://stackoverflow.com/questions/5998694/how-to-create-an-https-server-in-node-js/
# https://stackoverflow.com/questions/34835859/node-js-https-example-error-unknown-ssl-protocol-error-in-connection-to-localh/35053638#35053638
openssl genrsa -out serve-pkey.pem 2048
openssl req -new -key serve-pkey.pem -out client.csr
openssl x509 -req -in client.csr -signkey serve-pkey.pem -out serve-cert509.cer

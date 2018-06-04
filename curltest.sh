#!/bin/bash
# 2018-05-17 TMM
# Bash script uses curl to send some test requests to my faas-local module.
# https://gist.github.com/subfuzion/08c5d85437d5d4f00e58
# https://superuser.com/questions/149329/what-is-the-curl-command-line-syntax-to-do-a-post-request

# To test: (-k = ignore security issues; --data makes it a post)
# https://curl.haxx.se/docs/manpage.html
# curl -k --data '{ "blah" : "inblah" }' http://localhost:8080/wc3x
# curl -k https://wwiz3-tombit.c9users.io:8081/wc3x

# curl -H "Accept: application/json" -H "Content-type: application/json; charset=UTF-8" -X POST -d @./order/addOrder.json https://wwiz3-tombit.c9users.io:8081/
# curl -v -H "Accept: application/json" -H "Content-type: application/json; charset=UTF-8" POST --data '{ "blah" : "inblah" }' https://wwiz3-tombit.c9users.io:8081/
# Looks like -X POST or --data will cause post.
# ECONNRESET: Request could not be proxied!


EIP="$(curl -s ipinfo.io/ip)"
PORT=8080

echo 'My external IP is' $EIP
echo 'POST data to port' $PORT

# Load sample event
# https://stackoverflow.com/questions/7427262/how-to-read-a-file-into-a-variable-in-shell

# EVENT=$(<eventSample.json)

#curl -k --data-urlencode @eventSample.json http://$EIP:$PORT/wc3x
echo Send sample request...
curl -k --data @eventSample.json http://$EIP:$PORT/wc3x

sleep 2

echo Send again...
curl -k --data @eventSample.json http://$EIP:$PORT/wc3x

# 2018-05-18 this seems to work for http.
# curl -v -H "Accept: application/json" -H "Content-type: application/json; charset=UTF-8" POST --data '{ "blah" : "inblah" }' https://34.232.53.1:8081/wc3x

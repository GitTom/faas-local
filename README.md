# FaaS-Local
FaaS-Local is a basic implementation of a Lambda (Function as a Service) container & runner for nodejs functions -
suitable for local testing. 

Looking at other similar packages now I see that the distinguishing features of this one are:
- For each request it receives it either forks (childprocess.fork) a new node environment
or reuses one created when handling a previous request.  I feel this best reproduces the FaaS services it emulates.
- It has an optional HTTP server (using node's built-in http module) that can receive invocations as HTTP posts
(the same way GCP's Function service allows) and feed them to the runtime.

Note that I've titled this 'FaaS-Local' but the package and binary name are all lower-case. 
(I'm sticking with the term 'FaaS', rather then the much more common 'Lambda' because all but AWS use the term Function
rather then Lambda).  One of the great things about nodejs FaaS services is that they are available on 
all the major cloud services providers with only very minor changes need for portability.  

## Install

```bash  
npm install -g faas-local  
```

## Usage

As a command line tool

```bash
cd [dir of your node package]
faas-local run 
faas-local run -e [event file]  
```

[event file] is a json text file with an event/request to be submitted to your function; 
if one is not specified it will use the default event provided in 'eventSample.json'.

```bash
faas-local serve
```

## Compatibility

I had this working on Linux (c9.io which was Ubuntu, and then AWS C9) and on Windows 10,
but haven't tested more recent versions on Windows.

I've used it with Node 4, 6, and 8 as AWS Lambda has advanced its support.  It is currently
only being tested with Node v8.10.x.


## Implementation Overview

The flow of control thru the files...

faas-local -->  
server.js (if 'serve' command specified) -->  
http_handler.js -->  
lamwrap.js --(childprocess.fork)-->   
lamfork_child.js  -->  
  User's Lambda entry point

## ToDo

#### Parameterize the http server

It's currently hardcoded for my use cases.

#### Replace moment.js

New generation of alternatives (much smaller)...  
luxon, date-fns, or dayjs


## Alternatives/Similar projects (2018)
I created most of this in 2016, updating it for publishing in 2018-05
(meant to fix this up for publication a long time ago, but got lazy).
Now, in the process of finally doing it I see that there are now at least 3 popular 
projects (I had used node-lambda but was not aware of the others) that include core functionality similar to this package,
but which have benefitted from being open source for a long time so they are more developed and much better tested.

But these don't fork a child process (ie. for each lambda instance).  Not sure why - isn't that the most suitable method?

#### Node Lambda
https://github.com/motdotla/node-lambda  
I've been using this for uploading my lambda to AWS.

#### Lambda Wrapper
https://www.npmjs.com/package/lambda-wrapper (16 *, 3000/w)  
https://github.com/nordcloud/lambda-wrapper

#### Lambda Local
https://github.com/ashiina/lambda-local (400 *, 2800/w)  
https://www.npmjs.com/package/lambda-local 

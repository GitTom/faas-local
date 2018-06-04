// https_server.js
// (Was originally 'server_c9' since it was tailored to specific quirks of c9 environment - but no more.)
// An HTTPS server (for testing) that passes requests to my lambda container (lamwrap).
// This allows me to handle eg. API gateway or API.AI requests directly on my testbed.
//
// This file listens for HTTP(S) requests.  When it recieves them (in handleRequest) it calls lamwrap with the request.

//#region require
const fs = require('fs');
const path = require("path");
const assert = require('assert');
const http = require('http');
const https = require('https');

const log = require('debug')('server:log');
const error = require('debug')('server:error'); // eslint-disable-line

const moment = require('moment');
// Switch from using moment to luxon, date-fns, or dayjs.

const http_handler = require( './http_handler' );
// I split my HTTP into 2 files - http_handler is the other one.
//#endregion require

// context for user lambda
let context = null;

// -- Server Configuration defaults
// NO - these get overridden below based on environment.
let ALLOW_HTTP = true;
let IP = "0.0.0.0";
// And specifying no IP in https.listen  means any IP, ie. INADDR_ANY, or 0.0.0.0.
let PORT = 8080;
let S_PORT = 8081; // These are numbers (though IP above is a string).


// -- Config for AWS C9
// Relevant aws docs:
// Previewing Running Applications in the AWS Cloud9 Integrated Development Environment (IDE)
// https://docs.aws.amazon.com/cloud9/latest/user-guide/app-preview.html
//
// If I also want to be able to 'preview my app from within the IDE', I need to use:
// 8080, 8081, or 8082 with the IP of 127.0.0.1, localhost, or 0.0.0.0.


// -- Config for C9.io (pre-AWS)

// My C9 endpoints:
// Note process.env.C9_HOSTNAME,
// (see /test/appData.js for the list of all my endpoints)
// https://<workspace>.c9users.io:8080/ (final, 2016-12)
// https://docs.c9.io/docs/run-an-application
// 8080, 8081, and 8082 are the only available ports on a hosted Cloud9 workspace.

if ('linux' === process.platform) {

  // For original c9.io...
  // // ALLOW_HTTP = true;  // was just for non-aws c9
  // // Cloud9: turns out I just listen on HTTP and get both!

  // assert( '0.0.0.0' === IP );
  // assert( '8080' === process.env.PORT );
  // // process.env.PORT is '8080'; c9 also supports 8081 & 8082
  // PORT = 8080;  // These are numbers (though IP above is a string).
  // S_PORT = null;  // 8081;

  // For AWS EC2 (Cloud9)
//  ALLOW_HTTP = false;
//  assert( '0.0.0.0' === IP );
//  S_PORT = 8080; // "Error: listen EACCES" when I tried to use 443 - and IDE said it wants 8080
//  PORT = null;

} else {

  // -- Config for Win10
  assert( 'win32' === process.platform ); // is 'win32' even on x64
  ALLOW_HTTP = false;
  assert( '0.0.0.0' === IP );
  PORT = 8080; // null;
  S_PORT = null; // 8081;

} // -- Config end

const TIMESTAMP_FORMAT = 'HH:mm:ss.SSS';

function handleRequest(request, response) {
  const now = moment().local();
  if (!ALLOW_HTTP) {
    // https://nodejs.org/api/http.html#http_class_http_incomingmessage
    // const util = require('util');
    // log( 'Req=' + util.inspect(request.headers) );
    if ('https' !== request.headers['x-forwarded-proto']) {
      log( `${now.format(TIMESTAMP_FORMAT)} + WARNING - ignoring request - not HTTPS.` );
      return;
    }
  }
  
  http_handler( request, response, context );
}


function init( ctx ) {
  context = ctx;  
}


// -- HTTPS Server
// 2016-12 Can only get HTTPS working internally (testing against localhost as below).

function launch() {
  const now = moment().local();  
  log( 'launch server...' );
  if (S_PORT) {
    // 2017-08-24 Not tried yet (on C9 I follow procedure for HTTP and it does both).
    // For Windows...
    // https://stackoverflow.com/questions/21397809/create-a-trusted-self-signed-ssl-cert-for-localhost-for-use-with-express-node
  
    const httpsOptions = {
      // https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener
      // Old c9.io uses an ALPN certificate for c9users.io.  So we don't need this.
      
      // 2018-05-15 Here's how I generated my cert on AWS C9.
      // https://nodejs.org/api/https.html
      // See the gencert.sh script.

      key: fs.readFileSync( path.resolve(__dirname, 'serve-pkey.pem') ),
      cert: fs.readFileSync( path.resolve(__dirname, 'serve-cert509.cer') ),
    };
    
    const httpsServer = https.createServer( httpsOptions, handleRequest );
    
    // Start the server
    httpsServer.listen( S_PORT, IP, () => {
      // https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback
      // Callback triggered when server is successfully listening.
      log( `UTC ${now.format(TIMESTAMP_FORMAT)} HTTPS Server listening on ${IP} : ${S_PORT}.` );
    });
  }
  
  
  ///-- HTTP Server
  
  if (PORT) {
    
    const httpServer = http.createServer(handleRequest);
    
    // Start the server
    httpServer.listen( PORT, IP, () => {
      // Callback triggered when server is successfully listening.
      log( `UTC ${now.format(TIMESTAMP_FORMAT)} HTTP Server listening on ${IP} : ${S_PORT}.` );
    });
  
  }
}

module.exports = {
  init,
  launch,
};

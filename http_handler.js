// http_handler.js
'use strict';

//#region require
const assert = require('assert');
const log = require('debug')('httpH:log');
const error = require('debug')('httpH:error'); // eslint-disable-line

//const qs = require('querystring');
const moment = require('moment');

const lamforker = require( './lamforker' );

//#endregion require

const TIMESTAMP_FORMAT = 'HH:mm:ss.SSS';

const responses = [];   // outstanding responses

function reqHandler( request, response, context ) {

  const now = moment().local();
  
  // http://stackoverflow.com/questions/15427220/how-to-handle-post-request-in-node-js
  if (request.method === "GET") {
    console.log( now.format(TIMESTAMP_FORMAT) + ' GET hit' );
    // For security, give no response.
    //response.end('It Works!! Path Hit: ' + request.url);
  }
  
  else if (request.method === "POST") {
    log( '' );  // blank log statement - make it easier to visual find new invocation in log file.
    log( '/---- POST hit ' + request.url + ' at t=' + now.format(TIMESTAMP_FORMAT) );
    
    let requestBody = '';
    
    request.on('data', function(data) {
      requestBody += data;
      if (requestBody.length > 1e7) {
        // HTTP 413: Request Entity Too Large
        // Provide no response to client (might be bad guy).
        error('Request Entity Too Large ' + requestBody.length);
      }
    });
    
    request.on('end', function() {
      
      // URL Path suffix
      // Was using this for a littel ad-hoc security but not anymore.
      // Get the request's HTTP URL path and stick it into the context
      // (And can be used to distinguisher the requester)
      // const rupath = request.url.substr(1);  // request path = source signiture
        // The substr(1) is to pass over the '/';

      // requestBody is the stringified object I sent, with quotes escaped depending on how I view it.
      // This querystring stuff was from the sample code - not applicable for me using json.
      // var formData = qs.parse( requestBody );  // this was from 
      let event = null;
      try {
        event = JSON.parse(requestBody);
      } catch( err ) {
        error( 'err parsing requestBody e=' + err );
        log('request body=' + requestBody);
        return;
      }

      // Prepare HTTPS response
      // https://nodejs.org/api/http.html#http_class_http_serverresponse
      // Add response header
      response.setHeader( 'Content-Type', 'application/json' );
      response.statusCode = 200;  // Used when using implicit headers (not calling response.writeHead() explicitly), 
      //response.writeHead( 200, {  });
      
      responses.push( response );

      
      const respmsg = lamforker( event, context );


      const resp = responses.shift();
      assert( resp );
      // we only get 1 message back per invocation (so we can pop and discard corresponding response).

      // Send response
      //response.setHeader( 'Content-Type', 'text/html');
      //response Content-Type set above.
      
      // Actions on Google required this (is probably v2 now).
      resp.setHeader( 'Google-Assistant-API-Version', 'v1');
      
      resp.writeHead( 200 );
      resp.end( respmsg );
      
    });
  }
  else
    log( now.format(TIMESTAMP_FORMAT) + ' Unexpected ', request.method);
}

module.exports = reqHandler;
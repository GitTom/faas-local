// lamforkers.js

//#region require
// const assert = require('assert');
const path = require('path');

const log = require('debug')('lamforker:log');
const error = require('debug')('lamforker:error'); // eslint-disable-line

// const qs = require('querystring');
//#endregion require

let child_proc = null;

function handler( event, context ) {

/*
      // Method 1.
      // Just call lambda directly.
      
      const context = {
        // http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
        callbackWaitsForEmptyEventLoop: true,
        getRemainingTimeInMillis: 999999,
        fail : (err) => {
          // I think err is just a string err message.  Make it into json.
          const resp = '{ "fail" : "' + err + '"}';
            // For some wierd reason, the JSON.parse on the other end needs "fail" to be quoted.
          log( 'Got fail from Lambda =', resp.slice(0,32) + '...' );
          response.end( resp );
          log( 'Response (fail) sent.' );
        },
        succeed : (result) => {
          const lambresp  = JSON.stringify(result);
          log( 'Got response from Lambda =', lambresp.slice(0,32) + '...' );
          // Send response
          //response.setHeader( 'Content-Type', 'text/html');
          response.setHeader( 'Google-Assistant-API-Version', 'v1');
          response.writeHead( 200 );
          //response.write( lambresp );
          response.end( lambresp );
          log( 'Response sent.' );
        },
        // Non-standard, I added these
        //url : request.url
        rupath : rupath
      };

      log( 'Call request handler (lambda) with new event.' );
      require('./src/index').handler( event, context );
  */

  if (child_proc) {
    
    // ADD - Simulate possibility of request going to different Lambda instance.
    // Randomly ignore existing child_proc and launch new anyway.
    // Would need to use a handle to ID the correct resonse, cause in theory the
    // child_proc's could end out-of-order.  Would only ever actually happen if my
    // testing simulates events coming from multiple Alexa users.

    log( 'Child proc already exists.' );
    let success = child_proc.send( [ JSON.stringify(event), JSON.stringify(context) ] );
    if (!success) {
      log( 'Warning - unable to send to child proc.' );
      // Could have exitted just now.
      child_proc = null;
    }

  }  
  
  // Method 2
  // To simulate a lambda env (make each invocation independent), create a nodejs fork:
  // http://stackoverflow.com/questions/18862214/start-another-node-application-using-node-js
  if (!child_proc)  {
    const fork = require('child_process').fork;
    // cwd is /home/ubuntu/workspace
    log( 'Fork new nodejs instance (with new event) to handle request.' );
    const modulePath = path.join( __dirname, 'lamfork_child' );
    child_proc = fork( modulePath, [ JSON.stringify(event), JSON.stringify(context) ], { silent : false } );  
    // When debugging, child attempts to use same debug port as parents which causes err
    // https://github.com/Microsoft/nodejstools/issues/575

    // How about using inspect API for debugging (available in node v >= 8)?
    // https://nodejs.org/en/docs/guides/debugging-getting-started/
    // Would add '--inspect' parameter for new node instance forked here, so only the child processes (not parent)
    // would get debugged.  Would each child need to listen on different port in case they are concurrent?

    child_proc.on( 'message', (message) => {
      log( 'Recieved msg from child process - send back to client.' );
      if (!message)
        error( 'Null response is unexpected.' );
      
      return message;
      
    }); 
    
    child_proc.once( 'exit', () => { 
      // Only synchronous allowed here.  To do more substantial work use 'beforeExit'
      child_proc = null;
      console.log( 'child proc has exited --------------------/' );
      return null;
    } );
  }
  
}


module.exports = handler;

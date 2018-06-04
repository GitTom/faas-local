// lamfork_child.js - Server fork for launching lambda

//#region require
// For some wierd reason, the debug module didn't work right here: it sent everything thru stderr.
// const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

//#endregion require

if (2 > process.argv.length) {
  console.error( 'missing args.');
  process.exit(-1);
}

// agrv[2] is the event
let event = null;
try {
  event = JSON.parse( process.argv[2] );
} catch (ex) {
  console.error(ex);
  process.exit(-1);
}

// argv[3] is the context (optional)
let context = {};
if (3 <= process.argv.length) {
  try {
    context = JSON.parse( process.argv[3] );
  } catch (ex) {
    console.error(ex);
    process.exit(-1);
  }
}

// Load envvars for Lambda (from .env in its path).
let envopts = null;
if (context.fw_lam_path)
  envopts = { path: path.join(context.fw_lam_path, '.env') };
// default path = path.resolve(process.cwd(), '.env')
const result = dotenv.config( envopts ); // load .env file into process env vars.
if (result.error) {
  console.error( 'Failed to load .env with options=', envopts ); 
  console.error( `dotenv err = ${result.error}.` );
} 
// else 'result.parsed' is the contents of the file, parsed.

// The Lambda context parameter
// http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
if (!context.callbackWaitsForEmptyEventLoop)
  context.callbackWaitsForEmptyEventLoop = true;
if (!context.getRemainingTimeInMillis)
  context.getRemainingTimeInMillis = 999999;

// I'm passing this in via the context structure for convenience
let lambdaHandler = context.fw_lam_main;
if (!lambdaHandler) {
  lambdaHandler = './index';  // not even sure this is useful.
  console.log( `Warning - no lambda handler specified.  Try using ${lambdaHandler}.` );
}


// http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html#nodejs-prog-model-handler-callback
// 2017-03-27 With support for Node 6.10, I notice that node-lambda now only supports 'callback' responses,
// so clearly Lambda must have been updated too, so I must switch to using callback instead of context.succeed.
function callback( err, result ) {
  if (err) {
    // I think err is just a string err message.  Make it into json.
    const resp = '{ "fail" : "' + err + '"}';
    // For some wierd reason, the JSON.parse on the other end needs "fail" to be quoted.
    console.log( `Got fail from Lambda = ${resp.slice(0, 32)}...` );
    process.send( resp );
    console.log( 'Response (fail) sent.' );
  } else {
    const lambresp = JSON.stringify(result);
    console.log( `Got response from Lambda (relay it to parent) = ${lambresp.slice(0, 32)}...` );
    // Send response
    // https://nodejs.org/api/process.html#process_process_send_message_sendhandle_options_callback
    // https://nodejs.org/api/child_process.html#child_process_child_send_message_sendhandle_options_callback
    process.send( lambresp );
    // log( 'Response sent.  Now wait to exit.' );
    
    // EXIT CHILD.
    // I find that child exits (event fires in parent) even if I don't call exit().
    // 2018-05-22 **** Now I have to explicitly exit().  I should look into this.
    // https://github.com/nodejs/help/issues/255
    // This has a reference to change in behavior that exit is no longer needed in child processes.
    
    // So, I manually keep this proc alive to simulate Lambda node behavior
    // (allowing container to re-use this instance).
    const timeout = 30 + Math.floor( Math.random() * 100 );
    console.log( `Wait for new request for ${timeout}ms.` );
    // I think timout is the equivelent of 'timeout' in Lambda configuration?
    // That has a default of 60s but I use much smaller value cause I want to simulate possiblity
    // that this instance is busy with request from another client - forcing new instance to be used.
    setTimeout( () => { 
      console.log( 'Allow this child process to exit.'); // if everything else is done.
      process.exit(1); // 2018-05-22 What's going on that I now need to call this in order for this process to exit?
    }, timeout );
  }
}

const userLambdaHandler = require( lambdaHandler ).handler;
// Would be specified by the user with their Lambda config.


// Handle messages for subsequent invocations.
process.on( 'message', (msg) => {
  console.log( 'Recieved msg from parent process - relay it to user Lambda.' );
  const ev = msg[0];
  
  userLambdaHandler( ev, context, callback );
} );


// Pass requestBody (event) and fake context to the Lambda implementation.
try {
  userLambdaHandler( event, context, callback );
} catch (exc) {
  console.error( `Failed to execute user lambda with e= ${exc}.` );
  const resp = '{ "fail" : "' + exc + '"}';
  // For some wierd reason, the JSON.parse on the other end needs "fail" to be quoted.
  process.send( resp );
}

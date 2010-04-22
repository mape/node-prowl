# node-prowl

A module for node.js that allows you to send push notifications to your iPhone through the Prowl API (http://prowl.weks.net/api.php). 

## Example usage:

    var Prowl = require('prowl');
    var prowlApiKey = 'yourApiKey';

    // Send uncaught exceptions to your iPhone.
    process.addListener("uncaughtException", function(exception)
    {
        var notification = new Prowl.connection(prowlApiKey);

        notification.send({
            'application': 'My node.js app',
            'event': 'uncaughtException - '+exception.message,
            'description': exception.stack
        });
    });

## Todo:
* Fix callback with information from Prowl server.
* Fix exceptions for flush and emit on undefined.
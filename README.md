# node-prowl

A module for node.js that allows you to send push notifications to your iPhone through the Prowl API (http://prowl.weks.net/api.php). 

## Example usage:

    var Prowl = require('prowl');
    var prowlApiKey = 'yourApiKey';

    // Send uncaught exceptions to your iPhone.
    var notification = new Prowl.connection(prowlApiKey);
    process.addListener("uncaughtException", function (exception) {
        notification.send({
            'application': 'My node.js app',
            'event': 'uncaughtException - '+exception.message,
            'description': exception.stack
        });
    });
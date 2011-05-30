var Prowl = require('prowl');
var prowlApiKey = 'yourApiKey';
process.addListener('uncaughtException', function(exception) {
	console.log(exception.message)
	console.log(exception.stack)

	/*
	var exceptionNotification = new Prowl.connection(prowlApiKey);

	exceptionNotification.send({
		'application': 'node-prowl Example',
		'event': 'uncaughtException - '+exception.message,
		'description': exception.stack
	});
	*/
});

var notification = new Prowl.connection(prowlApiKey);
notification.send({
	'application': 'node-prowl example' // 256 max -  The name of your application or the application generating the event.
	,'event': 'Test event' // 1024 max - The name of the event or subject of the notification.
	,'description': 'Testing Prowl through node.' // 10000 max -  	A description of the event, generally terse.
	,'priority': 0 /*
		Default value of 0 if not provided. An integer value ranging [-2, 2] representing:
			2. Very Low
			1. Moderate
			0. Normal
			1. High
			2. Emergency
		Emergency priority messages may bypass quiet hours according to the user's iPhone app settings.
	*/
}, function(err, info) {
	if (err) {
		throw err;
	}
	console.log(info);
});

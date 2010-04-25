var sys = require('sys');
var net = require('net');
var qs = require('querystring');

exports.connection = function (apiKey) {
	return new Prowl(apiKey);
};

function Prowl(apiKey) {
	if (!apiKey || apiKey.length !== 40) {
		sys.puts('Must supply a valid Prowl API key');
		return false;
	}
	this.apiKey = apiKey || '';
	this.url = 'prowl.weks.net';
};

Prowl.prototype.send = function (args, callback) {
	var self = this;

	// Verify that a proper API key has been assigned.
	if (!self.apiKey || self.apiKey.length !== 40) {
		sys.puts('Tried to send notification without valid Prowl API key.');
		return false;
	}

	// Setup default values and light validation.
	var options = {
		'application': ''
		,'event': ''
		,'description': ''
		,'priority': 0
	};
	
	for(key in args) {
		options[key] = args[key];
	}
	
	if (!options.application && !options.event && !options.description) {
		sys.puts('Tried to send notification without any information.');
		return false;
	}
	
	options.apikey = this.apiKey;

	// Make sure the messages don't exceed the APIs max length.
	options.application = options.application.substr(0,256);
	options.event = options.event.substr(0,1024);
	options.description = options.description.substr(0,10000);

	var client = net.createConnection (443, self.url);

	client.setEncoding('UTF8');
	client.addListener('connect', function () {
		// Make sure we are able to TLS
		try {
			client.setSecure();
		} catch (e) {
			sys.puts('SSL is not supported in your version of node JS. This is needed for this module to function.');
		}
	});

	// Send the request containing notification data.
	var postData = qs.stringify(options);
	client.addListener('secure', function () {
		client.write('POST /publicapi/add HTTP/1.0\r\n');
		client.write('Host:'+self.url+'\r\n');
		client.write('User-Agent: node-prowl\r\n');
		client.write('Content-Type: application/x-www-form-urlencoded\r\n');
		client.write('Content-Length:'+ postData.length+'\r\n');
		client.write('\r\n');
		client.write(postData+'\r\n');
		client.write('\r\n');
	});

	client.addListener('data', function (chunk) {
		if (typeof chunk === 'string' && chunk.indexOf('?xml') !== -1) {
			self.handleResponce(chunk, function (chunk) {
				if (callback) {
					callback(chunk);
				}
			});
		}
	});
};

Prowl.prototype.handleResponce = function (body, callback) {
	var repsonceRaw = body.match(/([a-z]+)="([^"]+)"/g);
	var repsonce = {};
	
	for (key in repsonceRaw) {
		var splitValues = repsonceRaw[key].split('=');

		var key = splitValues[0];
		var value = splitValues[1].replace(/"/g, '');

		if (key !== 'version' && key !== 'encoding') {
			repsonce[splitValues[0]] = isNaN(value) ? value : parseInt(value, 10);
		}
	}

	if (repsonce['code'] !== 200) {
		repsonce['error'] = this.handleError(repsonce['code']);
	}

	callback(repsonce);
};

Prowl.prototype.handleError = function (errorCode) {
	var errorMessages = {
		400: 'Bad request, the parameters you provided did not validate, see ERRORMESSAGE.',
		401: 'Not authorized, the API key given is not valid, and does not correspond to a user.',
		405: 'Method not allowed, you attempted to use a non-SSL connection to Prowl.',
		406: 'Not acceptable, your IP address has exceeded the API limit.',
		500: 'Internal server error, something failed to execute properly on the Prowl side.'
	};

	return errorMessages[errorCode] || 'Unknown message';
};
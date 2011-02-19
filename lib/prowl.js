var qs = require('querystring');
var https = require('https');

exports.connection = function (apiKey) {
	return new Prowl(apiKey);
};

function Prowl(apiKey) {
	if (!apiKey || apiKey.length !== 40) {
		throw new Error('Must supply a valid Prowl API key');
		return;
	}
	this.apiKey = apiKey || '';
	this.url = 'prowl.weks.net';
};

Prowl.prototype.send = function (args, callback) {
	var self = this;

	// Verify that a proper API key has been assigned.
	if (!self.apiKey || self.apiKey.length !== 40) {
		callback(new Error('Tried to send notification without valid Prowl API key.'), null);
		return;
	}

	// Setup default values and light validation.
	var options = {
		'application': ''
		,'event': ''
		,'description': ''
		,'priority': 0
	};

	Object.keys(args).forEach(function(key) {
		options[key] = args[key];
	});

	if (!options.application && !options.event && !options.description) {
		callback(new Error('Tried to send notification without any information.'), null);
		return;
	}

	options.apikey = this.apiKey;

	// Make sure the messages don't exceed the APIs max length.
	options.application = options.application.substr(0,256);
	options.event = options.event.substr(0,1024);
	options.description = options.description.substr(0,10000);

	// Send the request containing notification data.
	var req = https.request({
		'host': self.url
		, 'port': 443
		, 'path': '/publicapi/add'
		, 'method': 'POST'
		, 'headers': {
			'Authorization': 'Basic '+new Buffer(this.username+':'+this.secret).toString('base64')
			, 'Content-Type': 'application/x-www-form-urlencoded'
			, 'User-Agent': 'node-prowl'
		}
	}, function(res) {
    	res.setEncoding('utf8');
		res.on('data', function(chunk) {
			if (typeof chunk === 'string' && chunk.indexOf('?xml') !== -1) {
				self.handleResponse(chunk, function (chunk) {
					if (callback) {
						callback(null, chunk);
					}
				});
			}
		});
	});
	req.write(qs.stringify(options));
	req.end();

	req.on('error', function(e) {
		callback(e, null);
	});
};

Prowl.prototype.handleResponse = function (body, callback) {
	var responseRaw = body.match(/([a-z]+)="([^"]+)"/g);
	var response = {};
	
	for (key in responseRaw) {
		var splitValues = responseRaw[key].split('=');

		var key = splitValues[0];
		var value = splitValues[1].replace(/"/g, '');

		if (key !== 'version' && key !== 'encoding') {
			response[splitValues[0]] = isNaN(value) ? value : parseInt(value, 10);
		}
	}

	if (response['code'] !== 200) {
		response['error'] = this.handleError(response['code']);
	}

	callback(response);
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

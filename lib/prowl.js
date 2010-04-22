var sys = require('sys');
var http = require('http');
var qs = require('querystring');

exports.connection = function(apiKey) {

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

Prowl.prototype.send = function(args, callback) {

	var self = this;

	if (!self.apiKey || self.apiKey.length !== 40) {
		sys.puts('Tried to send notification without valid Prowl API key.');
		return false;
	}

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

	options.application = options.application.substr(0,256);
	options.event = options.event.substr(0,1024);
	options.description = options.description.substr(0,10000);
	
	var client = http.createClient(443, self.url);

	try {
		client.setSecure('','X509_PEM');
	} catch (e) {

		sys.puts('SSL is not supported in your version of node JS. This is needed for this module to function.');
		return false;
	}

	var postData = qs.stringify(options);
	var headers = {
		'Accept': '*/*'
		,'Host': self.url
		,'User-Agent': 'node-prowl'
		,'Content-Type': 'application/x-www-form-urlencoded'
		,'Content-Length': postData.length
	};

	var request = client.request('POST', '/publicapi/add', headers);
	request.write(postData, 'utf8');
	
	request.addListener('response', function (response) {

		response.setEncoding('utf8');
		response.addListener('data', function (chunk) {

			self.handleError(chunk, function(chunk)
			{
				if (callback) {
					callback(chunk);
				}
			})
		});
	});
	request.end();	
};

Prowl.prototype.handleError = function getError(body, callback) {

	if (typeof body === 'string' && body.indexOf('error code') === -1) {

		callback(body);
	} else {

		var error = body.match(/.*code="([^"]+)">([^<]+)/);
		var errorMessage = 'Error '+error[1]+': '+error[2];
		sys.log(errorMessage);

		callback(false);
	}
}
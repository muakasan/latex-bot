/*
http://stackoverflow.com/questions/2561702/how-to-fit-the-paper-size-to-the-content-in-latex
http://tex.stackexchange.com/questions/184537/bad-math-environment-delimiter-in-standalone-class
http://stackoverflow.com/questions/6605006/convert-pdf-to-image-with-high-resolution
http://stackoverflow.com/questions/3482901/is-it-possible-to-compile-a-latex-document-via-node-js
*/
require('dotenv').config();

var login = require("facebook-chat-api");
var fs = require('fs');
var Mustache = require('mustache');
var sys = require('sys');
var spawn = require('child_process').spawn; 
var async = require('async');

login({email: process.env.FB_EMAIL, password: process.env.FB_PASSWORD}, function callback (err, api) {
    if(err) return console.error(err);

    api.listen(function callback(err, messageRecd) {
		if(messageRecd.body)
		{
			var matches = messageRecd.body.match(/^\$(.*)\$$/);
			if(matches)
			{
				var view = {
					equationText: matches[1]
				};
				fs.readFile("latex.mst", "utf-8", function(err, template) {
					if(err) {
						return console.log(err);
					}
					console.log(Mustache.render(template, view));
					fs.writeFile("temp-files/temp.tex", Mustache.render(template, view), function(err) {
						if(err) {
							return console.log(err);
						}
					});

					var pdflatex = spawn('pdflatex', ['-output-directory', 'temp-files/', 'temp-files/temp.tex']);
					pdflatex.on('exit', function(code) {					
						console.log('pdflatex exited with code ' + code);
						var convert = spawn('convert', ['-density', '300', '-quality', '100', 'temp-files/temp.pdf', 'temp-files/equation.jpg']);
						convert.on('exit', function(code) {
							console.log('convert exited with code ' + code);
							var msgToSend = 	{ body: view.equationText,
												attachment: fs.createReadStream("temp-files/equation.jpg")};
								api.sendMessage(msgToSend, messageRecd.threadID);
						});
					});	
				});	
			}
		}
    });
});


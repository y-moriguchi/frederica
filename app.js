#!/usr/bin/env node
/*
 * Frederica
 *
 * Copyright (c) 2018 Yuichiro MORIGUCHI
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 **/
var fs = require('fs'),
	os = require('os'),
	P = require("./parse-tex.js"),
	F = require("./format-text.js");

function trim(text) {
	var result = text;
	result = text.replace(/^[\s]+/, "");
	result = text.replace(/[\s]+$/, "");
	return result;
}

function replaceText(text, eol, option) {
	var parseTex = P(option);
	return text.replace(/\\\[([^\\]|\\[^\]])*\\\]/g, function(match, body) {
		var ast, out;
		ast = parseTex(trim(match.substring(2, match.length - 2)));
		out = F(ast, option);
		return eol + out.replace("\n", eol) + eol;
	});
}

function usage() {
	console.error("Frederica Ver. 0.0.0");
	console.error("usage: frederica [-o output-file] [--use-multibyte] filename");
}

function parseOption() {
	var argCount = 2,
		result;
	result = {
		multibyte: false
	};
	while(argCount < process.argv.length) {
		if(process.argv[argCount] === "-o") {
			result.output = process.argv[argCount + 1];
			argCount += 2;
		} else if(process.argv[argCount] === "--use-multibyte") {
			result.multibyte = true;
			argCount++;
		} else if(process.argv[argCount].substring(0, 1) === "-") {
			console.error("Unrecognized option: " + process.argv[argCount]);
			process.exit(2);
		} else {
			result.input = process.argv[argCount];
			argCount++;
		}
	}
	if(!result.input) {
		usage();
		process.exit(2);
	}
	return result;
}

function main() {
	var text,
		result,
		option = parseOption();
	try {
		text = fs.readFileSync(option.input, 'utf8');
	} catch(e) {
		console.log("file cannot read");
		process.exit(2);
	}

	try {
		if(option.output) {
			result = replaceText(text, os.EOL, option);
			fs.writeFileSync(option.output, result);
		} else {
			result = replaceText(text, "\n", option);
			console.log(result.replace(/\n$/, ""));
		}
	} catch(e) {
		console.error("Error occurred: " + e.message);
	}
}

main();

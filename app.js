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
	P = require("./parse-tex.js")({ multibyte: false }),
	F = require("./format-text.js");

function trim(text) {
	var result = text;
	result = text.replace(/^[\s]+/, "");
	result = text.replace(/[\s]+$/, "");
	return result;
}

function replaceText(text, eol) {
	return text.replace(/\\\[([^\\]|\\[^\]])*\\\]/g, function(match, body) {
		var ast, out;
		ast = P(trim(match.substring(2, match.length - 2)));
		out = F(ast, { multibyte: false });
		return eol + out.replace("\n", eol) + eol;
	});
}

function usage() {
	console.error("Frederica Ver. 0.0.0");
	console.error("usage: frederica filename");
}

function parseOption() {
	var argCount = 2,
		result = {};
	while(argCount < process.argv.length) {
		if(process.argv[argCount] === "-o") {
			result.output = process.argv[argCount + 1];
			argCount += 2;
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
	if(option.output) {
		result = replaceText(text, os.EOL);
		fs.writeFileSync(option.output, result);
	} else {
		result = replaceText(text, "\n");
		console.log(result.replace(/\n$/, ""));
	}
}

main();

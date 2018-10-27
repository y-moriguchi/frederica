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

function main() {
	var text, result;
	if(process.argv.length < 3) {
		usage();
		process.exit(2);
	}
	try {
		text = fs.readFileSync(process.argv[2], 'utf8');
	} catch(e) {
		console.log("file cannot read");
		process.exit(2);
	}
	result = replaceText(text, "\n");
	//result = replaceText(text, os.EOL);
	console.log(result);
}

main();

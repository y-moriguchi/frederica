/*
 * Frederica
 *
 * Copyright (c) 2018 Yuichiro MORIGUCHI
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 **/
var P = require("./parse-tex.js"),
	F = require("./format-text.js");

function getFormatter(option) {
	var parseTex = P(option);
	return function(text) {
		var ast, out;
		ast = parseTex(text);
		out = F(ast, option);
		return out;
	}
}

module.exports = {
	getFormatter: getFormatter
};

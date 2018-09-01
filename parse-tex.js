/*
 * Frederica
 *
 * Copyright (c) 2018 Yuichiro MORIGUCHI
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 **/
var R = require("rena-js").clone();
R.ignoreDefault(/[ \t\n]+/);

var ptnExprList = R.Yn(
	function(ptnExprList, ptnExpr) {
		return R.then(R.attr([]).thenOneOrMore(ptnExpr, function(x, b, a) { return a.concat(b); }))
			.action(function(a) { return { type: "exprlist", items: a }; });
	}, function(ptnExprList, ptnExpr) {
		var funcs = [
			"sin", "cos", "tan", "csc", "sec", "cot", "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh",
			"log", "ln", "exp"
		];
		var sequencesSimple = {
			"\\infty": "oo",
			"\\to": "->"
		};
		var sequencesOp = {
			"+-": "+-",
			"-+": "-+"
		};
		function generateFuncs(funcs) {
			var i,
				ptnf = [];
			for(i = 0; i < funcs.length; i++) {
				(function(f) {
					ptnf.push(R.then("\\" + f, function(x, b, a) { return { type: "func", item: f }}));
				})(funcs[i]);
			}
			return R.or.apply(null, ptnf);
		}
		function generateSeqs(seqs, type) {
			var i,
				ptnf = [];
			for(i in seqs) {
				if(seqs.hasOwnProperty(i)) {
					(function(f) {
						ptnf.push(R.then(f, function(x, b, a) { return { type: type, item: seqs[f] }}));
					})(i);
				}
			}
			return R.or.apply(null, ptnf);
		}
		var ptnFrac = R.then("\\frac")
			.then("{")
			.then(ptnExprList)
			.then("}")
			.then("{")
			.then(ptnExprList, function(x, b, a) { return { type: "frac", numerator: a, denominator: b }; })
			.then("}");
		var ptnRoot = R.then("\\sqrt")
			.then("{")
			.then(ptnExprList, function(x, b, a) { return { type: "root", body: b }; })
			.then("}");
		var ptnSimple = R.or(
			R.then(/[a-zA-Z0-9]/, function(x, b, a) { return { type: "simple", item: x }; }),
			R.then(/[\-\+]/, function(x, b, a) { return { type: "op", item: x }; }),
			R.then(/[\(\)\[\]=]/, function(x, b, a) { return { type: "simple", item: x }; }));
		var ptnBlock = R.then("{").then(ptnExprList).then("}");
		var ptnSup = R.then("^").then(ptnExpr, function(x, b, a) { return { type: "sup", sup: b }; });
		var ptnSub = R.then("_").then(ptnExpr, function(x, b, a) { return { type: "sub", sub: b }; });
		var ptnSupSub = R.then("^")
			.then(ptnExpr)
			.then("_")
			.then(ptnExpr, function(x, b, a) { return { type: "supsub", sup: a, sub: b }; });
		var ptnSubSup = R.then("_")
			.then(ptnExpr)
			.then("^")
			.then(ptnExpr, function(x, b, a) { return { type: "supsub", sup: b, sub: a }; });
		var ptnSum = R.then("\\sum").attr({}).then(R.maybe(R.or(ptnSupSub, ptnSubSup, ptnSup, ptnSub))).action(function(a) {
			return { type: "sum", sup: a.sup, sub: a.sub };
		});
		var ptnInt = R.then("\\int").attr({}).then(R.maybe(R.or(ptnSupSub, ptnSubSup, ptnSup, ptnSub))).action(function(a) {
			return { type: "int", sup: a.sup, sub: a.sub };
		});
		var ptnLim = R.then("\\lim").attr({}).then(R.maybe(ptnSub)).action(function(a) {
			return { type: "lim", sub: a.sub };
		});
		return R.or(
			generateSeqs(sequencesSimple, "simple"),
			generateSeqs(sequencesOp, "op"),
			ptnSimple,
			ptnBlock,
			ptnSupSub,
			ptnSubSup,
			ptnSup,
			ptnSub,
			ptnFrac,
			ptnRoot,
			ptnSum,
			ptnInt,
			ptnLim,
			generateFuncs(funcs)
		);
	}
);

function parseTeX(input) {
	var result = ptnExprList.parse(input);
	if(result) {
		return result.attribute;
	} else {
		throw new Error("TeX format syntax error or unsupported");
	}
}

module.exports = parseTeX;

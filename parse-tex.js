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

function generatePtnExpr(bracket) {
	return function (ptnExprList, ptnExpr, ptnExprListWithoutBracket, ptnExprWithoutBracket) {
		var funcs = [
			"sin", "cos", "tan", "csc", "sec", "cot", "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh",
			"log", "ln", "exp"
		];
		var sequencesSimple = {
			"\\infty": "oo",
			"\\to": "->"
		};
		var sequencesOp = {
			"\\pm": "+-",
			"\\mp": "-+",
			"\\cdot": "."
		};
		var matrixChar = {
			"(": { leftUp: "/", leftDown: "\\" },
			"[": { leftUp: "-", leftDown: "-" },
			"\\{": { leftUp: "/", leftDown: "\\", bracket: true }
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
		var ptnRoot = R.attr(null)
			.then("\\sqrt")
			.then(R.maybe(R.then("[").then(ptnExprListWithoutBracket).then("]")))
			.then("{")
			.then(ptnExprList, function(x, b, a) { return { type: "root", body: b, nth: a }; })
			.then("}");
		var ptnSimple = R.or(
			R.then(/[a-zA-Z0-9]/, function(x, b, a) { return { type: "simple", item: x }; }),
			R.then(/[\-\+]/, function(x, b, a) { return { type: "op", item: x }; }),
			R.then(bracket, function(x, b, a) { return { type: "simple", item: x }; }));
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
		var ptnMatrixBody = R.then("\\begin").then("{").then("array").then("}").then("{").then(/[lcr]+/).then("}")
			.then(R.delimit(
				R.delimit(ptnExprList, "&", function(x, b, a) { return a.concat([b]); }, []),
				"\\\\", function(x, b, a) { return a.concat([b]); }, []))
			.then("\\end").then("{").then("array").then("}");
		var ptnMatrix = R.then("\\left").then(/[\(\[]|\\{/, function(x, b, a) { return matrixChar[x]; })
			.then(ptnMatrixBody, function(x, b, a) { return { body: b, leftUp: a.leftUp, leftDown: a.leftDown, bracket: a.bracket }; })
			.then("\\right")
			.then(/[\]\)\.]/, function(x, b, a) {
				return { type: "matrix", body: a.body, leftUp: a.leftUp, leftDown: a.leftDown, bracket: a.bracket, right: x };
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
			ptnMatrix,
			generateFuncs(funcs)
		);
	};
}

var ptnExprList = R.Yn(
	function(ptnExprList, ptnExpr, ptnExprListWithoutBracket, ptnExprWithoutBracket) {
		return R.then(R.attr([]).thenOneOrMore(ptnExpr, function(x, b, a) { return a.concat(b); }))
			.action(function(a) { return { type: "exprlist", items: a }; });
	},
	generatePtnExpr(/[\(\)\[\]=]/),
	function(ptnExprList, ptnExpr, ptnExprListWithoutBracket, ptnExprWithoutBracket) {
		return R.then(R.attr([]).thenOneOrMore(ptnExprWithoutBracket, function(x, b, a) { return a.concat(b); }))
			.action(function(a) { return { type: "exprlist", items: a }; });
	},
	generatePtnExpr(/[\(\)=]/)
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

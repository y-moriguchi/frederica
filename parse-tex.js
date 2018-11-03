/*
 * Frederica
 *
 * Copyright (c) 2018 Yuichiro MORIGUCHI
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 **/
var R = require("rena-js").clone(),
	common = require("./common");
R.ignoreDefault(/[ \t\n]+/);

function createLaTeXParser(option) {
	var opt = option ? option : {};
	function generatePtnExpr() {
		return function (ptnExprList, ptnExpr, ptnExprListWithoutBracket, ptnExprWithoutBracket) {
			var trifuncs = [ "sinh", "cosh", "tanh", "sin", "cos", "tan", "csc", "sec", "cot" ];
			var funcs = [ "arcsin", "arccos", "arctan", "log", "ln", "exp" ];
			var sequencesSimple = {
				"\\,": " ",
				"\\ ": " ",
				"\\infty": "oo",
				"\\to": "->",
				"\\leftarrow": "<-",
				"\\Leftarrow": "<=",
				"\\longleftarrow": "<--",
				"\\Longleftarrow": "<==",
				"\\Rightarrow": "=>",
				"\\longrightarrow": "-->",
				"\\Longrightarrow": "==>",
				"\\leftrightarrow": "<->",
				"\\Leftrightarrow": "<=>",
				"\\longleftrightarrow": "<-->",
				"\\Longleftrightarrow": "<==>",
				"\\models": "|=",
				"\\mapsto": "|->",
				"\\cdots": "..."
			};
			var sequencesOp = {
				"\\pm": "+-",
				"\\mp": "-+",
				"\\cdot": ".",
				"\\times": "*",
				"\\neq": "=/=",
				"\\perp": "_|_",
				"\\lt": "<",
				"\\gt": ">",
				"\\leq": "=<",
				"\\geq": ">=",
				"\\ll": ">>",
				"\\lll": ">>>",
				"\\gg": "<<",
				"\\ggg": "<<<",
				"\\vdash": "|-",
				"\\dashv": "-|",
				"\\sim": "~",
				"\\lesssim": "~<",
				"\\gtrsim": ">~",
				"\\parallel": "||"
			};
			var matrixChar = {
				"(": { leftUp: "/", leftDown: "\\" },
				"[": { leftUp: "-", leftDown: "-" },
				"\\{": { leftUp: "/", leftDown: "\\", bracket: true }
			};
			var accents = {
				"hat": "^",
				"check": "v",
				"acute": "'",
				"grave": "`",
				"tilde": "~",
				"bar": "-",
				"vec": "->",
				"dot": "."
			};
			var emphasises = {
				"boldsymbol": { begin: "*", end: "*" },
				"mathbb": { begin: "*|", end: "*" },
				"mathfrak": { begin: "**", end: "*" }
			};
			var mathChars = [
//				'\'': '^\\prime',
//				'"':  '^{\\prime\\prime}',
				['Α', '\\Alpha'],
				['α', '\\alpha'],
				['Β', '\\Beta'],
				['β', '\\beta'],
				['Γ', '\\Gamma'],
				['γ', '\\gamma'],
				['Δ', '\\Delta'],
				['δ', '\\delta'],
				['Ε', '\\Epsilon'],
				['ε', '\\epsilon'],
				['Ζ', '\\Zeta'],
				['ζ', '\\zeta'],
				['Η', '\\Eta'],
				['η', '\\eta'],
				['Θ', '\\Theta'],
				['θ', '\\theta'],
				['Ι', '\\Iota'],
				['ι', '\\iota'],
				['Κ', '\\Kappa'],
				['κ', '\\kappa'],
				['Λ', '\\Lambda'],
				['λ', '\\lambda'],
				['Μ', '\\Mu'],
				['μ', '\\mu'],
				['Ν', '\\Nu'],
				['ν', '\\nu'],
				['Ξ', '\\Xi'],
				['ξ', '\\xi'],
				['Π', '\\Pi'],
				['π', '\\pi'],
				['Ρ', '\\Rho'],
				['ρ', '\\rho'],
				['Σ', '\\Sigma'],
				['σ', '\\sigma'],
				['Τ', '\\Tau'],
				['τ', '\\tau'],
				['Υ', '\\Upsilon'],
				['υ', '\\upsilon'],
				['Φ', '\\Phi'],
				['φ', '\\phi'],
				['Χ', '\\Chi'],
				['χ', '\\chi'],
				['Ψ', '\\Psi'],
				['ψ', '\\psi'],
				['Ω', '\\Omega'],
				['ω', '\\omega'],
//				['°', '^\\circ'],
				['△', '\\triangle'],
				['□', '\\Box'],
				['†', '\\dagger'],
				['‡', '\\ddagger'],
				['★', '\\star'],
				['…', '\\cdots'],
				['～', '\\sim'],
				['\u00ac', '\\lnot'],
				['\u00b1', '\\pm'],
				['\u00d7', '\\times'],
				['\u00f7', '\\div'],
				['\u2200', '\\forall'],
				['\u2202', '\\partial'],
				['\u2203', '\\exists'],
				['\u2205', '\\emptyset'],
				['\u2207', '\\nabla'],
				['\u221e', '\\infty'],
				['\u2208', '\\in'],
				['\u2209', '\\notin'],
				['\u220b', '\\ni'],
				['\u2213', '\\mp'],
				['\u221d', '\\propto'],
				['\u2220', '\\angle'],
				['\u2225', '\\parallel'],
				['\u2226', '\\nparallel'],
				['\u2227', '\\land'],
				['\u2228', '\\lor'],
				['\u2229', '\\cap'],
				['\u222a', '\\cup'],
				['\u2234', '\\therefore'],
				['\u2235', '\\because'],
				['\u2243', '\\simeq'],
				['\u2245', '\\cong'],
				['\u2248', '\\approx'],
				['\u2252', '\\simeq'],
				['\u2260', '\\neq'],
				['\u2261', '\\equiv'],
				['\u2266', '\\leq'],
				['\u2267', '\\geq'],
				['\u226a', '\\ll'],
				['\u226b', '\\gg'],
				['\u2276', '\\lessgtr'],
				['\u2277', '\\gtrless'],
				['\u2282', '\\subset'],
				['\u2283', '\\supset'],
				['\u2286', '\\subseteq'],
				['\u2287', '\\supseteq'],
				['\u228a', '\\subsetneq'],
				['\u228b', '\\supsetneq'],
				['\u2295', '\\oplus'],
				['\u2296', '\\ominus'],
				['\u2297', '\\otimes'],
				['\u22a5', '\\perp'],
				['\u22bf', '\\triangle'],
				['\u22da', '\\lesseqgtr'],
				['\u22db', '\\gtreqless'],
				['\u29bf', '\\odot']
			];
			function generateTrifuncs(funcs) {
				var i,
					ptnf = [];
				for(i = 0; i < funcs.length; i++) {
					(function(f) {
						ptnf.push(R.or(
							R.then("\\" + f).then("^").then(ptnExpr, function(x, b, a) { return { type: "func", item: f, sup: b }}),
							R.then("\\" + f, function(x, b, a) { return { type: "func", item: f }})
						));
					})(funcs[i]);
				}
				return R.or.apply(null, ptnf);
			}
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
			function generateAccents(accents) {
				var i,
					ptnf = [];
				for(i in accents) {
					if(accents.hasOwnProperty(i)) {
						(function(f) {
							ptnf.push(R.then("\\" + f).then("{").then(ptnExprList).then("}").action(function(a) {
								return { type: "accent", body: a, accent: accents[f] }
							}));
						})(i);
					}
				}
				return R.or.apply(null, ptnf);
			}
			function generateEmphasises(emphasises) {
				var i,
					ptnf = [];
				for(i in emphasises) {
					if(emphasises.hasOwnProperty(i)) {
						(function(f) {
							ptnf.push(R.then("\\" + f).then("{").then(ptnExprList).then("}").action(function(a) {
								return { type: "emphasis", body: a, emphasis: emphasises[f] }
							}));
						})(i);
					}
				}
				return R.or.apply(null, ptnf);
			}
			function generateMathChars(mathChars) {
				var i,
					ptnf = [];
				for(i = 0; i < mathChars.length; i++) {
					(function(f) {
						ptnf.push(R.then(mathChars[f][1]).action(function(a) { return { type: "simple", item: mathChars[f][0] }; }));
					})(i);
				}
				return R.or.apply(null, ptnf);
			}
			function generateParenCommand(left, right) {
				return R.then(left)
					.then(/[\(\[\.]|\\{/, function(x, b, a) { return x; })
					.then(ptnExprList, function(x, b, a) { return { left: a, expr: b }; })
					.then(right)
					.then(/[\)\]\.]|\\}/, parenAction);
			}
			function parenAction(x, b, a) {
				var items = [];
				if(a.left === "\\{") {
					items.push({ type: "simple", item: "{" });
				} else if(a.left !== ".") {
					items.push({ type: "simple", item: a.left });
				}
				items.push(a.expr);
				if(x === "\\}") {
					items.push({ type: "simple", item: "}" });
				} else if(x !== ".") {
					items.push({ type: "simple", item: x });
				}
				return {
					type: "exprlist",
					items: items
				};
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
				.then(R.maybe(R.then("[").then(ptnExprList).then("]")))
				.then("{")
				.then(ptnExprList, function(x, b, a) { return { type: "root", body: b, nth: a }; })
				.then("}");
			var ptnSimple = R.or(
				R.then(/[a-zA-Z0-9]/, function(x, b, a) { return { type: "simple", item: x }; }),
				R.then(/[\-\+]/, function(x, b, a) { return { type: "op", item: x }; }),
				R.then(/[=]/, function(x, b, a) { return { type: "simple", item: x }; }));
			var ptnBracket = R.then(/[\(\[]|\\{/, function(x, b, a) { return x; })
				.then(ptnExprList, function(x, b, a) { return { left: a, expr: b }; })
				.then(/[\)\]]|\\}/, parenAction);
			var ptnBarBar = R.then("\\bar").then("{").then("\\bar").then("{").then(ptnExprList).then("}").then("}").action(function(a) {
				return { type: "accent", body: a, accent: "=" }
			});
			var ptnMathrm = R.then("\\mathrm")
				.then("{")
				.then(/[^}\n]+/, function(x, b, a) { return { type: "mathrm", item: x }; })
				.then("}");
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
			var ptnProd = R.then("\\prod").attr({}).then(R.maybe(R.or(ptnSupSub, ptnSubSup, ptnSup, ptnSub))).action(function(a) {
				return { type: "prod", sup: a.sup, sub: a.sub };
			});
			var ptnInt = R.then("\\int").attr({}).then(R.maybe(R.or(ptnSupSub, ptnSubSup, ptnSup, ptnSub))).action(function(a) {
				return { type: "int", sup: a.sup, sub: a.sub };
			});
			var ptnOint = R.then("\\oint").attr({}).then(R.maybe(R.or(ptnSupSub, ptnSubSup, ptnSup, ptnSub))).action(function(a) {
				return { type: "oint", sup: a.sup, sub: a.sub };
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
			var ptnBinom = R.then("\\binom")
				.then("{")
				.then(ptnExprList)
				.then("}")
				.then("{")
				.then(ptnExprList, function(x, b, a) { return { type: "binom", n: a, m: b }; })
				.then("}");
			var ptnSpace = R.or(
				R.then("\\!", function(x, b, a) { return { type: "space" } })
			);
			var ptnUnknownCommand = R.then(function(str, index) {
				var regex = /\\[a-zA-Z][a-zA-Z0-9]*/g,
					match;
				regex.lastIndex = 0;
				if(!!(match = regex.exec(str.substr(index))) &&
						match.index === 0 &&
						match[0] !== "\\right" &&
						match[0] !== "\\bigr" &&
						match[0] !== "\\Bigr" &&
						match[0] !== "\\biggr" &&
						match[0] !== "\\Biggr" &&
						match[0] !== "\\end") {
					return {
						match: match[0],
						lastIndex: index + regex.lastIndex,
						extra: match
					};
				} else {
					return null;
				}
			}, function(x, b, a) { return { type: "simple", item: x }; });
			var ptnPrintable = R.then(common.printable, function(x, b, a) { return { type: "simple", item: x }; });
			var patterns = [
				ptnSimple,
				ptnBlock,
				ptnMathrm,
				ptnSupSub,
				ptnSubSup,
				ptnSup,
				ptnSub,
				ptnFrac,
				ptnRoot,
				ptnSum,
				ptnProd,
				ptnInt,
				ptnOint,
				ptnLim,
				ptnMatrix,
				generateParenCommand("\\left", "\\right"),
				generateParenCommand("\\bigl", "\\bigr"),
				generateParenCommand("\\Bigl", "\\Bigr"),
				generateParenCommand("\\biggl", "\\biggr"),
				generateParenCommand("\\Biggl", "\\Biggr"),
				ptnBinom,
				ptnSpace,
				ptnBarBar,
				generateAccents(accents),
				generateEmphasises(emphasises),
				generateTrifuncs(trifuncs),
				generateFuncs(funcs)
			];
			if(opt.multibyte) {
				patterns.push(generateMathChars(mathChars));
			}
			patterns = patterns.concat([
				generateSeqs(sequencesSimple, "simple"),
				generateSeqs(sequencesOp, "op"),
				ptnBracket,
				ptnUnknownCommand,
				ptnPrintable
			]);
			return R.or.apply(null, patterns);
		};
	}
	var ptnExprList = R.Yn(
		function(ptnExprList, ptnExpr, ptnExprListWithoutBracket, ptnExprWithoutBracket) {
			return R.then(R.attr([]).thenZeroOrMore(ptnExpr, function(x, b, a) { return a.concat(b); }))
				.action(function(a) { return { type: "exprlist", items: a }; });
		},
		generatePtnExpr()
	);

	function parseTeX(input) {
		var result = ptnExprList.parse(input);
		if(result) {
			return result.attribute;
		} else {
			throw new Error("TeX format syntax error or unsupported");
		}
	}
	return parseTeX;
}

module.exports = createLaTeXParser;

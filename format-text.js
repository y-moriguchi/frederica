/*
 * Frederica
 *
 * Copyright (c) 2018 Yuichiro MORIGUCHI
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 **/
var common = require("./common");

function createCanvas(x, y, option) {
	var me,
		opt = option ? option : {},
		twoBytes = common.getTwoBytes(opt),
		canvas = [],
		i,
		j;
	for(i = 0; i < y; i++) {
		canvas[i] = [];
		for(j = 0; j < x; j++) {
			canvas[i][j] = " ";
		}
	}
	me = {
		space: function(x, y) {
			canvas[y][x] = " ";
			return me;
		},
		drawText: function(x, y, text) {
			var i,
				ch;
			for(i = 0; i < text.length; i++) {
				ch = text.charAt(i);
				if(opt.multibyte && twoBytes.test(ch)) {
					canvas[y][x + i] = text.charAt(i);
					canvas[y][x + i + 1] = "";
					i++;
				} else {
					canvas[y][x + i] = text.charAt(i);
				}
			}
			return me;
		},
		drawLine: function(x, y, len) {
			var i;
			for(i = x; i < x + len; i++) {
				canvas[y][i] = "-";
			}
			return me;
		},
		toString: function() {
			var i,
				j,
				result = "",
				iResult;
			for(i = 0; i < y; i++) {
				if(i > 0) {
					result += "\n";
				}
				iResult = "";
				for(j = 0; j < x; j++) {
					iResult += canvas[i][j];
				}
				result += iResult.replace(/ +$/, "");
			}
			return result;
		}
	};
	return me;
}

function createFormatTextObject(ast, option) {
	var me,
		condSum,
		comdInt,
		condLim,
		opt = option ? option : {},
		twoBytes = common.getTwoBytes(opt);
	function getLength(item) {
		var i,
			res = 0;
		if(opt.multibyte) {
			for(i = 0; i < item.length; i++) {
				res += twoBytes.test(item.charAt(i)) ? 2 : 1;
			}
			return res;
		} else {
			return item.length;
		}
	}
	function wrapSize(ast, prevSize) {
		return ast ? createFormatTextObject(ast, option).computeSize(prevSize) : {
			x: 0,
			y: 0,
			center: 0
		};
	}
	function wrapFormat(ast) {
		return ast ? createFormatTextObject(ast, option).format : function() {}
	}
	function wrapCreate(ast) {
		return {
			computeSize: function(prevSize) { return wrapSize(ast, prevSize); },
			format: wrapFormat(ast)
		};
	}
	function condSumInt(xsize, ysize, text) {
		return function() {
			var me;
			me = {
				computeSize: function() {
					var sizeSup = wrapSize(ast.sup),
						sizeSub = wrapSize(ast.sub);
					return {
						x: Math.max(sizeSup.x, sizeSub.x) + xsize + 1,
						y: sizeSup.y + sizeSub.y + ysize,
						center: sizeSup.y + Math.floor(ysize / 2)
					};
				},
				format: function(canvas, x, y) {
					var i,
						supFormat = wrapFormat(ast.sup),
						subFormat = wrapFormat(ast.sub),
						supSize = wrapSize(ast.sup);
					supFormat(canvas, x + xsize, y);
					subFormat(canvas, x + xsize, y + supSize.y + ysize);
					for(i = 0; i < ysize; i++) {
						canvas.drawText(x, y + supSize.y + i, text[i]);
					}
				}
			};
			return me;
		};
	}
	function condRoot() {
		var me;
		me = {
			computeSize: function() {
				var sizeBody = wrapSize(ast.body),
					sizeNth = wrapSize(ast.nth);
				return {
					x: Math.max(sizeBody.y, sizeNth.x) + sizeBody.x,
					y: Math.max(sizeBody.y + 1, sizeNth.y + sizeNth.x),
					center: Math.max(sizeBody.center + 1, sizeNth.y + sizeNth.x - sizeBody.center)
				};
			},
			format: function(canvas, x, y) {
				var i,
					sizeThis = me.computeSize(),
					bodyFormat = wrapFormat(ast.body),
					nthFormat = wrapFormat(ast.nth),
					sizeBody = wrapSize(ast.body),
					sizeNth = wrapSize(ast.nth);
				if(ast.nth) {
					nthFormat(canvas, x, y + Math.max(sizeBody.y - sizeBody.x - sizeNth.y, 0));
					bodyFormat(canvas,
						x + Math.max(sizeBody.y, sizeNth.x),
						y + Math.max(1, sizeNth.y + sizeNth.x - sizeBody.y));
					for(i = 0; i < Math.max(sizeBody.y, sizeNth.x); i++) {
						canvas.drawText(x + i, y + sizeThis.y - i - 1, i > 0 ? "/" : "v");
					}
					for(i = 0; i < sizeBody.x; i++) {
						canvas.drawText(
							x + i + Math.max(sizeBody.y, sizeNth.x),
							y + sizeThis.y - Math.max(sizeBody.y, sizeNth.x) - 1, "_");
					}
				} else {
					bodyFormat(canvas, x + sizeBody.y, y + 1);
					for(i = 0; i < sizeBody.y; i++) {
						canvas.drawText(x + i, y + sizeBody.y - i, i > 0 ? "/" : "v");
					}
					for(i = 0; i < sizeBody.x; i++) {
						canvas.drawText(x + i + sizeBody.y, y, "_");
					}
				}
			}
		};
		return me;
	}
	function condMatrix() {
		var me;
		me = {
			computeSize: function() {
				var i,
					j,
					cSize,
					jSize = null,
					xMax = 0,
					xCount,
					ySize = 0,
					yCount = 0;
				for(i = 0; i < ast.body.length; i++) {
					if(jSize === null) {
						jSize = ast.body[i].length;
					} else if(jSize !== ast.body[i].length) {
						throw new Error("invalid matrix");
					}
					xCount = yCount = 0;
					for(j = 0; j < ast.body[i].length; j++) {
						cSize = wrapSize(ast.body[i][j]);
						xCount += cSize.x + (j > 0 ? 2 : 0);
						yCount = Math.max(cSize.y, yCount);
					}
					xMax = Math.max(xMax, xCount);
					ySize += yCount + (i > 0 ? 1 : 0);
				}
				xMax += ast.right === "" ? 2 : 4;
				return {
					x: xMax + 2,
					y: ySize + 2,
					center: Math.floor((ySize + 2) / 2)
				}
			},
			format: function(canvas, x, y) {
				var i,
					j,
					allSize = me.computeSize(),
					cRender = [],
					cSize = [],
					xMax = [],
					xMaxSum = [],
					yCenter = [],
					yMax = [],
					yMaxSum = [];
				for(i = 0; i < ast.body.length; i++) {
					cRender[i] = [];
					cSize[i] = [];
					for(j = 0; j < ast.body[i].length; j++) {
						cRender[i][j] = wrapCreate(ast.body[i][j]);
						cSize[i][j] = cRender[i][j].computeSize();
						if(yCenter[i]) {
							yMax[i] = Math.max(yMax[i], cSize[i][j].y);
							yCenter[i] = Math.max(yCenter[i], cSize[i][j].center);
						} else {
							yMax[i] = cSize[i][j].y;
							yCenter[i] = cSize[i][j].center;
						}
					}
				}
				for(i = 0; i < ast.body.length; i++) {
					for(j = 0; j < ast.body[i].length; j++) {
						if(xMax[j]) {
							xMax[j] = Math.max(xMax[j], cSize[i][j].x);
						} else {
							xMax[j] = cSize[i][j].x;
						}
					}
				}
				xMaxSum[0] = 0;
				for(j = 1; j < ast.body[0].length; j++) {
					xMaxSum[j] = xMaxSum[j - 1] + xMax[j - 1] + 2;
				}
				yMaxSum[0] = 0;
				for(i = 1; i < ast.body.length; i++) {
					yMaxSum[i] = yMaxSum[i - 1] + yMax[i - 1] + 1;
				}
				for(i = 0; i < ast.body.length; i++) {
					for(j = 0; j < ast.body[i].length; j++) {
						cRender[i][j].format(canvas, x + xMaxSum[j] + 2, y + yMaxSum[i] + yCenter[i] - cSize[i][j].center + 1);
					}
				}
				for(i = 0; i < allSize.y; i++) {
					if(i === 0) {
						canvas.drawText(x, y + i, ast.leftUp);
						if(ast.right !== ".") {
							canvas.drawText(x + allSize.x - 1, y + i, ast.leftDown);
						}
					} else if(i === allSize.y - 1) {
						canvas.drawText(x, y + i, ast.leftDown);
						if(ast.right !== ".") {
							canvas.drawText(x + allSize.x - 1, y + i, ast.leftUp);
						}
					} else if(ast.bracket && i === allSize.center) {
						canvas.drawText(x, y + i, "<");
						if(ast.right !== ".") {
							canvas.drawText(x + allSize.x - 1, y + i, "|");
						}
					} else {
						canvas.drawText(x, y + i, "|");
						if(ast.right !== ".") {
							canvas.drawText(x + allSize.x - 1, y + i, "|");
						}
					}
				}
			}
		};
		return me;
	}
	function condAccent() {
		var me;
		me = {
			computeSize: function() {
				var bodySize = wrapSize(ast.body);
				return {
					x: Math.max(bodySize.x, ast.accent.length),
					y: bodySize.y + 1,
					center: bodySize.center + 1
				};
			},
			format: function(canvas, x, y) {
				var body = wrapCreate(ast.body);
				body.format(canvas, x, y + 1);
				canvas.drawText(x, y, ast.accent);
			}
		};
		return me;
	}
	function condEmphasis() {
		var me;
		me = {
			computeSize: function() {
				var bodySize = wrapSize(ast.body);
				return {
					x: bodySize.x > 0 ? ast.emphasis.begin.length + bodySize.x + ast.emphasis.end.length : 0,
					y: bodySize.y,
					center: bodySize.center
				};
			},
			format: function(canvas, x, y) {
				var body = wrapCreate(ast.body),
					bodySize = body.computeSize();
				if(bodySize.x > 0) {
					body.format(canvas, x + ast.emphasis.begin.length, y);
					canvas.drawText(x, y, ast.emphasis.begin);
					canvas.drawText(x + ast.emphasis.begin.length + bodySize.x, y, ast.emphasis.end);
				}
			}
		};
		return me;
	}
	function condBinom() {
		var me;
		me = {
			computeSize: function(prevSize) {
				var sizeN = wrapSize(ast.n),
					sizeM = wrapSize(ast.m);
				return {
					x: Math.max(sizeN.x, sizeM.x) + 2,
					y: sizeN.y + 1 + sizeM.y,
					center: sizeN.y
				};
			},
			format: function(canvas, x, y) {
				var n = wrapCreate(ast.n),
					m = wrapCreate(ast.m),
					sizeN = n.computeSize(),
					sizeM = m.computeSize();
				n.format(canvas, x + 1, y);
				m.format(canvas, x + 1, y + 1 + sizeN.y);
				canvas.drawText(x, y + sizeN.y, "(");
				canvas.drawText(x + 1 + Math.max(sizeN.x, sizeM.x), y + sizeN.y, ")");
			}
		};
		return me;
	}
	condSum = condSumInt(3, 3, ["---", " < ", "---"]);
	condInt = condSumInt(3, 3, [" /\\", " | ", "\\/ "]);
	condOint = condSumInt(3, 3, [" /\\", " O ", "\\/ "]);
	condProd = condSumInt(5, 3, ["_____", " | | ", " | | "]);
	condLim = condSumInt(3, 1, ["lim"]);
	switch(ast.type) {
	case "frac":
		me = {
			computeSize: function() {
				var numer = wrapSize(ast.numerator),
					denom = wrapSize(ast.denominator);
				return {
					x: Math.max(numer.x, denom.x) + 2,
					y: numer.y + 1 + denom.y,
					center: numer.y
				};
			},
			format: function(canvas, x, y) {
				var numer = wrapCreate(ast.numerator),
					denom = wrapCreate(ast.denominator),
					numerSize = numer.computeSize(),
					denomSize = denom.computeSize(),
					thisSize = me.computeSize(),
					numerX = Math.floor((thisSize.x - numerSize.x) / 2),
					denomX = Math.floor((thisSize.x - denomSize.x) / 2);
				numer.format(canvas, x + numerX, y);
				denom.format(canvas, x + denomX, y + 1 + numerSize.y);
				canvas.drawLine(x, y + numerSize.y, thisSize.x);
			}
		};
		return me;
	case "sup":
		me = {
			computeSize: function(prevSize) {
				var sizeSup = wrapSize(ast.sup);
				return {
					x: sizeSup.x,
					y: sizeSup.y + prevSize.y,
					center: prevSize.center + sizeSup.y
				};
			},
			format: function(canvas, x, y, prevSize) {
				var sup = wrapCreate(ast.sup);
				sup.format(canvas, x, y);
			}
		};
		return me;
	case "sub":
		me = {
			computeSize: function(prevSize) {
				var sizeSub = wrapSize(ast.sub);
				return {
					x: sizeSub.x,
					y: sizeSub.y + prevSize.y,
					center: prevSize.center
				};
			},
			format: function(canvas, x, y, prevSize) {
				var sub = wrapCreate(ast.sub);
				sub.format(canvas, x, y + prevSize.y);
			}
		};
		return me;
	case "supsub":
		me = {
			computeSize: function(prevSize) {
				var sizeSup = wrapSize(ast.sup),
					sizeSub = wrapSize(ast.sub);
				return {
					x: Math.max(sizeSup.x, sizeSub.x),
					y: sizeSup.y + prevSize.y + sizeSub.y,
					center: prevSize.center + sizeSup.y
				};
			},
			format: function(canvas, x, y, prevSize) {
				var sup = wrapCreate(ast.sup),
					sub = wrapCreate(ast.sub),
					supSize = sup.computeSize();
				sup.format(canvas, x, y);
				sub.format(canvas, x, y + prevSize.y + supSize.y);
			}
		};
		return me;
	case "sum":
		return condSum();
	case "prod":
		return condProd();
	case "int":
		return condInt();
	case "oint":
		return condOint();
	case "lim":
		return condLim();
	case "root":
		return condRoot();
	case "matrix":
		return condMatrix();
	case "accent":
		return condAccent();
	case "emphasis":
		return condEmphasis();
	case "binom":
		return condBinom();
	case "simple":
		me = {
			computeSize: function() {
				return {
					x: getLength(ast.item),
					y: 1,
					center: 0
				};
			},
			format: function(canvas, x, y) {
				canvas.drawText(x, y, ast.item);
			}
		};
		return me;
	case "op":
		me = {
			computeSize: function() {
				return {
					x: getLength(ast.item),
					y: 1,
					center: 0
				};
			},
			format: function(canvas, x, y) {
				canvas.drawText(x, y, ast.item);
			}
		};
		return me;
	case "func":
		me = {
			computeSize: function() {
				var sizeSup = wrapSize(ast.sup);
				return {
					x: getLength(ast.item) + sizeSup.x + 1,
					y: 1 + sizeSup.y,
					center: sizeSup.y
				};
			},
			format: function(canvas, x, y) {
				var sup = wrapCreate(ast.sup),
					sizeSup = wrapSize(ast.sup);
				canvas.drawText(x, y + sizeSup.y, ast.item);
				sup.format(canvas, x + getLength(ast.item), y)
				canvas.space(x + getLength(ast.item) + sizeSup.x, y + sizeSup.y);
			}
		};
		return me;
	case "exprlist":
		me = {
			computeSize: function() {
				var i,
					result,
					iOp = false,
					iOpSize,
					iResult,
					iSizeBefore,
					iCenter;
				result = {
					x: 0,
					y: 0,
					center: 0
				};
				iSizeBefore = {
					x: 0,
					y: 1,
					center: 0
				};
				for(i = 0; i < ast.items.length; i++, iSizeBefore = iResult) {
					if(ast.items[i].type === "op" && iOp) {
						iOpSize = 2;
					} else if(ast.items[i].type === "func" && i > 0) {
						iOpSize = 1;
					} else {
						iOpSize = 0;
					}
					iResult = wrapCreate(ast.items[i]).computeSize(iSizeBefore);
					iCenter = Math.max(result.center, iResult.center);
					result = {
						x: result.x + iResult.x + iOpSize,
						y: iCenter + Math.max(result.y - result.center, iResult.y - iResult.center),
						center: iCenter
					};
					iOp = ast.items[i].type !== "op";
				}
				return result;
			},
			format: function(canvas, x, y) {
				var i,
					iOp = false,
					iOpSize,
					thisSize = me.computeSize(),
					iWalked,
					iSize,
					iSizeBefore,
					ix = 0;
				iSizeBefore = {
					x: 0,
					y: 1,
					center: 0
				};
				for(i = 0; i < ast.items.length; i++, ix += iSize.x + iOpSize, iSizeBefore = iSize) {
					if(ast.items[i].type === "op" && iOp) {
						canvas.space(x + ix, y + thisSize.center - iSize.center);
						iOpSize = 1;
					} else if(ast.items[i].type === "func" && i > 0) {
						canvas.space(x + ix, y + thisSize.center - iSize.center);
						iOpSize = 1;
					} else {
						iOpSize = 0;
					}
					iWalked = wrapCreate(ast.items[i]);
					iSize = iWalked.computeSize(iSizeBefore);
					iWalked.format(canvas, x + ix + iOpSize, y + thisSize.center - iSize.center, iSizeBefore);
					if(ast.items[i].type === "op" && iOp) {
						canvas.space(x + ix + iSize.x + iOpSize++, y + thisSize.center - iSize.center);
					}
					iOp = ast.items[i].type !== "op";
				}
			}
		};
		return me;
	case "space":
		me = {
			computeSize: function() {
				return {
					x: 0,
					y: 0,
					center: 0
				};
			},
			format: function(canvas, x, y, prevSize) {}
		};
		return me;
	default:
		throw new Error("Unsupported type " + ast.type);
	}
}

function formatText(ast, option) {
	var formatObject = createFormatTextObject(ast, option),
		size = formatObject.computeSize(),
		canvas = createCanvas(size.x, size.y, option);
	formatObject.format(canvas, 0, 0);
	return canvas.toString();
}

module.exports = formatText;

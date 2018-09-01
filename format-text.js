/*
 * Frederica
 *
 * Copyright (c) 2018 Yuichiro MORIGUCHI
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 **/
function createCanvas(x, y) {
	var me,
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
			var i;
			for(i = 0; i < text.length; i++) {
				canvas[y][x + i] = text.charAt(i);
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

function createFormatTextObject(ast) {
	var me,
		condSum,
		comdInt,
		condLim;
	function wrapSize(ast) {
		return ast ? createFormatTextObject(ast).computeSize() : {
			x: 0,
			y: 0,
			center: 0
		};
	}
	function wrapFormat(ast) {
		return ast ? createFormatTextObject(ast).format : function() {}
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
				var sizeBody = wrapSize(ast.body);
				return {
					x: sizeBody.x + sizeBody.y,
					y: sizeBody.y + 1,
					center: sizeBody.center + 1
				};
			},
			format: function(canvas, x, y) {
				var i,
					bodyFormat = wrapFormat(ast.body),
					bodySize = wrapSize(ast.body);
				bodyFormat(canvas, x + bodySize.y, y + 1);
				for(i = 0; i < bodySize.y; i++) {
					canvas.drawText(x + i, y + bodySize.y - i, i > 0 ? "/" : "v");
				}
				for(i = 0; i < bodySize.x; i++) {
					canvas.drawText(x + i + bodySize.y, y, "_");
				}
			}
		};
		return me;
	}
	condSum = condSumInt(3, 3, ["---", " < ", "---"]);
	condInt = condSumInt(3, 3, [" /\\", " | ", "\\/ "]);
	condLim = condSumInt(3, 1, ["lim"]);
	switch(ast.type) {
	case "frac":
		me = {
			computeSize: function() {
				var numer = createFormatTextObject(ast.numerator).computeSize(),
					denom = createFormatTextObject(ast.denominator).computeSize();
				return {
					x: Math.max(numer.x, denom.x) + 2,
					y: numer.y + 1 + denom.y,
					center: numer.y
				};
			},
			format: function(canvas, x, y) {
				var numer = createFormatTextObject(ast.numerator),
					denom = createFormatTextObject(ast.denominator),
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
			computeSize: function() {
				var sizeSup = createFormatTextObject(ast.sup).computeSize();
				return {
					x: sizeSup.x,
					y: sizeSup.y + 1,
					center: sizeSup.y
				};
			},
			format: function(canvas, x, y) {
				var sup = createFormatTextObject(ast.sup);
				sup.format(canvas, x, y);
			}
		};
		return me;
	case "sub":
		me = {
			computeSize: function() {
				var sizeSub = createFormatTextObject(ast.sub).computeSize();
				return {
					x: sizeSub.x,
					y: sizeSub.y + 1,
					center: 0
				};
			},
			format: function(canvas, x, y) {
				var sub = createFormatTextObject(ast.sub);
				sub.format(canvas, x, y + 1);
			}
		};
		return me;
	case "supsub":
		me = {
			computeSize: function() {
				var sizeSup = createFormatTextObject(ast.sup).computeSize(),
					sizeSub = createFormatTextObject(ast.sub).computeSize();
				return {
					x: Math.max(sizeSup.x, sizeSub.x),
					y: sizeSup.y + 1 + sizeSub.y,
					center: sizeSup.y
				};
			},
			format: function(canvas, x, y) {
				var sup = createFormatTextObject(ast.sup),
					sub = createFormatTextObject(ast.sub),
					supSize = sup.computeSize();
				sup.format(canvas, x, y);
				sub.format(canvas, x, y + 1 + supSize.y);
			}
		};
		return me;
	case "sum":
		return condSum();
	case "int":
		return condInt();
	case "lim":
		return condLim();
	case "root":
		return condRoot();
	case "simple":
		me = {
			computeSize: function() {
				return {
					x: ast.item.length,
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
					x: ast.item.length,
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
				return {
					x: ast.item.length + 1,
					y: 1,
					center: 0
				};
			},
			format: function(canvas, x, y) {
				canvas.drawText(x, y, ast.item);
				canvas.space(x + ast.item.length, y);
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
					iCenter;
				for(i = 0; i < ast.items.length; i++) {
					iOp = true;
					if(ast.items[i].type === "op") {
						iOpSize = iOp ? 2 : 0;
						iOp = false;
					} else if(ast.items[i].type === "func") {
						iOpSize = i > 0 ? 1 : 0;
					} else {
						iOpSize = 0;
					}
					iResult = createFormatTextObject(ast.items[i]).computeSize();
					if(result) {
						iCenter = Math.max(result.center, iResult.center);
						result = {
							x: result.x + iResult.x + iOpSize,
							y: iCenter + Math.max(result.y - result.center, iResult.y - iResult.center),
							center: iCenter
						};
					} else {
						result = iResult;
					}
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
					ix = 0;
				for(i = 0; i < ast.items.length; i++, ix += iSize.x + iOpSize) {
					if(ast.items[i].type === "op" && iOp) {
						canvas.space(x + ix, y + thisSize.center - iSize.center);
						iOpSize = 1;
					} else if(ast.items[i].type === "func" && i > 0) {
						canvas.space(x + ix, y + thisSize.center - iSize.center);
						iOpSize = 1;
					} else {
						iOpSize = 0;
					}
					iWalked = createFormatTextObject(ast.items[i]);
					iSize = iWalked.computeSize();
					iWalked.format(canvas, x + ix + iOpSize, y + thisSize.center - iSize.center);
					if(ast.items[i].type === "op" && iOp) {
						canvas.space(x + ix + iSize.x + iOpSize++, y + thisSize.center - iSize.center);
					}
					iOp = ast.items[i].type !== "op";
				}
			}
		};
		return me;
	default:
		throw new Error("Unsupported type " + ast.type);
	}
}

function formatText(ast) {
	var formatObject = createFormatTextObject(ast),
		size = formatObject.computeSize(),
		canvas = createCanvas(size.x, size.y);
	formatObject.format(canvas, 0, 0);
	return canvas.toString();
}

module.exports = formatText;

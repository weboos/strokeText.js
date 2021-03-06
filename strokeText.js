/*

	strokeText.js
	by @inorganik

*/

var StrokeText = function(elem, options) {

	var self = this;
	self.version = '0.10.1';
	self.elem = (typeof elem === 'string') ? document.getElementById(elem) : elem;

	// default options
	self.options = {
		lineCap: 'round',
		lineJoin: 'round',
		miterLimit: 10,
		lineDashArray: [0, 0],
		debug: false
	}
	// extend default options with passed options object
	if (options && typeof options === 'object') {
		for (var key in self.options) {
			if (options.hasOwnProperty(key) && options[key] !== null) {
				self.options[key] = options[key];
			}
		}
	}

	// helper functions
	function insertAfter(node, refNode) {
		if (node && refNode && refNode.parentNode) {
			refNode.parentNode.insertBefore(node, refNode.nextSibling);
		}
	}
	function remove(node) {
		if (node && node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}
	// canvas doesn't wrap text
	function wrapText(context, text, x, y, maxWidth, lineHeight) {
		var words = text.split(' '),
			line = '',
			lastSegment = '';
		function measureAndProcess(segment, i) {
			var testLine = line;
			if (i > 0 && lastSegment.substr(-1) !== '-') {
				testLine += ' '+ segment;
			}
			else {
				testLine += segment;
			}
			var metrics = context.measureText(testLine);
			if (metrics.width > maxWidth && i > 0) {
				context.strokeText(line, x, y);
				line = segment;
				y += lineHeight;
			}
			else {
				line = testLine;
			}
			lastSegment = segment
		}
		words.forEach(function(word, i) {
			if (word.indexOf('-') > -1) {
				var nextWord = word;
				while (nextWord.indexOf('-') > -1) {
					var hyphen = nextWord.indexOf('-') + 1,
						segment = nextWord.substring(0, hyphen),
						nextWord = nextWord.substring(hyphen);
					measureAndProcess(segment, i);
				}
				measureAndProcess(nextWord, i);
			}
			else {
				measureAndProcess(word, i);
			}
		});
		context.strokeText(line, x, y);
	}

	// removes stroke effect
	self.reset = function() {
		var container = document.getElementById(self.containId);
		if (container) {
			remove(self.elem);
			remove(self.canvasId);
			insertAfter(self.elem, container);
			self.elem.style = self.elemStyle;
			for (var style in self.inlineStyles) {
				self.elem.style[style] = self.inlineStyles[style];
			}
			remove(container);
		}
	}

	// main functionality
	self.stroke = function(strokeWidth, strokeColor) {

		self.reset();

		// ensure valid params
		strokeWidth = Math.abs(strokeWidth);
		strokeColor = (typeof strokeColor === 'string') ? strokeColor : 'red';

		// extract elem styles
		self.elemStyle = window.getComputedStyle(self.elem);
		self.inlineStyles = {};
		for (var i = 0, len = self.elem.style.length; i < len; i++) {
			var styleKey = self.elem.style[i];
			self.inlineStyles[styleKey] = self.elemStyle[styleKey];
		}

		var txt = self.elem.textContent.trim();		
		if (!txt) { return; } // error check

		// adjust elem styles before measurements
		var fontSize = self.elemStyle.getPropertyValue('font-size'),
			fontSizeFloat = parseFloat(fontSize);
		self.elem.style.width = '100%';
		self.elem.style.boxSizing = 'border-box';
		self.elem.style.padding = '0 '+ strokeWidth + 'px';
			
		// measurements
		var width = self.elem.offsetWidth,
			height = self.elem.offsetHeight,
			txtDisplay = self.elemStyle.getPropertyValue('display'),
			fontFamily = self.elemStyle.getPropertyValue('font-family'),
			fontWeight = self.elemStyle.getPropertyValue('font-weight'),
			fontStyle = self.elemStyle.getPropertyValue('font-style'),
			txtLineHeight = parseFloat(self.elemStyle.getPropertyValue('line-height')),
			canvasFont = fontStyle + ' ' + fontWeight + ' ' + fontSize + '/' + txtLineHeight + 'px ' + fontFamily,
			txtAlign = self.elemStyle.getPropertyValue('text-align'),
			txtMarginTop = parseFloat(self.elemStyle.getPropertyValue('margin-top')),
			txtMarginBottom = parseFloat(self.elemStyle.getPropertyValue('margin-bottom')),
			edgePos = strokeWidth;

		self.containId = 'strokeText-' + Math.random().toString().substring(2),
		self.canvasId = self.containId+'-canvas';
		
		// container elem
		var txtContain = document.createElement('div');
		txtContain.setAttribute('id', self.containId);
		txtContain.style.width = width +'px';
		txtContain.style.height = (height + txtMarginTop + txtMarginBottom + (strokeWidth * 2)) +'px';
		txtContain.style.display = txtDisplay;
		txtContain.style.position = 'relative';
		
		// canvas elem
		var txtCanvas = document.createElement('canvas');
		txtCanvas.setAttribute('id', self.canvasId);
		txtCanvas.setAttribute('width', width);
		txtCanvas.setAttribute('height', height + (strokeWidth * 4));
		txtCanvas.style.marginTop = txtMarginTop+'px';
		txtCanvas.style.userSelect = 'none';
		if (self.options.debug) txtCanvas.style.border = '1px red solid';
		
		// insert container and contents
		insertAfter(txtContain, self.elem);
		remove(self.elem);
		self.elem.style.position = 'absolute';
		var elemTopPos = strokeWidth + 'px';
		self.elem.style.top = elemTopPos;
		if (self.options.debug) self.elem.style.border = '1px yellow solid';
		txtContain.appendChild(self.elem);
		txtContain.appendChild(txtCanvas);
		
		// rendering stroked text
		var can = document.getElementById(self.canvasId),
			ctx = can.getContext('2d'),
			canvasEdgePos = 0,
			canvasMaxWidth = width - (edgePos * 2),
			canvasTopPos = (txtLineHeight / 2) + strokeWidth,
			textBaseline = 'middle';

		if (self.options.debug) {
			console.info('┎--- strokeText.js debug');
			console.info('┃ canvasFont:', canvasFont);
			console.info('┃ canvasTopPos:', canvasTopPos);
			console.info('┃ txtLineHeight:', txtLineHeight);
			console.info('┖---');
		}

		switch (txtAlign) {
			case 'center':
				canvasEdgePos = width / 2;
				self.elem.style.left = 0;
				break;
			case 'right':
				canvasEdgePos = width - edgePos;
				self.elem.style.right = edgePos;
				break;
			default:
				canvasEdgePos += edgePos;
				self.elem.style.left = edgePos;
		}
		if (ctx) {
			ctx.font = canvasFont;
			ctx.textBaseline = textBaseline;
			ctx.textAlign = txtAlign;
			ctx.strokeStyle = strokeColor;
			ctx.lineJoin = self.options.lineJoin;
			ctx.lineCap = self.options.lineCap;
			ctx.setLineDash(self.options.lineDashArray);
			ctx.miterLimit = self.options.miterLimit;
			ctx.lineWidth = strokeWidth * 2;
			wrapText(ctx, txt, canvasEdgePos, canvasTopPos, canvasMaxWidth, txtLineHeight);
		}
	};
}
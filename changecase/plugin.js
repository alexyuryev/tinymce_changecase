/**
 * @class tinymce.plugin.ChangeCase
 * Плагин циклической смены регистра выделенного текста
 * нижний регистр -> Заглавные Буквы -> ВЕРХНИЙ РЕГИСТР
 */

(function(){
	/**
	 * @private
	 * Инициализирует плагин добавляющий комманду циклической смены регистра выделеного текста
	 * и назначающий горячую клавишу к нему.
	 */

	function initChangeCase(editor, url) {
		var me = this;

		/**
		 * @private
		 * Фильтр разделителей слов
		 * @param ch {String} символ
		 * @return {Boolean} считаем ли мы символ разделителем слов
		 */
		function isCapitalDelimiter(ch) {
			return (ch.toLocaleLowerCase() == ch.toLocaleUpperCase() && 
				(ch.charCodeAt(0) < '0'.charCodeAt(0) ||
				ch.charCodeAt(0) > '9'.charCodeAt(0))) ;
		}
		
		/**
		 * @private
		 * меняет циклически регистр выделеного текста
		 */
		function changeCase(){
			var selection = editor.selection,
				rangeUtil = new tinymce.dom.RangeUtils(editor.dom),
				bm = selection.getBookmark(),
				range = rangeUtil.split(selection.getRng(true)),
				startNode = range.startContainer,
				endNode = range.endContainer,
				root = editor.dom.findCommonAncestor(startNode, endNode),
				srcText = tinymce.trim(selection.getContent({format: 'text'})),
				weAreInTail = false,
				hasDelimiters = false,
				targetState, startFinder,
				walker, node, str, pos, res, ch;

			function nodeFilter(node) {
				return (node.nodeType == 3 &&
						node.nodeValue.length &&
						node.parentNode.getAttribute('data-mce-type') != 'bookmark')
			}

			for (pos = 0; pos < srcText.length; pos++) {
				if(isCapitalDelimiter(srcText.charAt(pos))) {
					hasDelimiters = true;
					break;
				}
			}

			if (srcText) {
				if (srcText.toLocaleLowerCase() == srcText && srcText.length > 1) {
					targetState = 'capitalized';
				} else {
					targetState = srcText.toLocaleUpperCase() == srcText ? 'lower' : 'upper';
				}
				
				if(targetState == 'capitalized') {
					//пройти назад по тексту, чтобы понять, что мы уже в середине слова.
					startFinder = new tinymce.dom.TreeWalker(startNode, editor.getContainer());
					node = startFinder.prev();
					
					while(node && node != editor.getContainer()) {
						if(nodeFilter(node)) {
							weAreInTail = !isCapitalDelimiter(node.nodeValue.charAt(node.nodeValue.length-1));
							break;
						}
						
						node = startFinder.prev();
					}

					//если выяснилось, что одно слово и выделено оно не целиком, сделать upper
					if(!hasDelimiters && weAreInTail)
						targetState = 'upper';
				}
			
				node = startNode;
				walker = new tinymce.dom.TreeWalker(startNode, root);

				while (node) {
					if (nodeFilter(node) ) {
						
						str = node.nodeValue;
						res = '';
						
						switch (targetState) {
							case 'lower' :
								res = str.toLowerCase();
								break;
							case 'upper' :
								res = str.toUpperCase();
								break;
							case 'capitalized' :
								for (var i = 0; i < str.length; i++) {
									ch = str.charAt(i);

									if (isCapitalDelimiter(ch)) {
										weAreInTail = false;
									} else {
										if (!weAreInTail) {
											weAreInTail = true;
											ch = ch.toUpperCase();
										} else {
											ch = ch.toLowerCase();
										}
									}

									res += ch;
								}
								break;
						}
						
						node.nodeValue = res;
					}

					if (node == endNode) {
						break;
					}

					node = walker.next();
				}
				
				
				selection.moveToBookmark(bm);
			}
		}

		editor.addCommand('changecase', changeCase);

		editor.on('keyup keypress keydown', function(e) {
			//Alt+F3 shortcut

			var F3_KEY_CODE = 114;

			if (e.altKey && e.keyCode == F3_KEY_CODE) {

				e.preventDefault();

				if (e.type == "keydown") {
					editor.execCommand("changecase", false);
				}

				return false;
			}
		});
	}

	tinymce.PluginManager.add('changecase', initChangeCase);
})();

///////////* ПЕРЕМЕННЫЕ И НАСТРОЙКИ *///////////

// Конвертация пунктов и емов в миллиметры
const PT_TO_MM = 2.8346456692913;
const EM_TO_MM = 0.3514598035146;

// Рассчет трекинга
function getCharSpace(fontSize, trackingValue) {
	return fontSize * EM_TO_MM * trackingValue / 1000;
}

// Конвертация CMYK в строку
function cmykVal(num) {
	return (num / 100).toString();
}

// Параметры превью
let previewDelay = 0
let previewScale = .5

// Плейсхолдеры превью при загрузке (пока не сформированы реальные). Замените на свои PNG при необходимости.
var defaultNamePreviewSrc = 'img/default-name-preview.png';
var defaultNumberPreviewSrc = 'img/default-number-preview.png';
// Видимый плейсхолдер для всех браузеров, в т.ч. Safari (SVG в data URL)
var defaultPlaceholderFallback = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120" viewBox="0 0 320 120">' +
	'<rect width="320" height="120" fill="#eee" stroke="#ccc" stroke-width="1"/>' +
	'<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="sans-serif" font-size="14">Превью</text>' +
	'</svg>'
);

// Цвета
// Цвет фона и текста таблички для русской и удмуртской частей
var fillColor = {
	'color': {
		'c': 0,
		'm': 0,
		'y': 0,
		'k': 0,
	},
};

var backColor = {
	'color': {
		'c': 88,
		'm': 84,
		'y': 22,
		'k': 7,
	},
};

// Цвета проверки верстки
var checkColor1 = {
	'color': {
		'c': 0,
		'm': 15,
		'y': 0,
		'k': 0,
	},
};
var checkColor2 = {
	'color': {
		'c': 0,
		'm': 15,
		'y': 25,
		'k': 0,
	},
};
var checkColor3 = {
	'color': {
		'c': 20,
		'm': 0,
		'y': 50,
		'k': 0,
	},
};

// Установка размеров таблички
// var signWidth = 0;
var signHeight = 280;
var numberWidth = signHeight;
var signHeightIzhs = 200;
var signWidthOkn = 400;
var signHeightOkn = 600;
var signRadius = 0;
var signIndent = 40;
var numberIndent = 50;
let spaceValue = 30;
// let nameRusTracking = 80;
// let nameUdmTracking = 20;
let typeWordIndent = 0 /* 4.534 */;
let nameWordIndent = 0 /* 4.534 */;

// Список названий из sign-suggest-list.json (загружается при готовности документа)
var validStreetNames = null;
/** Полный список улиц из sign-suggest-list.json (для проверки isOKN) */
var signSuggestList = null;
// Visible #streetName can contain "type name" for UX; keep raw (name-only) in #streetNameRaw for generator logic.
function getStreetNameRawValue() {
	var rawEl = document.getElementById('streetNameRaw');
	if (rawEl && typeof rawEl.value === 'string') return rawEl.value.trim();
	var el = document.getElementById('streetName');
	return el && typeof el.value === 'string' ? el.value.trim() : '';
}
function syncStreetNameRawFromDisplay() {
	var displayEl = document.getElementById('streetName');
	var rawEl = document.getElementById('streetNameRaw');
	if (!displayEl || !rawEl) return;
	var display = (displayEl.value || '').trim();

	// Best effort: if the display string matches a known suggestion ("type titleRu? name"),
	// keep raw strictly as name-only.
	if (signSuggestList && display) {
		var displayLower = display.toLowerCase();
		for (var i = 0; i < signSuggestList.length; i++) {
			var o = signSuggestList[i] || {};
			var type = o.type ? String(o.type).toLowerCase().trim() : '';
			var titleRu = o.titleRu ? String(o.titleRu).trim() : '';
			var name = o.name ? String(o.name).trim() : '';
			var parts = [];
			if (type) parts.push(type);
			if (titleRu) parts.push(titleRu);
			if (name) parts.push(name);
			if (parts.join(' ').toLowerCase() === displayLower) {
				rawEl.value = name;
				return;
			}
		}
	}

	var typeEl = document.getElementById('streetType');
	var type = typeEl ? (typeEl.value || '').trim().toLowerCase() : '';
	// If the visible value starts with "type " (same as suggestions), strip it to keep raw name-only.
	if (type && display.toLowerCase().indexOf(type + ' ') === 0) {
		rawEl.value = display.slice((type + ' ').length).trim();
	} else {
		rawEl.value = display;
	}
}
function isStreetNameValid(name) {
	var n = (name || '').trim();
	if (!validStreetNames || !n) return false;
	return validStreetNames.indexOf(n) !== -1;
}
/** Найти запись улицы по типу и названию (type/name сравниваются без учёта регистра) */
function getStreetEntry(streetType, streetName) {
	var type = (streetType || '').trim().toLowerCase();
	var name = (streetName || '').trim();
	if (!signSuggestList || !name) return null;
	for (var i = 0; i < signSuggestList.length; i++) {
		var o = signSuggestList[i];
		if ((o.type || '').toLowerCase() === type && (o.name || '').trim() === name) return o;
	}
	return null;
}
/** Улица входит в список ОКН (объектов культурного наследия) */
function isStreetOkn(streetType, streetName) {
	var entry = getStreetEntry(streetType, streetName);
	return !!(entry && entry.isOKN === true);
}
/** Улица помечена как «геройская» (isHeroStreet: true) — использовать createStreetNameTitlePDF */
function isStreetHeroStreet(streetType, streetName) {
	var entry = getStreetEntry(streetType, streetName);
	return !!(entry && entry.isHeroStreet === true);
}
// Номер дома: только цифры 1–9, макс. 3 (для generatePreviewOnly)
var houseNumberRegex = /^[1-9]\d{0,2}$/;
// Литера: не с цифры, только кириллица и цифры 1–9, макс. 3 символа
var houseLetterRegex = /^[А-Яа-яЁё1-9][А-Яа-яЁё1-9]{0,2}$/;
// Текущая вкладка превью: 'buildings' | 'izhs' | 'okn'
var currentPreviewTab = 'buildings';
// Есть ли хотя бы одна подсказка для введённого текста (как в autocomplete: название начинается с phrase)
function hasSuggestionFor(phrase) {
	var p = (phrase || '').trim().toLowerCase();
	if (!signSuggestList || !p) return false;
	for (var i = 0; i < signSuggestList.length; i++) {
		var o = signSuggestList[i] || {};
		// Match in the same order user sees/enters ("type name ..."), but keep titleRu searchable too.
		var hay = [
			o.type ? String(o.type).toLowerCase() : '',
			o.name ? String(o.name) : '',
			o.titleRu ? String(o.titleRu) : ''
		].filter(Boolean).join(' ').toLowerCase();
		if (hay.indexOf(p) !== -1) return true;
		// Also allow searching by name-only even if user types without type prefix.
		var nameOnly = (o.name ? String(o.name) : '').toLowerCase();
		if (nameOnly && nameOnly.indexOf(p) !== -1) return true;
	}
	return false;
}

// Установка высоты линии
/* 	var lineH = 1.4;
	var lineY = 152.3; */

///////////* ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ПДФ *///////////
// Измерение ширины текста в jsPDF (создаёт временный doc, настраивает шрифт, измеряет).
// getTextWidth() возвращает только ширину глифов; charSpace (трекинг) добавляет промежутки
// между символами, поэтому полная ширина = ширина глифов + charSpace * (n - 1).
function measureTextWidth(word) {
	var tempDoc = new jsPDF({ orientation: 'l', unit: 'mm' });
	tempDoc.internal.write('q');
	tempDoc.setFont(word.font);
	tempDoc.setFontStyle(word.fontStyle);
	tempDoc.setFontSize(word.fontSize);
	var baseWidth = tempDoc.getTextWidth(word.contents);
	var charSpace = getCharSpace(word.fontSize, word.fontTracking);
	var n = (word.contents || '').length;
	var trackingWidth = n > 1 ? charSpace * (n - 1) : 0;
	var width = Math.round(baseWidth + trackingWidth);
	tempDoc.internal.write('Q');
	return width;
}

// Рисование одного слова в документе
function drawWord(doc, word) {
	doc.internal.write('q');
	doc.setFont(word.font);
	doc.setFontStyle(word.fontStyle);
	doc.setFontSize(word.fontSize);
	doc.setTextColor(cmykVal(word.color.c), cmykVal(word.color.m), cmykVal(word.color.y), cmykVal(word.color.k));
	doc.text(word.contents, word.position.x, word.position.y, {
		'baseline': 'bottom',
		'charSpace': getCharSpace(word.fontSize, word.fontTracking),
		'align': word.align,
		'renderingMode': 'addToPathForClipping'
	});
	doc.rect(0, 0, signWidth, signHeight, 'F');
	doc.internal.write('Q');
}





///////////* ГЕНЕРАЦИЯ ПДФ И ПРЕВЬЮ *///////////
// Скачать ПДФ
$(document).ready(function () {
	// Плейсхолдеры превью: сначала показываем data URL (работает в Safari, нет запроса), затем при успехе подменяем на свой файл
	function setDefaultPreview($img, defaultSrc) {
		$img.attr('src', defaultPlaceholderFallback);
		if (defaultSrc) {
			var testImg = new Image();
			testImg.onload = function () {
				$img.attr('src', defaultSrc);
			};
			testImg.src = defaultSrc;
		}
	}
	setDefaultPreview($('#name-preview'), defaultNamePreviewSrc);
	setDefaultPreview($('#number-preview'), defaultNumberPreviewSrc);

	$.getJSON('js/sign-suggest-list.json').done(function (data) {
		signSuggestList = data;
		validStreetNames = data.map(function (o) { return o.name; });
		updateStreetNameWarning();
	}).fail(function () {
		signSuggestList = [];
		validStreetNames = [];
	});

	// Видимость блоков превью и состояние кнопок "Тип дома"
	var previewTabConfig = {
		'buildings': { groupId: 'preview-group-name-number', buttonId: 'buildings', letterActive: true, showButtons: ['downloadNamePDF', 'downloadNumberPDF'], hideButtons: ['downloadIzhsPDF', 'downloadIzhsNumberPDF', 'downloadOknPDF'] },
		'izhs': { groupId: 'preview-group-izhs', buttonId: 'izhs', letterActive: true, showButtons: ['downloadIzhsPDF', 'downloadIzhsNumberPDF'], hideButtons: ['downloadNamePDF', 'downloadNumberPDF', 'downloadOknPDF'] },
		'okn': { groupId: 'preview-group-okn', buttonId: 'okn', letterActive: true, showButtons: ['downloadOknPDF'], hideButtons: ['downloadNamePDF', 'downloadNumberPDF', 'downloadIzhsPDF', 'downloadIzhsNumberPDF'] }
	};

	function switchPreviewTab(tab) {
		var config = previewTabConfig[tab];
		if (!config) return;
		currentPreviewTab = tab;
		if (tab !== 'okn') {
			var oknErr = document.getElementById('okn-input-error');
			if (oknErr) oknErr.classList.remove('visible');
		}
		$('#preview-group-name-number, #preview-group-izhs, #preview-group-okn').hide();
		$('#' + config.groupId).css('display', 'flex');
		$('#buildings, #izhs, #okn').removeClass('preview-tab-selected').attr('aria-pressed', 'false');
		$('#' + config.buttonId).addClass('preview-tab-selected').attr('aria-pressed', 'true');
		$('#houseLetter').prop('disabled', !config.letterActive).toggleClass('input-disabled', !config.letterActive);
		config.showButtons.forEach(function (id) { $('#' + id).show(); });
		config.hideButtons.forEach(function (id) { $('#' + id).hide(); });
		debouncedPreviewUpdate();
	}

	// Нагрузка: только name+number, кнопка buildings выбрана
	switchPreviewTab('buildings');

	$('#buildings, #izhs, #okn').on('click', function () {
		switchPreviewTab($(this).attr('id'));
	});

	function updateStreetNameWarning() {
		var input = document.getElementById('streetName');
		var warnEl = document.getElementById('street-name-warning');
		if (!input || !warnEl) return;
		var val = (input.value || '').trim();
		var showWarn = val !== '' && !hasSuggestionFor(val);
		if (showWarn) {
			warnEl.classList.add('visible');
			input.classList.add('warn-unknown-street');
			$('#downloadNamePDF').prop('disabled', true);
			$('#downloadIzhsPDF').prop('disabled', true);
			$('#downloadOknPDF').prop('disabled', true);
		} else {
			warnEl.classList.remove('visible');
			input.classList.remove('warn-unknown-street');
			$('#downloadNamePDF').prop('disabled', false);
			$('#downloadIzhsPDF').prop('disabled', false);
			$('#downloadOknPDF').prop('disabled', false);
		}
	}

	$("#downloadNamePDF").click(function () {
		createNamePDF();
	});
	$("#downloadNumberPDF").click(function () {
		var letter = ($('#houseLetter').val() || '').trim();
		if (letter === '') {
			createNumberPDF(true);
		} else if (houseLetterRegex.test(letter)) {
			createNumberWithLetterPDF(true);
		}
	});
	$("#downloadIzhsPDF").click(function () {
		var letter = ($('#houseLetter').val() || '').trim();
		if (letter !== '' && houseLetterRegex.test(letter)) {
			var streetType = $('#streetType').val();
			var streetName = getStreetNameRawValue();
			if (isStreetHeroStreet(streetType, streetName)) {
				createIzhsTitleWithLetterPDF(true);
			} else {
				createIzhsWithLetterPDF(true);
			}
		} else {
			createIzhsPDF(true);
		}
	});
	$("#downloadIzhsNumberPDF").click(function () {
		var letter = ($('#houseLetter').val() || '').trim();
		if (letter !== '' && houseLetterRegex.test(letter)) {
			createIzhsNumberWithLetterPDF(true);
		} else {
			createIzhsNumberPDF(true);
		}
	});
	$("#downloadOknPDF").click(function () {
		var letter = ($('#houseLetter').val() || '').trim();
		if (letter !== '' && houseLetterRegex.test(letter)) {
			createOknWithLetterPDF(true);
		} else {
			createOknPDF(true);
		}
	});

	// Debounce function to limit preview updates while typing
	var previewTimeout;
	function debouncedPreviewUpdate() {
		clearTimeout(previewTimeout);
		previewTimeout = setTimeout(function () {
			if (!window.IZH260FontsReady) return;
			var houseNumberInput = document.getElementById('houseNumber');
			var houseNumberValid = houseNumberInput && houseNumberInput.value.trim() !== '' &&
				houseNumberRegex.test(houseNumberInput.value.trim());
			if (currentPreviewTab === 'izhs' || currentPreviewTab === 'okn') {
				if (houseNumberValid) generatePreviewOnly();
				return;
			}
			var streetNameInput = document.getElementById('streetName');
			var houseLetterInput = document.getElementById('houseLetter');
			var streetVal = getStreetNameRawValue();
			var letterVal = houseLetterInput ? (houseLetterInput.value || '').trim() : '';
			if (streetNameInput && streetVal !== '' && houseNumberValid &&
				isStreetNameValid(streetVal) &&
				(letterVal === '' || houseLetterRegex.test(letterVal))) {
				generatePreviewOnly();
			}
		}, previewDelay);
	}

	$('#streetName').on('input', function () {
		syncStreetNameRawFromDisplay();
		updateStreetNameWarning();
		debouncedPreviewUpdate();
	});
	$('#streetName').on('blur', updateStreetNameWarning);
	$('#houseNumber').on('input', debouncedPreviewUpdate);
	$('#houseLetter').on('input', debouncedPreviewUpdate);

	// House number validation (houseNumberRegex — глобально)
	function validateHouseNumber() {
		var input = document.getElementById('houseNumber');
		var errorEl = document.getElementById('number-input-error');
		if (!input || !errorEl) return;
		var val = input.value.trim();
		var valid = val !== '' && houseNumberRegex.test(val);
		var showError = val !== '' && !houseNumberRegex.test(val);
		input.setAttribute('aria-invalid', showError ? 'true' : 'false');
		if (showError) {
			errorEl.classList.add('visible');
			$('#downloadNumberPDF').prop('disabled', true);
		} else {
			errorEl.classList.remove('visible');
			$('#downloadNumberPDF').prop('disabled', false);
		}
		return valid;
	}
	function enforceHouseNumberMaxLength() {
		var input = document.getElementById('houseNumber');
		if (!input) return;
		if (input.value.length > 3) {
			input.value = input.value.slice(0, 3);
		}
		validateHouseNumber();
	}
	$('#houseNumber').on('input', enforceHouseNumberMaxLength);
	$('#houseNumber').on('blur', validateHouseNumber);
	validateHouseNumber();

	// Валидация литеры (houseLetterRegex — глобально)
	function validateHouseLetter() {
		var input = document.getElementById('houseLetter');
		var errorEl = document.getElementById('letter-input-error');
		if (!input || !errorEl) return;
		var val = (input.value || '').trim();
		var valid = val === '' || houseLetterRegex.test(val);
		var showError = val !== '' && !houseLetterRegex.test(val);
		input.setAttribute('aria-invalid', showError ? 'true' : 'false');
		if (showError) {
			errorEl.classList.add('visible');
			$('#downloadNumberPDF').prop('disabled', true);
		} else {
			errorEl.classList.remove('visible');
			validateHouseNumber(); // обновить disabled по состоянию номера
		}
		return valid;
	}
	function enforceHouseLetterMaxLength() {
		var input = document.getElementById('houseLetter');
		if (!input) return;
		if (input.value.length > 3) {
			input.value = input.value.slice(0, 3);
		}
		validateHouseLetter();
	}
	$('#houseLetter').on('input', function () {
		enforceHouseLetterMaxLength();
		debouncedPreviewUpdate();
	});
	$('#houseLetter').on('blur', validateHouseLetter);
	validateHouseLetter();

	// Generate preview on page load if streetName and houseNumber have text
	// Wait for fonts to be ready before generating preview
	function generatePreviewOnLoad() {
		var streetNameInput = document.getElementById('streetName');
		var houseNumberInput = document.getElementById('houseNumber');
		var houseLetterInput = document.getElementById('houseLetter');
		var streetVal = getStreetNameRawValue();
		var letterVal = houseLetterInput ? (houseLetterInput.value || '').trim() : '';
		if (streetNameInput && streetVal !== '' &&
			houseNumberInput && houseNumberInput.value.trim() !== '' &&
			houseNumberRegex.test(houseNumberInput.value.trim()) &&
			isStreetNameValid(streetVal) &&
			(letterVal === '' || houseLetterRegex.test(letterVal))) {
			generatePreviewOnly();
		}
	}

	// Listen for font loading event
	if (window.IZH260FontsReady) {
		// Fonts already loaded
		generatePreviewOnLoad();
	} else {
		// Wait for fonts to load
		window.addEventListener('izh260FontsLoaded', generatePreviewOnLoad, { once: true });
	}

	// Preview updates on input in streetName or houseNumber (debounced).

});

///////////* ГЕНЕРАЦИЯ ПРЕВЬЮ PNG *///////////
// Универсальная функция генерации превью (заменяет generateNamePreview, generateNumberPreview, generateIzhsPreview, generateOknPreview)
function generatePreview(doc, previewElementId) {
	var previewElement = document.getElementById(previewElementId);
	if (!previewElement) {
		if (previewElementId !== 'izhs-preview' && previewElementId !== 'izhs-number-preview' && previewElementId !== 'okn-preview') {
			console.warn('Preview element not found: ' + previewElementId);
		}
		return;
	}
	if (typeof pdfjsLib === 'undefined') {
		console.warn('PDF.js not loaded. Include PDF.js for PNG preview.');
		return;
	}
	try {
		var pdfOutput = doc.output('arraybuffer');
		var loadingTask = pdfjsLib.getDocument({ data: pdfOutput });
		loadingTask.promise.then(function (pdf) {
			return pdf.getPage(1);
		}).then(function (page) {
			var scale = previewScale;
			var viewport = page.getViewport({ scale: scale });
			// PDF page size in points (1 pt = 1/72 inch); convert to mm for display (1 pt ≈ 0.352778 mm)
			var viewportPt = page.getViewport({ scale: 1 });
			var widthMm = Math.round(viewportPt.width / 2.834645669);
			var heightMm = Math.round(viewportPt.height / 2.834645669);
			var dimensionsText = widthMm + '×' + heightMm;
			var dimensionsIdMap = { 'name-preview': 'name-dimensions', 'number-preview': 'number-dimensions', 'izhs-preview': 'izhs-dimensions', 'izhs-number-preview': 'izhs-number-dimensions', 'okn-preview': 'okn-dimensions' };
			var dimensionsId = dimensionsIdMap[previewElementId] || null;
			if (dimensionsId) {
				var dimensionsEl = document.getElementById(dimensionsId);
				if (dimensionsEl) dimensionsEl.textContent = dimensionsText;
			}
			var canvas = document.createElement('canvas');
			var context = canvas.getContext('2d', { alpha: true });
			canvas.height = viewport.height;
			canvas.width = viewport.width;
			context.clearRect(0, 0, canvas.width, canvas.height);
			return page.render({
				canvasContext: context,
				viewport: viewport,
				background: null
			}).promise.then(function () {
				previewElement.src = canvas.toDataURL('image/png');
				previewElement.style.maxWidth = '100%';
				previewElement.style.height = 'auto';
			});
		}).catch(function (error) {
			console.error('Error rendering PNG preview:', error);
		});
	} catch (e) {
		console.error('Error generating PNG preview:', e);
	}
}

// Обёртки для обратной совместимости
function generateNamePreview(doc) { generatePreview(doc, 'name-preview'); }
function generateNumberPreview(doc) { generatePreview(doc, 'number-preview'); }
function generateIzhsPreview(doc) { generatePreview(doc, 'izhs-preview'); }
function generateIzhsNumberPreview(doc) { generatePreview(doc, 'izhs-number-preview'); }
function generateOknPreview(doc) { generatePreview(doc, 'okn-preview'); }
function generateNameTitlePreview(doc) { generatePreview(doc, 'name-preview'); }





///////////* РИСОВАНИЕ ТАБЛИЧЕК В ПДФ *///////////
// Параметр savePDF: true - сохранить PDF, false - только превью
// Табличка с названием, 280 мм
function createStreetNamePDF(savePDF) {
	// Получение значений из формы
	var streetType = $('#streetType').val();
	var streetName = getStreetNameRawValue();
	var streetNameUdm = $('#streetNameUdm').val();
	var streetTypeUdm = $('#streetTypeUdm').val();

	if (!isStreetNameValid(streetName)) {
		return;
	}

	// Объявление переменных
	let i, word;

	// Объявление массива с текстом
	var words = [
		{
			// Родовое слово на русском языке
			'contents': streetType,
			'fontSize': 153,
			'fontTracking': 10,
			'align': 'left',
			'position': {
				'x': signIndent,
				'y': 108.096,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Название улицы на русском языке
			'contents': streetName,
			'fontSize': 242.94,
			'fontTracking': 20,
			'align': 'left',
			'position': {
				'x': 0,
				'y': 112.806,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': true,
		},
		{
			// Название улицы на удмуртском языке
			'contents': streetNameUdm,
			'fontSize': 242.94,
			'fontTracking': 20,
			'align': 'left',
			'position': {
				'x': signIndent,
				'y': 252.806,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Родовое слово на удмуртском языке
			'contents': streetTypeUdm,
			'fontSize': 153,
			'fontTracking': 10,
			'align': 'left',
			'position': {
				'x': 0,
				'y': 248.096,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': true,
		},
	];

	// Рассчет ширины слов
	var widthTypeRus = measureTextWidth(words[0]);
	var widthNameRus = measureTextWidth(words[1]);
	var widthNameUdm = measureTextWidth(words[2]);
	var widthTypeUdm = measureTextWidth(words[3]);

	// Рассчет ширины таблички
	var preWidth = Math.max((widthTypeRus + widthNameRus), (widthNameUdm + widthTypeUdm));
	var width = Math.round(signIndent * 2 + preWidth + spaceValue);
	// Set sign width
	signWidth = width;


	let doc = new jsPDF({
		orientation: 'l',
		unit: 'mm',
		format: [signWidth, signHeight],
		putOnlyUsedFonts: true,
	});


	// Set properties on the document
	doc.setProperties({
		title: streetType + ' ' + streetName,
		subject: 'Табличка с названием улицы, для многоквартирного дома',
		author: '',
		keywords: 'Генератор адресных табличек Ижевска',
	});

	// Рисование фона
	// doc.setDrawColor(0);
	doc.setFillColor(fillColor.color.c / 100, fillColor.color.m / 100, fillColor.color.y / 100, fillColor.color.k / 100);
	doc.roundedRect(0, 0, signWidth, signHeight, signRadius, signRadius, 'F');

	// Рисование нижней линии
	// doc.setDrawColor(0);
	doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);
	doc.roundedRect(0, signHeight / 2, signWidth, signHeight / 2, signRadius, signRadius, 'F');

	// Рисование прямоугольника, скрывающего верхние закругления
	/* doc.setDrawColor(0);
	doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);
	doc.roundedRect(0, 140, signWidth, signHeight / 4, 0, 0, 'F'); */




	// Проверка верстки
	/* 
		// Левый отступ
		doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
		doc.rect(0, 0, signIndent, signHeight, 'F')
	
		// Правый отступ
		doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
		doc.rect(signWidth - signIndent, 0, signIndent, signHeight, 'F')
	
		// Верхний отступ русского текста
		doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
		doc.rect(signIndent, 0, signWidth - signIndent - signIndent, ((signHeight / 2) - 60) / 2, 'F')
	
		//Пробел русского текста
		doc.setFillColor(checkColor3.color.c / 100, checkColor3.color.m / 100, checkColor3.color.y / 100, checkColor3.color.k / 100);
		doc.rect(signIndent + widthTypeRus - typeWordIndent, 40, spaceValue, 60, 'F')
	
		// Нижний отступ русского текста
		doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
		doc.rect(signIndent, (((signHeight / 2) - 60) / 2) + 60, signWidth - signIndent - signIndent, ((signHeight / 2) - 60) / 2, 'F')
	
		// Верхний отступ удмуртского текста
		doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
		doc.rect(signIndent, 140, signWidth - signIndent - signIndent, ((signHeight / 2) - 60) / 2, 'F')
	
		//Пробел удмуртского текста
		doc.setFillColor(checkColor3.color.c / 100, checkColor3.color.m / 100, checkColor3.color.y / 100, checkColor3.color.k / 100);
		doc.rect(signIndent + widthNameUdm - typeWordIndent, 180, spaceValue, 60, 'F')
	
		// Нижний отступ удмуртского текста
		doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
		doc.rect(signIndent, 240, signWidth - signIndent - signIndent, ((signHeight / 2) - 60) / 2, 'F')
	*/


	// Установка цвета текста
	// doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);

	// Рисование линии
	// doc.rect(signIndent, lineY, signWidth - signIndent - signIndent, lineH, 'F');

	// Draw text

	// console.log('doc.getTextWidth(words[0].contents): ' + doc.getTextWidth(words[0].contents));
	// console.log('rightShiftValueRu: ' + rightShiftValueRu);
	// let rightShiftValueUdm = doc.getTextWidth(words[2].contents) + spaceValue + signIndent;
	// console.log('rightShiftValueUdm: ' + rightShiftValueUdm);

	var rightShiftValueRu = widthTypeRus + spaceValue + signIndent;
	var rightShiftValueUdm = widthNameUdm + spaceValue + signIndent;

	for (i = 0; i < words.length; i++) {

		// Сдвиг для русского родового слова (0) и удмуртского названия улицы (2)
		if (i == 0 || i == 2) {
			word = words[i];
			words[i].position.x = words[i].position.x - typeWordIndent;
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);

			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeight, 'F');
			doc.internal.write('Q');
		} else if (i == 1) {
			// Сдвиг по оси X для русского названия улицы
			words[i].position.x = rightShiftValueRu - nameWordIndent;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeight, 'F');
			doc.internal.write('Q');
		} else {
			// Сдвиг по оси X для удмуртского названия улицы
			words[i].position.x = rightShiftValueUdm - typeWordIndent;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeight, 'F');
			doc.internal.write('Q');
		}
	}



	// Generate PNG preview
	generateNamePreview(doc);

	// Save PDF only if savePDF is true
	if (savePDF) {
		doc.save(streetType + '_' + streetName + '_' + signWidth + '×' + signHeight + '.pdf');
	}
}

// !! Табличка с названием для длинных титулов, 280 мм
function createStreetNameTitlePDF(savePDF) {
	// Получение значений из формы
	var streetType = $('#streetType').val();
	var streetName = getStreetNameRawValue();
	var streetNameUdm = $('#streetNameUdm').val();
	var streetTypeUdm = $('#streetTypeUdm').val();
	var entry = getStreetEntry(streetType, streetName);
	var titleRu = (entry && entry.titleRu) ? entry.titleRu : ($('#titleRu').length ? $('#titleRu').val() : '') || 'Героя';
	var titleUdm = (entry && entry.titleUdm) ? entry.titleUdm : ($('#titleUdm').length ? $('#titleUdm').val() : '') || 'Героез';

	if (!isStreetNameValid(streetName)) {
		return;
	}

	// Объявление переменных
	let i, word;

	// Объявление массива с текстом
	var words = [
		{
			// Родовое слово на русском языке
			'contents': streetType,
			'fontSize': 100,
			'fontTracking': 10,
			'align': 'left',
			'position': {
				'x': signIndent,
				'y': 62.931,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Название улицы на русском языке
			'contents': streetName,
			'fontSize': 242.94,
			'fontTracking': 20,
			'align': 'left',
			'position': {
				'x': 0,
				'y': 112.806,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': true,
		},
		{
			// Название улицы на удмуртском языке
			'contents': streetNameUdm,
			'fontSize': 242.94,
			'fontTracking': 20,
			'align': 'left',
			'position': {
				'x': signIndent,
				'y': 252.806,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Родовое слово на удмуртском языке
			'contents': streetTypeUdm,
			'fontSize': 100,
			'fontTracking': 10,
			'align': 'left',
			'position': {
				'x': 0,
				'y': 245.292,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': true,
		},
		{
			// Титул улицы на русском языке
			'contents': titleRu,
			'fontSize': 100,
			'fontTracking': 10,
			'align': 'left',
			'position': {
				'x': signIndent,
				'y': 105.291,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Тип улицы на удмуртском языке
			'contents': titleUdm,
			'fontSize': 100,
			'fontTracking': 10,
			'align': 'left',
			'position': {
				'x': signIndent,
				'y': 202.938,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': false,
		},
	];

	// Рассчет ширины слов
	var widthTypeRus = measureTextWidth(words[0]);
	var widthNameRus = measureTextWidth(words[1]);
	var widthNameUdm = measureTextWidth(words[2]);
	var widthTypeUdm = measureTextWidth(words[3]);
	var widthTitleRus = measureTextWidth(words[4]);
	var widthTitleUdm = measureTextWidth(words[5]);

	// Рассчет ширины таблички
	var preWidthTitle = Math.max(widthTitleRus, widthTitleUdm);
	var preWidth = Math.max((preWidthTitle + widthNameRus), (preWidthTitle + widthTypeUdm));
	var width = Math.round(signIndent * 2 + preWidth + spaceValue);
	// Set sign width
	signWidth = width;


	let doc = new jsPDF({
		orientation: 'l',
		unit: 'mm',
		format: [signWidth, signHeight],
		putOnlyUsedFonts: true,
	});


	// Set properties on the document
	doc.setProperties({
		title: streetType + ' ' + titleRu + ' ' + streetName,
		subject: 'Табличка с названием улицы, для многоквартирного дома',
		author: '',
		keywords: 'Генератор адресных табличек Ижевска',
	});

	// Рисование фона
	// doc.setDrawColor(0);
	doc.setFillColor(fillColor.color.c / 100, fillColor.color.m / 100, fillColor.color.y / 100, fillColor.color.k / 100);
	doc.roundedRect(0, 0, signWidth, signHeight, signRadius, signRadius, 'F');

	// Рисование нижней линии
	// doc.setDrawColor(0);
	doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);
	doc.roundedRect(0, signHeight / 2, signWidth, signHeight / 2, signRadius, signRadius, 'F');

	// Рисование прямоугольника, скрывающего верхние закругления
	/* doc.setDrawColor(0);
	doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);
	doc.roundedRect(0, 140, signWidth, signHeight / 4, 0, 0, 'F'); */




	// var rightShiftValueRu = widthTypeRus + spaceValue + signIndent;
	var rightShiftValueUdm = widthNameUdm + spaceValue + signIndent;

	for (i = 0; i < words.length; i++) {

		// Сдвиг для русского родового слова (0) и удмуртского названия улицы (2)
		if (i == 0 || i == 2) {
			word = words[i];
			words[i].position.x = words[i].position.x - typeWordIndent;
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);

			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeight, 'F');
			doc.internal.write('Q');
		} else if (i == 1) {
			// Сдвиг по оси X для русского названия улицы
			words[i].position.x = signIndent + widthTitleRus + spaceValue;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeight, 'F');
			doc.internal.write('Q');
		} else if (i == 3) {
			// Сдвиг по оси X для удмуртского названия улицы
			words[i].position.x = rightShiftValueUdm - typeWordIndent;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeight, 'F');
			doc.internal.write('Q');
		} else if (i == 4) {
			words[i].position.x = signIndent;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeight, 'F');
			doc.internal.write('Q');
		} else if (i == 5) {
			words[i].position.x = rightShiftValueUdm - typeWordIndent;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeight, 'F');
			doc.internal.write('Q');
		}
	}



	// Generate PNG preview
	generateNameTitlePreview(doc);

	// Save PDF only if savePDF is true
	if (savePDF) {
		doc.save(streetType + '_' + titleRu + '_' + streetName + '_' + signWidth + '×' + signHeight + '.pdf');
	}
}

// Табличка с номером, 280 мм
function createNumberPDF(savePDF) {
	var houseNumber = $('#houseNumber').val();
	var words = [{
		'contents': houseNumber,
		'fontSize': 485.93,
		'fontTracking': 0,
		'align': 'left',
		'position': { 'x': 0, 'y': 225.7 },
		'font': 'IZH-260-A',
		'fontStyle': 'normal',
		'color': Object.assign({}, backColor.color),
		'rightShift': false,
	}];

	var widthNumber = measureTextWidth(words[0]);
	signWidth = signHeight;
	words[0].position.x = (numberWidth - widthNumber) / 2;

	var doc = new jsPDF({
		orientation: 'l',
		unit: 'mm',
		format: [signWidth, signHeight],
		putOnlyUsedFonts: true,
	});

	doc.setProperties({
		title: houseNumber,
		subject: 'Табличка с номером, для многоквартирного дома',
		author: '',
		keywords: 'Генератор адресных табличек Ижевска',
	});

	// Draw text
	drawWord(doc, words[0]);

	generateNumberPreview(doc);
	if (savePDF) {
		doc.save(houseNumber + '_' + signWidth + '×' + signHeight + '.pdf');
	}
}

// Табличка с номером и литерой, 280 мм
function createNumberWithLetterPDF(savePDF) {
	// Получение значений из формы
	var houseNumber = $('#houseNumber').val();
	var houseLetter = $('#houseLetter').val();

	// Объявление переменных
	// let i, word;

	// Объявление массива с текстом
	var words = [
		{
			'contents': houseNumber,
			'fontSize': 485.93,
			'fontTracking': 20,
			'align': 'left',
			'position': { 'x': 0, 'y': 225.7 },
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color),
			'rightShift': false,
		},
		{
			'contents': '/' + houseLetter,
			'fontSize': 262,
			'fontTracking': 10,
			'align': 'left',
			'position': { 'x': 0, 'y': 213.944 },
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color),
			'rightShift': false,
		},
	];

	// Рассчет ширины слов
	var widthNumber = measureTextWidth(words[0]);
	var widthLetter = measureTextWidth(words[1]);

	var letterGap = 0;

	if (String(houseNumber).trim().slice(-1) === '1') {
		letterGap = 8;
	} else if (String(houseNumber).trim().slice(-1) === '2') {
		letterGap = 5;
	} else if (String(houseNumber).trim().slice(-1) === '3') {
		letterGap = 0;
	} else if (String(houseNumber).trim().slice(-1) === '4') {
		letterGap = 5;
	} else if (String(houseNumber).trim().slice(-1) === '5') {
		letterGap = 0;
	} else if (String(houseNumber).trim().slice(-1) === '6') {
		letterGap = 0;
	} else if (String(houseNumber).trim().slice(-1) === '7') {
		letterGap = -15;
	} else if (String(houseNumber).trim().slice(-1) === '8') {
		letterGap = 0;
	} else if (String(houseNumber).trim().slice(-1) === '9') {
		letterGap = 0;
	} else if (String(houseNumber).trim().slice(-1) === '0') {
		letterGap = 0;
	}


	// Рассчет ширины таблички: не меньше signHeight, иначе — по контенту
	var contentWidth = widthNumber + letterGap + widthLetter;
	var width = contentWidth + 50 + 50;
	signWidth = Math.max(width, signHeight);

	var startX = (signWidth - contentWidth) / 2;
	words[0].position.x = startX;
	words[1].position.x = startX + widthNumber + letterGap;

	let doc = new jsPDF({
		orientation: 'l',
		unit: 'mm',
		format: [signWidth, signHeight],
		putOnlyUsedFonts: true,
	});


	// Set properties on the document
	doc.setProperties({
		title: houseNumber + '' + houseLetter,
		subject: 'Табличка с номером и литерой, для многоквартирного дома',
		author: '',
		keywords: 'Генератор адресных табличек Ижевска',
	});


	/* 	// Проверка верстки
		doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
		doc.rect(0, 0, numberIndent, signHeight, 'F');
		doc.rect(signWidth - numberIndent, 0, numberIndent, signHeight, 'F');
		doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
		doc.rect(numberIndent, 0, signWidth - numberIndent - numberIndent, 80, 'F');
		doc.rect(numberIndent, signHeight - 80, signWidth - numberIndent - numberIndent, 80, 'F'); */

	// Draw text
	for (var i = 0; i < words.length; i++) {
		drawWord(doc, words[i]);
	}

	// Generate PNG preview
	generateNumberPreview(doc);

	// Save PDF only if savePDF is true
	if (savePDF) {
		doc.save(houseNumber + (houseLetter ? houseLetter : '') + '_' + signWidth + '×' + signHeight + '.pdf');
	}
}

// Табличка для ИЖС с названием и номером, 200 мм
function createIzhsPDF(savePDF) {
	// Получение значений из формы
	var streetType = $('#streetType').val();
	var streetName = getStreetNameRawValue();
	var streetNameUdm = $('#streetNameUdm').val();
	var streetTypeUdm = $('#streetTypeUdm').val();
	var houseNumber = $('#houseNumber').val();

	spaceValue = 23

	if (!isStreetNameValid(streetName)) {
		return;
	}

	// Объявление переменных
	// let i, word;

	// Объявление массива с текстом
	var words = [
		{
			// Родовое слово на русском языке
			'contents': streetType,
			'fontSize': 105,
			'fontTracking': 10,
			'align': 'left',
			'position': {
				'x': signIndent,
				'y': 76.556,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Название улицы на русском языке
			'contents': streetName,
			'fontSize': 170,
			'fontTracking': 20,
			'align': 'left',
			'position': {
				'x': 0,
				'y': 79.967,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': true,
		},
		{
			// Название улицы на удмуртском языке
			'contents': streetNameUdm,
			'fontSize': 170,
			'fontTracking': 20,
			'align': 'left',
			'position': {
				'x': signIndent,
				'y': 179.981,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Родовое слово на удмуртском языке
			'contents': streetTypeUdm,
			'fontSize': 105,
			'fontTracking': 10,
			'align': 'left',
			'position': {
				'x': 0,
				'y': 176.556,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': true,
		},
		// Номер дома
		{
			'contents': houseNumber,
			'fontSize': 350,
			'fontTracking': 20,
			'align': 'center',
			'position': {
				'x': 0,
				'y': 162.069,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': true,
		}
	];

	// Рассчет ширины слов
	var widthTypeRus = measureTextWidth(words[0]);
	var widthNameRus = measureTextWidth(words[1]);
	var widthNameUdm = measureTextWidth(words[2]);
	var widthTypeUdm = measureTextWidth(words[3]);
	var widthNumber = 140;

	signIndentIzhs = 30;
	spaceValueIzhs = 23;
	verticalDividerWidth = 5;
	// Рассчет ширины таблички
	var preWidth = Math.max((widthTypeRus + widthNameRus), (widthNameUdm + widthTypeUdm));
	var width = Math.round(signIndentIzhs * 4 + preWidth + spaceValueIzhs + widthNumber + verticalDividerWidth);
	// Set sign width
	signWidth = width;

	var verticalDividerPosition = signWidth - signIndentIzhs * 2 - widthNumber - verticalDividerWidth;

	let doc = new jsPDF({
		orientation: 'l',
		unit: 'mm',
		format: [signWidth, signHeightIzhs],
		putOnlyUsedFonts: true,
	});


	// Set properties on the document
	doc.setProperties({
		title: streetType + ' ' + streetName + ', ' + houseNumber,
		subject: 'Табличка с названием улицы и номером, для частного дома',
		author: '',
		keywords: 'Генератор адресных табличек Ижевска',
	});

	// Рисование фона
	// doc.setDrawColor(0);
	/* 	doc.setFillColor(fillColor.color.c / 100, fillColor.color.m / 100, fillColor.color.y / 100, fillColor.color.k / 100);
		doc.roundedRect(0, 0, signWidth, signHeightIzhs, signRadius, signRadius, 'F'); */

	// Рисование нижней линии
	// doc.setDrawColor(0);
	doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);
	doc.roundedRect(0, signHeightIzhs / 2, signWidth - signIndentIzhs * 2 - widthNumber, signHeightIzhs / 2, signRadius, signRadius, 'F');

	// Рисование разделителя
	doc.setDrawColor(0);
	doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);
	doc.roundedRect(verticalDividerPosition, 0, verticalDividerWidth, signHeightIzhs, 0, 0, 'F');




	/* // Проверка верстки

	// Левый отступ
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(0, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Правый отступ
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(signWidth - signIndentIzhs, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Отступ до разделителя
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(verticalDividerPosition - signIndentIzhs, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Отступ после разделителя
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(verticalDividerPosition + verticalDividerWidth, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Верхний отступ русского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 0, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')

	//Пробел русского текста
	doc.setFillColor(checkColor3.color.c / 100, checkColor3.color.m / 100, checkColor3.color.y / 100, checkColor3.color.k / 100);
	doc.rect(signIndentIzhs + widthTypeRus, 29, spaceValueIzhs, 42, 'F')

	// Нижний отступ русского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 71, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')

	// Верхний отступ удмуртского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 100, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')

	//Пробел удмуртского текста
	doc.setFillColor(checkColor3.color.c / 100, checkColor3.color.m / 100, checkColor3.color.y / 100, checkColor3.color.k / 100);
	doc.rect(signIndentIzhs + widthNameUdm, 129, spaceValueIzhs, 42, 'F')

	// Нижний отступ удмуртского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 171, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F') */


	var rightShiftValueRu = widthTypeRus + spaceValueIzhs + signIndentIzhs;
	var rightShiftValueUdm = widthNameUdm + spaceValueIzhs + signIndentIzhs;

	for (i = 0; i < words.length; i++) {

		// Сдвиг для русского родового слова (0) и удмуртского названия улицы (2)
		if (i == 0 || i == 2) {
			word = words[i];
			words[i].position.x = signIndentIzhs;
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);

			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeightIzhs, 'F');
			doc.internal.write('Q');
		} else if (i == 1) {
			// Сдвиг по оси X для русского названия улицы
			words[i].position.x = rightShiftValueRu - nameWordIndent;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeightIzhs, 'F');
			doc.internal.write('Q');
		} else if (i == 3) {
			// Сдвиг по оси X для удмуртского названия улицы
			words[i].position.x = rightShiftValueUdm - typeWordIndent;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeightIzhs, 'F');
			doc.internal.write('Q');
		} else {
			words[i].position.x = verticalDividerPosition + verticalDividerWidth + signIndentIzhs + 68.841;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeightIzhs, 'F');
			doc.internal.write('Q');
		}
	}



	// Generate PNG preview
	generateIzhsPreview(doc);

	// Save PDF only if savePDF is true
	if (savePDF) {
		doc.save(streetType + '_' + streetName + '_' + signWidth + '×' + signHeightIzhs + '.pdf');
	}
}

// !! Табличка для ИЖС с названием, номером и литерой, 200 мм
function createIzhsWithLetterPDF(savePDF) {
	// Получение значений из формы
	var streetType = $('#streetType').val();
	var streetName = getStreetNameRawValue();
	var streetNameUdm = $('#streetNameUdm').val();
	var streetTypeUdm = $('#streetTypeUdm').val();
	var houseNumber = $('#houseNumber').val();

	spaceValue = 23

	if (!isStreetNameValid(streetName)) {
		return;
	}

	// Объявление переменных
	// let i, word;

	// Объявление массива с текстом
	var words = [
		{
			// Родовое слово на русском языке
			'contents': streetType,
			'fontSize': 105,
			'fontTracking': 10,
			'align': 'left',
			'position': {
				'x': signIndent,
				'y': 76.556,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Название улицы на русском языке
			'contents': streetName,
			'fontSize': 170,
			'fontTracking': 20,
			'align': 'left',
			'position': {
				'x': 0,
				'y': 79.967,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': true,
		},
		{
			// Название улицы на удмуртском языке
			'contents': streetNameUdm,
			'fontSize': 170,
			'fontTracking': 20,
			'align': 'left',
			'position': {
				'x': signIndent,
				'y': 179.981,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Родовое слово на удмуртском языке
			'contents': streetTypeUdm,
			'fontSize': 105,
			'fontTracking': 10,
			'align': 'left',
			'position': {
				'x': 0,
				'y': 176.556,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': true,
		},
		// Номер дома
		{
			'contents': houseNumber,
			'fontSize': 350,
			'fontTracking': 20,
			'align': 'center',
			'position': {
				'x': 0,
				'y': 162.069,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': true,
		}
	];

	// Рассчет ширины слов
	var widthTypeRus = measureTextWidth(words[0]);
	var widthNameRus = measureTextWidth(words[1]);
	var widthNameUdm = measureTextWidth(words[2]);
	var widthTypeUdm = measureTextWidth(words[3]);
	var widthNumber = 140;

	signIndentIzhs = 30;
	spaceValueIzhs = 23;
	verticalDividerWidth = 5;
	// Рассчет ширины таблички
	var preWidth = Math.max((widthTypeRus + widthNameRus), (widthNameUdm + widthTypeUdm));
	var width = Math.round(signIndentIzhs * 4 + preWidth + spaceValueIzhs + widthNumber + verticalDividerWidth);
	// Set sign width
	signWidth = width;

	var verticalDividerPosition = signWidth - signIndentIzhs * 2 - widthNumber - verticalDividerWidth;

	let doc = new jsPDF({
		orientation: 'l',
		unit: 'mm',
		format: [signWidth, signHeightIzhs],
		putOnlyUsedFonts: true,
	});


	// Set properties on the document
	doc.setProperties({
		title: streetType + ' ' + streetName + ', ' + houseNumber,
		subject: 'Табличка с названием улицы и номером, для частного дома',
		author: '',
		keywords: 'Генератор адресных табличек Ижевска',
	});

	// Рисование фона
	// doc.setDrawColor(0);
	/* 	doc.setFillColor(fillColor.color.c / 100, fillColor.color.m / 100, fillColor.color.y / 100, fillColor.color.k / 100);
		doc.roundedRect(0, 0, signWidth, signHeightIzhs, signRadius, signRadius, 'F'); */

	// Рисование нижней линии
	// doc.setDrawColor(0);
	doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);
	doc.roundedRect(0, signHeightIzhs / 2, signWidth - signIndentIzhs * 2 - widthNumber, signHeightIzhs / 2, signRadius, signRadius, 'F');

	// Рисование разделителя
	doc.setDrawColor(0);
	doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);
	doc.roundedRect(verticalDividerPosition, 0, verticalDividerWidth, signHeightIzhs, 0, 0, 'F');




	// Проверка верстки

	// Левый отступ
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(0, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Правый отступ
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(signWidth - signIndentIzhs, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Отступ до разделителя
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(verticalDividerPosition - signIndentIzhs, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Отступ после разделителя
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(verticalDividerPosition + verticalDividerWidth, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Верхний отступ русского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 0, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')

	//Пробел русского текста
	doc.setFillColor(checkColor3.color.c / 100, checkColor3.color.m / 100, checkColor3.color.y / 100, checkColor3.color.k / 100);
	doc.rect(signIndentIzhs + widthTypeRus, 29, spaceValueIzhs, 42, 'F')

	// Нижний отступ русского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 71, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')

	// Верхний отступ удмуртского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 100, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')

	//Пробел удмуртского текста
	doc.setFillColor(checkColor3.color.c / 100, checkColor3.color.m / 100, checkColor3.color.y / 100, checkColor3.color.k / 100);
	doc.rect(signIndentIzhs + widthNameUdm, 129, spaceValueIzhs, 42, 'F')

	// Нижний отступ удмуртского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 171, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')


	var rightShiftValueRu = widthTypeRus + spaceValueIzhs + signIndentIzhs;
	var rightShiftValueUdm = widthNameUdm + spaceValueIzhs + signIndentIzhs;

	for (i = 0; i < words.length; i++) {

		// Сдвиг для русского родового слова (0) и удмуртского названия улицы (2)
		if (i == 0 || i == 2) {
			word = words[i];
			words[i].position.x = signIndentIzhs;
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);

			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeightIzhs, 'F');
			doc.internal.write('Q');
		} else if (i == 1) {
			// Сдвиг по оси X для русского названия улицы
			words[i].position.x = rightShiftValueRu - nameWordIndent;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeightIzhs, 'F');
			doc.internal.write('Q');
		} else if (i == 3) {
			// Сдвиг по оси X для удмуртского названия улицы
			words[i].position.x = rightShiftValueUdm - typeWordIndent;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeightIzhs, 'F');
			doc.internal.write('Q');
		} else {
			words[i].position.x = verticalDividerPosition + verticalDividerWidth + signIndentIzhs + 68.841;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeightIzhs, 'F');
			doc.internal.write('Q');
		}
	}



	// Generate PNG preview
	generateIzhsPreview(doc);

	// Save PDF only if savePDF is true
	if (savePDF) {
		doc.save(streetType + '_' + streetName + '_' + signWidth + '×' + signHeightIzhs + '.pdf');
	}
}

// !! Табличка для ИЖС с названием и номером для длинных титулов, 200 мм
function createIzhsTitlePDF(savePDF) {
	// Получение значений из формы
	var streetType = $('#streetType').val();
	var streetName = getStreetNameRawValue();
	var streetNameUdm = $('#streetNameUdm').val();
	var streetTypeUdm = $('#streetTypeUdm').val();
	var houseNumber = $('#houseNumber').val();

	spaceValue = 23

	if (!isStreetNameValid(streetName)) {
		return;
	}

	// Объявление переменных
	// let i, word;

	// Объявление массива с текстом
	var words = [
		{
			// Родовое слово на русском языке
			'contents': streetType,
			'fontSize': 105,
			'fontTracking': 10,
			'align': 'left',
			'position': {
				'x': signIndent,
				'y': 76.556,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Название улицы на русском языке
			'contents': streetName,
			'fontSize': 170,
			'fontTracking': 20,
			'align': 'left',
			'position': {
				'x': 0,
				'y': 79.967,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': true,
		},
		{
			// Название улицы на удмуртском языке
			'contents': streetNameUdm,
			'fontSize': 170,
			'fontTracking': 20,
			'align': 'left',
			'position': {
				'x': signIndent,
				'y': 179.981,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Родовое слово на удмуртском языке
			'contents': streetTypeUdm,
			'fontSize': 105,
			'fontTracking': 10,
			'align': 'left',
			'position': {
				'x': 0,
				'y': 176.556,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': true,
		},
		// Номер дома
		{
			'contents': houseNumber,
			'fontSize': 350,
			'fontTracking': 20,
			'align': 'center',
			'position': {
				'x': 0,
				'y': 162.069,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': true,
		}
	];

	// Рассчет ширины слов
	var widthTypeRus = measureTextWidth(words[0]);
	var widthNameRus = measureTextWidth(words[1]);
	var widthNameUdm = measureTextWidth(words[2]);
	var widthTypeUdm = measureTextWidth(words[3]);
	var widthNumber = 140;

	signIndentIzhs = 30;
	spaceValueIzhs = 23;
	verticalDividerWidth = 5;
	// Рассчет ширины таблички
	var preWidth = Math.max((widthTypeRus + widthNameRus), (widthNameUdm + widthTypeUdm));
	var width = Math.round(signIndentIzhs * 4 + preWidth + spaceValueIzhs + widthNumber + verticalDividerWidth);
	// Set sign width
	signWidth = width;

	var verticalDividerPosition = signWidth - signIndentIzhs * 2 - widthNumber - verticalDividerWidth;

	let doc = new jsPDF({
		orientation: 'l',
		unit: 'mm',
		format: [signWidth, signHeightIzhs],
		putOnlyUsedFonts: true,
	});


	// Set properties on the document
	doc.setProperties({
		title: streetType + ' ' + streetName + ', ' + houseNumber,
		subject: 'Табличка с названием улицы и номером, для частного дома',
		author: '',
		keywords: 'Генератор адресных табличек Ижевска',
	});

	// Рисование фона
	// doc.setDrawColor(0);
	/* 	doc.setFillColor(fillColor.color.c / 100, fillColor.color.m / 100, fillColor.color.y / 100, fillColor.color.k / 100);
		doc.roundedRect(0, 0, signWidth, signHeightIzhs, signRadius, signRadius, 'F'); */

	// Рисование нижней линии
	// doc.setDrawColor(0);
	doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);
	doc.roundedRect(0, signHeightIzhs / 2, signWidth - signIndentIzhs * 2 - widthNumber, signHeightIzhs / 2, signRadius, signRadius, 'F');

	// Рисование разделителя
	doc.setDrawColor(0);
	doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);
	doc.roundedRect(verticalDividerPosition, 0, verticalDividerWidth, signHeightIzhs, 0, 0, 'F');




	/* // Проверка верстки

	// Левый отступ
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(0, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Правый отступ
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(signWidth - signIndentIzhs, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Отступ до разделителя
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(verticalDividerPosition - signIndentIzhs, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Отступ после разделителя
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(verticalDividerPosition + verticalDividerWidth, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Верхний отступ русского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 0, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')

	//Пробел русского текста
	doc.setFillColor(checkColor3.color.c / 100, checkColor3.color.m / 100, checkColor3.color.y / 100, checkColor3.color.k / 100);
	doc.rect(signIndentIzhs + widthTypeRus, 29, spaceValueIzhs, 42, 'F')

	// Нижний отступ русского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 71, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')

	// Верхний отступ удмуртского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 100, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')

	//Пробел удмуртского текста
	doc.setFillColor(checkColor3.color.c / 100, checkColor3.color.m / 100, checkColor3.color.y / 100, checkColor3.color.k / 100);
	doc.rect(signIndentIzhs + widthNameUdm, 129, spaceValueIzhs, 42, 'F')

	// Нижний отступ удмуртского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 171, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F') */


	var rightShiftValueRu = widthTypeRus + spaceValueIzhs + signIndentIzhs;
	var rightShiftValueUdm = widthNameUdm + spaceValueIzhs + signIndentIzhs;

	for (i = 0; i < words.length; i++) {

		// Сдвиг для русского родового слова (0) и удмуртского названия улицы (2)
		if (i == 0 || i == 2) {
			word = words[i];
			words[i].position.x = signIndentIzhs;
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);

			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeightIzhs, 'F');
			doc.internal.write('Q');
		} else if (i == 1) {
			// Сдвиг по оси X для русского названия улицы
			words[i].position.x = rightShiftValueRu - nameWordIndent;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeightIzhs, 'F');
			doc.internal.write('Q');
		} else if (i == 3) {
			// Сдвиг по оси X для удмуртского названия улицы
			words[i].position.x = rightShiftValueUdm - typeWordIndent;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeightIzhs, 'F');
			doc.internal.write('Q');
		} else {
			words[i].position.x = verticalDividerPosition + verticalDividerWidth + signIndentIzhs + 68.841;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeightIzhs, 'F');
			doc.internal.write('Q');
		}
	}



	// Generate PNG preview
	generateIzhsPreview(doc);

	// Save PDF only if savePDF is true
	if (savePDF) {
		doc.save(streetType + '_' + streetName + '_' + signWidth + '×' + signHeightIzhs + '.pdf');
	}
}

// !! Табличка для ИЖС с названием, номером и литерой для длинных титулов, 200 мм
function createIzhsTitleWithLetterPDF(savePDF) {
	// Получение значений из формы
	var streetType = $('#streetType').val();
	var streetName = getStreetNameRawValue();
	var streetNameUdm = $('#streetNameUdm').val();
	var streetTypeUdm = $('#streetTypeUdm').val();
	var houseNumber = $('#houseNumber').val();

	spaceValue = 23

	if (!isStreetNameValid(streetName)) {
		return;
	}

	// Объявление переменных
	// let i, word;

	// Объявление массива с текстом
	var words = [
		{
			// Родовое слово на русском языке
			'contents': streetType,
			'fontSize': 105,
			'fontTracking': 10,
			'align': 'left',
			'position': {
				'x': signIndent,
				'y': 76.556,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Название улицы на русском языке
			'contents': streetName,
			'fontSize': 170,
			'fontTracking': 20,
			'align': 'left',
			'position': {
				'x': 0,
				'y': 79.967,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': true,
		},
		{
			// Название улицы на удмуртском языке
			'contents': streetNameUdm,
			'fontSize': 170,
			'fontTracking': 20,
			'align': 'left',
			'position': {
				'x': signIndent,
				'y': 179.981,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Родовое слово на удмуртском языке
			'contents': streetTypeUdm,
			'fontSize': 105,
			'fontTracking': 10,
			'align': 'left',
			'position': {
				'x': 0,
				'y': 176.556,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': true,
		},
		// Номер дома
		{
			'contents': houseNumber,
			'fontSize': 350,
			'fontTracking': 20,
			'align': 'center',
			'position': {
				'x': 0,
				'y': 162.069,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': true,
		}
	];

	// Рассчет ширины слов
	var widthTypeRus = measureTextWidth(words[0]);
	var widthNameRus = measureTextWidth(words[1]);
	var widthNameUdm = measureTextWidth(words[2]);
	var widthTypeUdm = measureTextWidth(words[3]);
	var widthNumber = 140;

	signIndentIzhs = 30;
	spaceValueIzhs = 23;
	verticalDividerWidth = 5;
	// Рассчет ширины таблички
	var preWidth = Math.max((widthTypeRus + widthNameRus), (widthNameUdm + widthTypeUdm));
	var width = Math.round(signIndentIzhs * 4 + preWidth + spaceValueIzhs + widthNumber + verticalDividerWidth);
	// Set sign width
	signWidth = width;

	var verticalDividerPosition = signWidth - signIndentIzhs * 2 - widthNumber - verticalDividerWidth;

	let doc = new jsPDF({
		orientation: 'l',
		unit: 'mm',
		format: [signWidth, signHeightIzhs],
		putOnlyUsedFonts: true,
	});


	// Set properties on the document
	doc.setProperties({
		title: streetType + ' ' + streetName + ', ' + houseNumber,
		subject: 'Табличка с названием улицы и номером, для частного дома',
		author: '',
		keywords: 'Генератор адресных табличек Ижевска',
	});

	// Рисование фона
	// doc.setDrawColor(0);
	/* 	doc.setFillColor(fillColor.color.c / 100, fillColor.color.m / 100, fillColor.color.y / 100, fillColor.color.k / 100);
		doc.roundedRect(0, 0, signWidth, signHeightIzhs, signRadius, signRadius, 'F'); */

	// Рисование нижней линии
	// doc.setDrawColor(0);
	doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);
	doc.roundedRect(0, signHeightIzhs / 2, signWidth - signIndentIzhs * 2 - widthNumber, signHeightIzhs / 2, signRadius, signRadius, 'F');

	// Рисование разделителя
	doc.setDrawColor(0);
	doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);
	doc.roundedRect(verticalDividerPosition, 0, verticalDividerWidth, signHeightIzhs, 0, 0, 'F');




	// Проверка верстки

	// Левый отступ
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(0, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Правый отступ
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(signWidth - signIndentIzhs, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Отступ до разделителя
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(verticalDividerPosition - signIndentIzhs, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Отступ после разделителя
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(verticalDividerPosition + verticalDividerWidth, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Верхний отступ русского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 0, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')

	//Пробел русского текста
	doc.setFillColor(checkColor3.color.c / 100, checkColor3.color.m / 100, checkColor3.color.y / 100, checkColor3.color.k / 100);
	doc.rect(signIndentIzhs + widthTypeRus, 29, spaceValueIzhs, 42, 'F')

	// Нижний отступ русского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 71, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')

	// Верхний отступ удмуртского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 100, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')

	//Пробел удмуртского текста
	doc.setFillColor(checkColor3.color.c / 100, checkColor3.color.m / 100, checkColor3.color.y / 100, checkColor3.color.k / 100);
	doc.rect(signIndentIzhs + widthNameUdm, 129, spaceValueIzhs, 42, 'F')

	// Нижний отступ удмуртского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 171, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')


	var rightShiftValueRu = widthTypeRus + spaceValueIzhs + signIndentIzhs;
	var rightShiftValueUdm = widthNameUdm + spaceValueIzhs + signIndentIzhs;

	for (i = 0; i < words.length; i++) {

		// Сдвиг для русского родового слова (0) и удмуртского названия улицы (2)
		if (i == 0 || i == 2) {
			word = words[i];
			words[i].position.x = signIndentIzhs;
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);

			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeightIzhs, 'F');
			doc.internal.write('Q');
		} else if (i == 1) {
			// Сдвиг по оси X для русского названия улицы
			words[i].position.x = rightShiftValueRu - nameWordIndent;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeightIzhs, 'F');
			doc.internal.write('Q');
		} else if (i == 3) {
			// Сдвиг по оси X для удмуртского названия улицы
			words[i].position.x = rightShiftValueUdm - typeWordIndent;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeightIzhs, 'F');
			doc.internal.write('Q');
		} else {
			words[i].position.x = verticalDividerPosition + verticalDividerWidth + signIndentIzhs + 68.841;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidth, signHeightIzhs, 'F');
			doc.internal.write('Q');
		}
	}



	// Generate PNG preview
	generateIzhsPreview(doc);

	// Save PDF only if savePDF is true
	if (savePDF) {
		doc.save(streetType + '_' + streetName + '_' + signWidth + '×' + signHeightIzhs + '.pdf');
	}
}

// Табличка для ИЖС с номером, 200 мм
function createIzhsNumberPDF(savePDF) {
	var houseNumber = $('#houseNumber').val();
	var words = [{
		'contents': houseNumber,
		'fontSize': 352.1,
		'fontTracking': 20,
		'align': 'left',
		'position': { 'x': 0, 'y': 162.111 },
		'font': 'IZH-260-A',
		'fontStyle': 'normal',
		'color': Object.assign({}, backColor.color),
		'rightShift': false,
	}];

	var widthNumber = measureTextWidth(words[0]);
	// signHeight = signHeightIzhs;
	signWidth = signHeightIzhs;
	words[0].position.x = (signWidth - widthNumber) / 2;

	var doc = new jsPDF({
		orientation: 'l',
		unit: 'mm',
		format: [signWidth, signHeightIzhs],
		putOnlyUsedFonts: true,
	});

	doc.setProperties({
		title: houseNumber,
		subject: 'Табличка с номером, для частного дома',
		author: '',
		keywords: 'Генератор адресных табличек Ижевска',
	});
	/* 
		// Проверка верстки
		doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	
		doc.rect(0, 0, 30, signHeight, 'F');
		doc.rect(signWidth - 30, 0, 30, signHeight, 'F');
	
		doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
		doc.rect(30, 0, signWidth - 60, 56.5, 'F');
		doc.rect(30, signHeight - 56.5, signWidth - 60, 56.5, 'F'); */


	// Draw text
	drawWord(doc, words[0]);

	generateIzhsNumberPreview(doc);

	if (savePDF) {
		doc.save(houseNumber + '_' + signWidth + '×' + signHeightIzhs + '.pdf');
	}
}

// !! Табличка для ИЖС с номером и литерой, 200 мм
function createIzhsNumberWithLetterPDF(savePDF) {
	var houseNumber = $('#houseNumber').val();
	var words = [{
		'contents': houseNumber,
		'fontSize': 352.1,
		'fontTracking': 20,
		'align': 'left',
		'position': { 'x': 0, 'y': 162.111 },
		'font': 'IZH-260-A',
		'fontStyle': 'normal',
		'color': Object.assign({}, backColor.color),
		'rightShift': false,
	}];

	var widthNumber = measureTextWidth(words[0]);
	// signHeight = signHeightIzhs;
	signWidth = signHeightIzhs;
	words[0].position.x = (signWidth - widthNumber) / 2;

	var doc = new jsPDF({
		orientation: 'l',
		unit: 'mm',
		format: [signWidth, signHeightIzhs],
		putOnlyUsedFonts: true,
	});

	doc.setProperties({
		title: houseNumber,
		subject: 'Табличка с номером, для частного дома',
		author: '',
		keywords: 'Генератор адресных табличек Ижевска',
	});

	// Проверка верстки
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);

	doc.rect(0, 0, 30, signHeight, 'F');
	doc.rect(signWidth - 30, 0, 30, signHeight, 'F');

	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(30, 0, signWidth - 60, 56.5, 'F');
	doc.rect(30, signHeight - 56.5, signWidth - 60, 56.5, 'F');


	// Draw text
	drawWord(doc, words[0]);

	generateIzhsNumberPreview(doc);

	if (savePDF) {
		doc.save(houseNumber + '_' + signWidth + '×' + signHeightIzhs + '.pdf');
	}
}

// Табличка для ОКН, 400x600 мм
function createOknPDF(savePDF) {	// Получение значений из формы
	var streetType = $('#streetType').val();
	var streetName = getStreetNameRawValue();
	var streetNameUdm = $('#streetNameUdm').val();
	var streetTypeUdm = $('#streetTypeUdm').val();
	var houseNumber = $('#houseNumber').val();

	var oknErrEl = document.getElementById('okn-input-error');
	if (oknErrEl) oknErrEl.classList.remove('visible');

	if (!isStreetNameValid(streetName)) {
		return;
	}
	if (!isStreetOkn(streetType, streetName)) {
		if (oknErrEl) oknErrEl.classList.add('visible');
		return;
	}

	// Объявление переменных
	// let i, word;

	// Объявление массива с текстом
	var words = [
		{
			// Родовое слово на русском языке
			'contents': streetType,
			'fontSize': 85,
			'fontTracking': 0,
			'align': 'center',
			'position': {
				'x': signIndent,
				'y': 339.502,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Название улицы на русском языке
			'contents': streetName,
			'fontSize': 121.49,
			'fontTracking': 20,
			'align': 'center',
			'position': {
				'x': 0,
				'y': 396.428,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': true,
		},
		{
			// Название улицы на удмуртском языке
			'contents': streetNameUdm,
			'fontSize': 121.49,
			'fontTracking': 20,
			'align': 'center',
			'position': {
				'x': signIndent,
				'y': 516.448,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Родовое слово на удмуртском языке
			'contents': streetTypeUdm,
			'fontSize': 85,
			'fontTracking': 0,
			'align': 'center',
			'position': {
				'x': 0,
				'y': 554.498,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': true,
		},
		// Номер дома
		{
			'contents': houseNumber,
			'fontSize': 850,
			'fontTracking': 10,
			'align': 'center',
			'position': {
				'x': 0,
				'y': 323.979,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': true,
		}
	];

	// Рассчет ширины слов
	/* 	var widthTypeRus = measureTextWidth(words[0]);
		var widthNameRus = measureTextWidth(words[1]);
		var widthNameUdm = measureTextWidth(words[2]);
		var widthTypeUdm = measureTextWidth(words[3]);
		var widthNumber = measureTextWidth(words[4]); */

	let doc = new jsPDF({
		orientation: 'p',
		unit: 'mm',
		format: [signWidthOkn, signHeightOkn],
		putOnlyUsedFonts: true,
	});


	// Set properties on the document
	doc.setProperties({
		title: streetType + ' ' + streetName + ', ' + houseNumber,
		subject: 'Табличка с названием улицы и номером, для объектов культрного наследия',
		author: '',
		keywords: 'Генератор адресных табличек Ижевска',
	});

	// Рисование фона
	// doc.setDrawColor(0);
	/* 	doc.setFillColor(fillColor.color.c / 100, fillColor.color.m / 100, fillColor.color.y / 100, fillColor.color.k / 100);
		doc.roundedRect(0, 0, signWidth, signHeightIzhs, signRadius, signRadius, 'F'); */

	// Рисование нижней линии
	// doc.setDrawColor(0);
	doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);
	doc.roundedRect(0, signHeightOkn - 170, signWidthOkn, 170, signRadius, signRadius, 'F');

	/* // Проверка верстки

	// Левый отступ
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(0, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Правый отступ
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(signWidth - signIndentIzhs, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Отступ до разделителя
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(verticalDividerPosition - signIndentIzhs, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Отступ после разделителя
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(verticalDividerPosition + verticalDividerWidth, 0, signIndentIzhs, signHeightIzhs, 'F')

	// Верхний отступ русского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 0, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')

	//Пробел русского текста
	doc.setFillColor(checkColor3.color.c / 100, checkColor3.color.m / 100, checkColor3.color.y / 100, checkColor3.color.k / 100);
	doc.rect(signIndentIzhs + widthTypeRus, 29, spaceValueIzhs, 42, 'F')

	// Нижний отступ русского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 71, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')

	// Верхний отступ удмуртского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 100, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F')

	//Пробел удмуртского текста
	doc.setFillColor(checkColor3.color.c / 100, checkColor3.color.m / 100, checkColor3.color.y / 100, checkColor3.color.k / 100);
	doc.rect(signIndentIzhs + widthNameUdm, 129, spaceValueIzhs, 42, 'F')

	// Нижний отступ удмуртского текста
	doc.setFillColor(checkColor2.color.c / 100, checkColor2.color.m / 100, checkColor2.color.y / 100, checkColor2.color.k / 100);
	doc.rect(signIndentIzhs, 171, signWidth - signIndentIzhs * 3 - widthNumber - verticalDividerWidth, 29, 'F') */


	// var rightShiftValueRu = widthTypeRus + spaceValueIzhs + signIndentIzhs;
	// var rightShiftValueUdm = widthNameUdm + spaceValueIzhs + signIndentIzhs;

	var xCenter = 197.936;

	for (i = 0; i < words.length; i++) {

		// Сдвиг для русского родового слова (0) и удмуртского названия улицы (2)
		if (i == 0 || i == 2) {
			word = words[i];
			words[i].position.x = xCenter;
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);

			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidthOkn, signHeightOkn, 'F');
			doc.internal.write('Q');
		} else if (i == 1) {
			// Сдвиг по оси X для русского названия улицы
			words[i].position.x = xCenter;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidthOkn, signHeightOkn, 'F');
			doc.internal.write('Q');
		} else if (i == 3) {
			// Сдвиг по оси X для удмуртского названия улицы
			words[i].position.x = xCenter;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidthOkn, signHeightOkn, 'F');
			doc.internal.write('Q');
		} else {
			words[i].position.x = xCenter;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidthOkn, signHeightOkn, 'F');
			doc.internal.write('Q');
		}
	}



	// Generate PNG preview
	generateOknPreview(doc);

	// Save PDF only if savePDF is true
	if (savePDF) {
		doc.save(streetType + '_' + streetName + '_' + houseNumber + '_' + signWidthOkn + '×' + signHeightOkn + '.pdf');
	}
}

// !! Табличка для ОКН с литерой, 400x600 мм
function createOknWithLetterPDF(savePDF) {	// Получение значений из формы
	var streetType = $('#streetType').val();
	var streetName = getStreetNameRawValue();
	var streetNameUdm = $('#streetNameUdm').val();
	var streetTypeUdm = $('#streetTypeUdm').val();
	var houseNumber = $('#houseNumber').val();

	var oknErrEl = document.getElementById('okn-input-error');
	if (oknErrEl) oknErrEl.classList.remove('visible');

	if (!isStreetNameValid(streetName)) {
		return;
	}
	if (!isStreetOkn(streetType, streetName)) {
		if (oknErrEl) oknErrEl.classList.add('visible');
		return;
	}

	// Объявление переменных
	// let i, word;

	// Объявление массива с текстом
	var words = [
		{
			// Родовое слово на русском языке
			'contents': streetType,
			'fontSize': 85,
			'fontTracking': 0,
			'align': 'center',
			'position': {
				'x': signIndent,
				'y': 339.502,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Название улицы на русском языке
			'contents': streetName,
			'fontSize': 121.49,
			'fontTracking': 20,
			'align': 'center',
			'position': {
				'x': 0,
				'y': 396.428,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': true,
		},
		{
			// Название улицы на удмуртском языке
			'contents': streetNameUdm,
			'fontSize': 121.49,
			'fontTracking': 20,
			'align': 'center',
			'position': {
				'x': signIndent,
				'y': 516.448,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': false,
		},
		{
			// Родовое слово на удмуртском языке
			'contents': streetTypeUdm,
			'fontSize': 85,
			'fontTracking': 0,
			'align': 'center',
			'position': {
				'x': 0,
				'y': 554.498,
			},
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color), // Копируем объект цвета
			'rightShift': true,
		},
		// Номер дома
		{
			'contents': houseNumber,
			'fontSize': 850,
			'fontTracking': 10,
			'align': 'center',
			'position': {
				'x': 0,
				'y': 323.979,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color), // Копируем объект цвета
			'rightShift': true,
		}
	];

	// Рассчет ширины слов
	/* 	var widthTypeRus = measureTextWidth(words[0]);
		var widthNameRus = measureTextWidth(words[1]);
		var widthNameUdm = measureTextWidth(words[2]);
		var widthTypeUdm = measureTextWidth(words[3]);
		var widthNumber = measureTextWidth(words[4]); */

	let doc = new jsPDF({
		orientation: 'p',
		unit: 'mm',
		format: [signWidthOkn, signHeightOkn],
		putOnlyUsedFonts: true,
	});


	// Set properties on the document
	doc.setProperties({
		title: streetType + ' ' + streetName + ', ' + houseNumber,
		subject: 'Табличка с названием улицы и номером, для объектов культрного наследия',
		author: '',
		keywords: 'Генератор адресных табличек Ижевска',
	});

	// Рисование фона
	// doc.setDrawColor(0);
	/* 	doc.setFillColor(fillColor.color.c / 100, fillColor.color.m / 100, fillColor.color.y / 100, fillColor.color.k / 100);
		doc.roundedRect(0, 0, signWidth, signHeightIzhs, signRadius, signRadius, 'F'); */

	// Рисование нижней линии
	// doc.setDrawColor(0);
	doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);
	doc.roundedRect(0, signHeightOkn - 170, signWidthOkn, 170, signRadius, signRadius, 'F');

	// Проверка верстки

	// Левый отступ
	doc.setFillColor(checkColor1.color.c / 100, checkColor1.color.m / 100, checkColor1.color.y / 100, checkColor1.color.k / 100);
	doc.rect(0, 0, 300, 120, 'F')




	var xCenter = 197.936;

	for (i = 0; i < words.length; i++) {

		// Сдвиг для русского родового слова (0) и удмуртского названия улицы (2)
		if (i == 0 || i == 2) {
			word = words[i];
			words[i].position.x = xCenter;
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);

			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidthOkn, signHeightOkn, 'F');
			doc.internal.write('Q');
		} else if (i == 1) {
			// Сдвиг по оси X для русского названия улицы
			words[i].position.x = xCenter;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidthOkn, signHeightOkn, 'F');
			doc.internal.write('Q');
		} else if (i == 3) {
			// Сдвиг по оси X для удмуртского названия улицы
			words[i].position.x = xCenter;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidthOkn, signHeightOkn, 'F');
			doc.internal.write('Q');
		} else {
			words[i].position.x = xCenter;
			word = words[i];
			doc.internal.write('q');
			doc.setFont(word.font);
			doc.setFontStyle(word.fontStyle);
			doc.setFontSize(word.fontSize);
			doc.setTextColor(
				cmykVal(word.color.c),
				cmykVal(word.color.m),
				cmykVal(word.color.y),
				cmykVal(word.color.k)
			);
			doc.text(
				word.contents,
				word.position.x,
				word.position.y,
				{
					'baseline': 'bottom',
					'charSpace': getCharSpace(word.fontSize, word.fontTracking),
					// 'lineHeightFactor': word.fontLeading / word.fontSize,
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidthOkn, signHeightOkn, 'F');
			doc.internal.write('Q');
		}
	}



	// Generate PNG preview
	generateOknPreview(doc);

	// Save PDF only if savePDF is true
	if (savePDF) {
		doc.save(streetType + '_' + streetName + '_' + houseNumber + '_' + signWidthOkn + '×' + signHeightOkn + '.pdf');
	}
}

// Создание таблички с названием улицы (сохраняет PDF)
function createNamePDF() {
	var streetType = $('#streetType').val();
	var streetName = getStreetNameRawValue();
	if (isStreetHeroStreet(streetType, streetName)) {
		createStreetNameTitlePDF(true);
	} else {
		createStreetNamePDF(true);
	}
}

// Генерация только превью без сохранения PDF
function generatePreviewOnly() {
	var houseNumber = $('#houseNumber').val();
	if (!houseNumber || houseNumber.trim() === '') return;
	if (!houseNumberRegex.test(houseNumber.trim())) return;

	if (currentPreviewTab === 'izhs') {
		var letterIzhs = ($('#houseLetter').val() || '').trim();
		if (letterIzhs !== '' && houseLetterRegex.test(letterIzhs)) {
			var streetTypeIzhs = $('#streetType').val();
			var streetNameIzhs = getStreetNameRawValue();
			if (isStreetHeroStreet(streetTypeIzhs, streetNameIzhs)) {
				createIzhsTitleWithLetterPDF(false);
			} else {
				createIzhsWithLetterPDF(false);
			}
			createIzhsNumberWithLetterPDF(false);
		} else {
			createIzhsPDF(false);
			createIzhsNumberPDF(false);
		}
		return;
	}
	if (currentPreviewTab === 'okn') {
		var streetType = $('#streetType').val();
		var streetName = getStreetNameRawValue();
		var oknErrEl = document.getElementById('okn-input-error');
		if (!isStreetOkn(streetType, streetName)) {
			if (oknErrEl) oknErrEl.classList.add('visible');
			return;
		}
		if (oknErrEl) oknErrEl.classList.remove('visible');
		var letterOkn = ($('#houseLetter').val() || '').trim();
		if (letterOkn !== '' && houseLetterRegex.test(letterOkn)) {
			createOknWithLetterPDF(false);
		} else {
			createOknPDF(false);
		}
		return;
	}
	var streetType = $('#streetType').val();
	var streetName = getStreetNameRawValue();
	if (!streetName || streetName.trim() === '') return;
	if (!isStreetNameValid(streetName)) return;
	if (isStreetHeroStreet(streetType, streetName)) {
		createStreetNameTitlePDF(false);
	} else {
		createStreetNamePDF(false);
	}
	var letter = ($('#houseLetter').val() || '').trim();
	if (letter === '') {
		createNumberPDF(false);
	} else if (houseLetterRegex.test(letter)) {
		createNumberWithLetterPDF(false);
	}
}


//* ПЕРЕМЕННЫЕ И НАСТРОЙКИ *//

// Конвертация пунктов и емов в миллиметры
const PT_TO_MM = 2.8346456692913;
const EM_TO_MM = 0.3514598035146;

// Рассчет трекинга
function getCharSpace(fontSize, trackingValue) {
	return fontSize * EM_TO_MM * trackingValue / 1000;
}

// Установка высоты линии
/* 	var lineH = 1.4;
	var lineY = 152.3; */

// Конвертация CMYK в строку
function cmykVal(num) {
	return (num / 100).toString();
}

// Параметры превью
let previewDelay = 0
let previewScale = .5

// Плейсхолдеры при загрузке
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



//* ПОЛУЧЕНИЕ ЗНАЧЕНИЙ ИЗ ФОРМЫ *//

// Список названий из sign-suggest-list.json (загружается при готовности документа)
var validStreetNames = null;

// Полный список улиц из sign-suggest-list.json (для проверки isOKN)
var signSuggestList = null;

// Получение значения из поля #streetNameRaw
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

/** Улица помечена как «геройская» (isHeroStreet: true) — использовать createStreetNamePDF(…, true) */
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



//* ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ПДФ *//

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



//* ГЕНЕРАЦИЯ ПДФ И ПРЕВЬЮ *//
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

	$.getJSON('js/generator/sign-suggest-list.json').done(function (data) {
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
			createNumberPDF(true, false);
		} else if (houseLetterRegex.test(letter)) {
			createNumberPDF(true, true);
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

//* ГЕНЕРАЦИЯ ПРЕВЬЮ PNG *//
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



// Создание таблички с названием улицы (сохраняет PDF)
function createNamePDF() {
	var streetType = $('#streetType').val();
	var streetName = getStreetNameRawValue();
	if (isStreetHeroStreet(streetType, streetName)) {
		createStreetNamePDF(true, true);
	} else {
		createStreetNamePDF(true, false);
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
		createStreetNamePDF(false, true);
	} else {
		createStreetNamePDF(false, false);
	}
	var letter = ($('#houseLetter').val() || '').trim();
	if (letter === '') {
		createNumberPDF(false, false);
	} else if (houseLetterRegex.test(letter)) {
		createNumberPDF(false, true);
	}
}
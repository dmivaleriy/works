// savePDF: true — сохранить PDF, false — только превью. withTitle: true — табличка с типом улицы в две строки. withLetter: true — номер + литера

// Табличка с названием, 280 мм
function createStreetNamePDF(savePDF, withTitle) {
	var streetType = $('#streetType').val();
	var streetName = getStreetNameRawValue();
	var streetNameUdm = $('#streetNameUdm').val();
	var streetTypeUdm = $('#streetTypeUdm').val();
	var titleRu = '';
	var titleUdm = '';
	if (withTitle) {
		var entry = getStreetEntry(streetType, streetName);
		titleRu = (entry && entry.titleRu) ? entry.titleRu : ($('#titleRu').length ? $('#titleRu').val() : '') || 'Героя';
		titleUdm = (entry && entry.titleUdm) ? entry.titleUdm : ($('#titleUdm').length ? $('#titleUdm').val() : '') || 'Героез';
	}
	if (!isStreetNameValid(streetName)) return;

	var typeFontSize = withTitle ? 100 : 153;
	var typeYRu = withTitle ? 62.931 : 108.096;
	var typeYUdm = withTitle ? 245.292 : 248.096;

	var words = [
		{
			'contents': streetType,
			'fontSize': typeFontSize,
			'fontTracking': 10,
			'align': 'left',
			'position': { 'x': signIndent, 'y': typeYRu },
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color),
			'rightShift': false,
		},
		{
			'contents': streetName,
			'fontSize': 242.94,
			'fontTracking': 20,
			'align': 'left',
			'position': { 'x': 0, 'y': 112.806 },
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color),
			'rightShift': true,
		},
		{
			'contents': streetNameUdm,
			'fontSize': 242.94,
			'fontTracking': 20,
			'align': 'left',
			'position': { 'x': signIndent, 'y': 252.806 },
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color),
			'rightShift': false,
		},
		{
			'contents': streetTypeUdm,
			'fontSize': typeFontSize,
			'fontTracking': 10,
			'align': 'left',
			'position': { 'x': 0, 'y': typeYUdm },
			'font': 'IZH-260-T',
			'fontStyle': 'normal',
			'color': Object.assign({}, fillColor.color),
			'rightShift': true,
		},
	];
	if (withTitle) {
		words.push(
			{
				'contents': titleRu,
				'fontSize': 100,
				'fontTracking': 10,
				'align': 'left',
				'position': { 'x': signIndent, 'y': 105.291 },
				'font': 'IZH-260-T',
				'fontStyle': 'normal',
				'color': Object.assign({}, backColor.color),
				'rightShift': false,
			},
			{
				'contents': titleUdm,
				'fontSize': 100,
				'fontTracking': 10,
				'align': 'left',
				'position': { 'x': signIndent, 'y': 202.938 },
				'font': 'IZH-260-T',
				'fontStyle': 'normal',
				'color': Object.assign({}, fillColor.color),
				'rightShift': false,
			}
		);
	}

	var widthTypeRus = measureTextWidth(words[0]);
	var widthNameRus = measureTextWidth(words[1]);
	var widthNameUdm = measureTextWidth(words[2]);
	var widthTypeUdm = measureTextWidth(words[3]);
	var width, rightShiftValueRu, rightShiftValueUdm, widthTypeTop;
	if (withTitle) {
		var widthTitleRus = measureTextWidth(words[4]);
		var widthTitleUdm = measureTextWidth(words[5]);
		widthTypeTop = Math.max(widthTypeRus, widthTitleRus);
		var widthTypeBottom = Math.max(widthTypeUdm, widthTitleUdm);
		var widthRusBlock = widthTypeTop + widthNameRus;
		var widthUdmBlock = widthTypeBottom + widthNameUdm;
		var maxWidth = Math.max(widthRusBlock, widthUdmBlock);
		width = Math.round(signIndent * 2 + maxWidth + spaceValue);
		rightShiftValueRu = widthTypeTop + spaceValue + signIndent;
		rightShiftValueUdm = widthNameUdm + spaceValue + signIndent;
	} else {
		var preWidth = Math.max((widthTypeRus + widthNameRus), (widthNameUdm + widthTypeUdm));
		width = Math.round(signIndent * 2 + preWidth + spaceValue);
		rightShiftValueRu = widthTypeRus + spaceValue + signIndent;
		rightShiftValueUdm = widthNameUdm + spaceValue + signIndent;
	}
	signWidth = width;

	var doc = new jsPDF({
		orientation: 'l',
		unit: 'mm',
		format: [signWidth, signHeight],
		putOnlyUsedFonts: true,
	});
	doc.setProperties({
		title: withTitle ? (streetType + ' ' + titleRu + ' ' + streetName) : (streetType + ' ' + streetName),
		subject: 'Табличка с названием улицы, для многоквартирного дома',
		author: '',
		keywords: 'Генератор адресных табличек Ижевска',
	});

	doc.setFillColor(fillColor.color.c / 100, fillColor.color.m / 100, fillColor.color.y / 100, fillColor.color.k / 100);
	doc.roundedRect(0, 0, signWidth, signHeight, signRadius, signRadius, 'F');
	doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);
	doc.roundedRect(0, signHeight / 2, signWidth, signHeight / 2, signRadius, signRadius, 'F');

	for (var i = 0; i < words.length; i++) {
		if (i === 0 || i === 2) {
			words[i].position.x = words[i].position.x - typeWordIndent;
		} else if (i === 1) {
			words[i].position.x = withTitle ? (signIndent + widthTypeTop + spaceValue) : (rightShiftValueRu - nameWordIndent);
		} else if (i === 3) {
			words[i].position.x = rightShiftValueUdm - typeWordIndent;
		} else if (withTitle && i === 4) {
			words[i].position.x = signIndent;
		} else if (withTitle && i === 5) {
			words[i].position.x = rightShiftValueUdm - typeWordIndent;
		}
		drawWord(doc, words[i]);
	}

	if (withTitle) generateNameTitlePreview(doc); else generateNamePreview(doc);
	if (savePDF) {
		doc.save(withTitle ? (streetType + '_' + titleRu + '_' + streetName + '_' + signWidth + '×' + signHeight + '.pdf') : (streetType + '_' + streetName + '_' + signWidth + '×' + signHeight + '.pdf'));
	}
}

// Табличка с номером, 280 мм 
function createNumberPDF(savePDF, withLetter) {
	var houseNumber = $('#houseNumber').val();
	var houseLetter = withLetter ? $('#houseLetter').val() : '';

	var words = [{
		'contents': houseNumber,
		'fontSize': 485.93,
		'fontTracking': withLetter ? 20 : 0,
		'align': 'left',
		'position': { 'x': 0, 'y': 225.7 },
		'font': 'IZH-260-A',
		'fontStyle': 'normal',
		'color': Object.assign({}, backColor.color),
		'rightShift': false,
	}];
	if (withLetter && houseLetter) {
		words.push({
			'contents': '/' + houseLetter,
			'fontSize': 262,
			'fontTracking': 10,
			'align': 'left',
			'position': { 'x': 0, 'y': 213.944 },
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color),
			'rightShift': false,
		});
	}

	var widthNumber = measureTextWidth(words[0]);
	if (words.length === 1) {
		signWidth = signHeight;
		words[0].position.x = (numberWidth - widthNumber) / 2;
	} else {
		var widthLetter = measureTextWidth(words[1]);
		var lastDigit = String(houseNumber).trim().slice(-1);
		var letterGap = (lastDigit === '1') ? 8 : (lastDigit === '2' || lastDigit === '4') ? 5 : (lastDigit === '7') ? -15 : 0;
		var contentWidth = widthNumber + letterGap + widthLetter;
		signWidth = Math.max(contentWidth + 100, signHeight);
		var startX = (signWidth - contentWidth) / 2;
		words[0].position.x = startX;
		words[1].position.x = startX + widthNumber + letterGap;
	}

	var doc = new jsPDF({
		orientation: 'l',
		unit: 'mm',
		format: [signWidth, signHeight],
		putOnlyUsedFonts: true,
	});
	doc.setProperties({
		title: houseNumber + (houseLetter || ''),
		subject: withLetter ? 'Табличка с номером и литерой, для многоквартирного дома' : 'Табличка с номером, для многоквартирного дома',
		author: '',
		keywords: 'Генератор адресных табличек Ижевска',
	});

	for (var i = 0; i < words.length; i++) {
		drawWord(doc, words[i]);
	}
	generateNumberPreview(doc);
	if (savePDF) {
		doc.save(houseNumber + (houseLetter || '') + '_' + signWidth + '×' + signHeight + '.pdf');
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
	var houseLetter = $('#houseLetter').val();

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
		},
		// Литера дома
		{
			'contents': houseLetter,
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

// Табличка для ИЖС с названием и номером для длинных титулов, 200 мм
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
	var houseLetter = $('#houseLetter').val();

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
		},
		// Литера дома
		{
			'contents': houseLetter,
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

// Табличка для ИЖС с номером и литерой, 200 мм
function createIzhsNumberWithLetterPDF(savePDF) {
	var houseNumber = $('#houseNumber').val();
	var houseLetter = $('#houseLetter').val();
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
	}, {
		'contents': '/' + houseLetter,
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
	var widthLetter = measureTextWidth(words[1]);
	var lastDigit = String(houseNumber).trim().slice(-1);
	var letterGap = (lastDigit === '1') ? 8 : (lastDigit === '2' || lastDigit === '4') ? 5 : (lastDigit === '7') ? -15 : 0;
	var contentWidth = widthNumber + letterGap + widthLetter;
	signWidth = signHeightIzhs;
	var startX = (signWidth - contentWidth) / 2;
	words[0].position.x = startX;
	words[1].position.x = startX + widthNumber + letterGap;

	var doc = new jsPDF({
		orientation: 'l',
		unit: 'mm',
		format: [signWidth, signHeightIzhs],
		putOnlyUsedFonts: true,
	});

	doc.setProperties({
		title: houseNumber + (houseLetter || ''),
		subject: 'Табличка с номером и литерой, для частного дома',
		author: '',
		keywords: 'Генератор адресных табличек Ижевска',
	});

	for (var i = 0; i < words.length; i++) {
		drawWord(doc, words[i]);
	}

	generateIzhsNumberPreview(doc);

	if (savePDF) {
		doc.save(houseNumber + (houseLetter || '') + '_' + signWidth + '×' + signHeightIzhs + '.pdf');
	}
}




// Табличка для ОКН, 400x600 мм
function createOknPDF(savePDF) {	// Получение значений из формы
	var streetType = $('#streetType').val();
	var streetName = getStreetNameRawValue();
	var streetNameUdm = $('#streetNameUdm').val();
	var streetTypeUdm = $('#streetTypeUdm').val();
	var houseNumber = $('#houseNumber').val();
	var houseLetter = ''; // не используется, для единого формата doc.save с createOknWithLetterPDF

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
	words[4].position.x = xCenter;

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
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidthOkn, signHeightOkn, 'F');
			doc.internal.write('Q');
		} else if (i == 4 || i == 5) {
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
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidthOkn, signHeightOkn, 'F');
			doc.internal.write('Q');
		}
	}

	generateOknPreview(doc);

	if (savePDF) {
		doc.save(streetType + '_' + streetName + '_' + houseNumber + (houseLetter || '') + '_' + signWidthOkn + '×' + signHeightOkn + '.pdf');
	}
}

// !! Табличка для ОКН с литерой, 400x600 мм
function createOknWithLetterPDF(savePDF) {	// Получение значений из формы
	var streetType = $('#streetType').val();
	var streetName = getStreetNameRawValue();
	var streetNameUdm = $('#streetNameUdm').val();
	var streetTypeUdm = $('#streetTypeUdm').val();
	var houseNumber = $('#houseNumber').val();
	var houseLetter = $('#houseLetter').val();

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
			'align': 'left',
			'position': {
				'x': 0,
				'y': 323.979,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color),
			'rightShift': true,
		},
		// Литера дома
		{
			'contents': '/' + houseLetter,
			'fontSize': 350,
			'fontTracking': 20,
			'align': 'left',
			'position': {
				'x': 0,
				'y': 323.979,
			},
			'font': 'IZH-260-A',
			'fontStyle': 'normal',
			'color': Object.assign({}, backColor.color),
			'rightShift': false,
		}
	];

	var widthNumber = measureTextWidth(words[4]);
	var widthLetter = measureTextWidth(words[5]);
	var lastDigit = String(houseNumber).trim().slice(-1);
	var letterGap = (lastDigit === '1') ? 8 : (lastDigit === '2' || lastDigit === '4') ? 5 : (lastDigit === '7') ? -15 : 0;
	var contentWidth = widthNumber + letterGap + widthLetter;
	var xCenter = 197.936;
	var startX = xCenter - contentWidth / 2;
	words[4].position.x = startX;
	words[5].position.x = startX + widthNumber + letterGap;

	let doc = new jsPDF({
		orientation: 'p',
		unit: 'mm',
		format: [signWidthOkn, signHeightOkn],
		putOnlyUsedFonts: true,
	});

	doc.setProperties({
		title: streetType + ' ' + streetName + ', ' + houseNumber + (houseLetter || ''),
		subject: 'Табличка с названием улицы и номером, для объектов культурного наследия',
		author: '',
		keywords: 'Генератор адресных табличек Ижевска',
	});

	doc.setFillColor(backColor.color.c / 100, backColor.color.m / 100, backColor.color.y / 100, backColor.color.k / 100);
	doc.roundedRect(0, signHeightOkn - 170, signWidthOkn, 170, signRadius, signRadius, 'F');

	for (var i = 0; i < words.length; i++) {
		var word = words[i];

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
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidthOkn, signHeightOkn, 'F');
			doc.internal.write('Q');
		} else if (i == 4 || i == 5) {
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
					'align': word.align,
					'renderingMode': 'addToPathForClipping'
				});
			doc.rect(0, 0, signWidthOkn, signHeightOkn, 'F');
			doc.internal.write('Q');
		}
	}

	generateOknPreview(doc);

	if (savePDF) {
		doc.save(streetType + '_' + streetName + '_' + houseNumber + (houseLetter || '') + '_' + signWidthOkn + '×' + signHeightOkn + '.pdf');
	}
}
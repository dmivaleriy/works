var $streetName = $('#streetName');

function escapeRegExp(str) {
  return String(str).replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}
// Highlight in type, titleRu, and name: match whole phrase or each word of the phrase.
function highlightText(text, phrase) {
  if (!text) return '';
  var t = String(text);
  var p = (phrase || '').trim();
  if (p === '') return t;
  var words = p.split(/\s+/).filter(Boolean);
  for (var i = 0; i < words.length; i++) {
    var w = escapeRegExp(words[i]);
    t = t.replace(new RegExp('(' + w + ')', 'gi'), '<b class="highlighted">$1</b>');
  }
  return t;
}

function formatSuggestionDisplayText(item) {
  if (!item) return '';
  var type = (item.type ? String(item.type).toLowerCase() : '').trim();
  var titleRu = (item.titleRu ? String(item.titleRu) : '').trim();
  var name = (item.name ? String(item.name) : '').trim();
  var parts = [];
  if (type) parts.push(type);
  if (titleRu) parts.push(titleRu);
  if (name) parts.push(name);
  return parts.join(' ');
}

var options = {
  url: 'js/sign-suggest-list.json',
  // Used for matching. We want to search by name, type, titleRu.
  // NOTE: dropdown display is controlled by template.method below.
  getValue: function (item) {
    if (!item) return '';
    var type = item.type ? String(item.type).toLowerCase() : '';
    var name = item.name ? String(item.name) : '';
    var titleRu = item.titleRu ? String(item.titleRu) : '';
    return [type, name, titleRu].filter(Boolean).join(' ');
  },
  listLocation: function (data) {
    if (typeof currentPreviewTab !== 'undefined' && currentPreviewTab === 'okn') {
      return Array.isArray(data) ? data.filter(function (o) { return o.isOKN === true; }) : data;
    }
    return data;
  },
  list: {
    maxNumberOfElements: 10, // число подсказок для названия улицы
    match: {
      enabled: true,
      caseSensitive: false,
      method: function (value, phrase) {
        if (!phrase || !value) return false;
        var v = String(value).toLowerCase();
        var p = String(phrase).trim().toLowerCase();
        return p === '' || v.indexOf(p) !== -1;
      }
    },
    onSelectItemEvent: function () {
      // Fired on hover too — do not fill inputs or update preview here
    },
    onChooseEvent: function () {
      // Fired only on click (or Enter) on a suggestion
      var selectedData = $("#streetName").getSelectedItemData();
      if (!selectedData) return;

      // Fill inputs from selected JSON item
      // Put the same line (plain text) as in the suggestion dropdown into the visible input.
      $("#streetName").val(formatSuggestionDisplayText(selectedData));
      // Keep raw name (name-only) for generator logic.
      $("#streetNameRaw").val(selectedData.name || "");
      $("#streetType").val((selectedData.type || "").toLowerCase());
      $("#streetNameUdm").val(selectedData.nameUdm || "");
      $("#streetTypeUdm").val((selectedData.typeUdm || "").toLowerCase());

      // Update preview only after click on suggestion
      setTimeout(function () {
        if (typeof generatePreviewOnly === "function" && $("#streetName").val().trim() !== "") {
          if (window.IZH260FontsReady) {
            generatePreviewOnly();
          } else {
            window.addEventListener("izh260FontsLoaded", function () {
              generatePreviewOnly();
            }, { once: true });
          }
        }
      }, 0);
    }
  },
  template: {
    type: 'custom',
    method: function (value, item) {
      // console.log(item.type);
      // Highlight in type, titleRu, and name: match what user typed (each word highlighted in any field).
      var phrase = ($streetName && $streetName.val) ? String($streetName.val()).trim() : '';
      var type = (item && item.type) ? String(item.type).toLowerCase() : '';
      var titleRu = (item && item.titleRu) ? String(item.titleRu) : '';
      var name = (item && item.name) ? String(item.name) : '';

      var typeHtml = type ? (' <span class="type">' + highlightText(type, phrase) + '</span>') : '';
      var titleHtml = titleRu ? (' <span class="title-ru">' + highlightText(titleRu, phrase) + '</span>') : '';
      var nameHtml = name ? (' <span class="name">' + highlightText(name, phrase) + '</span>') : '';

      return typeHtml + titleHtml + (nameHtml ? (' ' + nameHtml) : '');
    }
  },
  // requestDelay: 500
};

// Initialize EasyAutocomplete for streetName
/*   if (typeof $.fn.easyAutocomplete !== 'undefined') {
    $streetName.easyAutocomplete(options);
  } else {
    console.warn('EasyAutocomplete plugin not loaded');
  } */
$streetName.easyAutocomplete(options);

// On page load: if streetName already has a value, fill streetType / streetNameUdm / streetTypeUdm from the same list
(function useInitialStreetName() {
  var initialVal = $streetName.val();
  if (!initialVal || typeof initialVal.trim !== 'function') return;
  initialVal = initialVal.trim();
  if (initialVal === '') return;

  $.getJSON(options.url).done(function (data) {
    var item = null;
    for (var i = 0; i < data.length; i++) {
      // Support both name-only and "type name" display value in the input.
      if (String(data[i].name) === initialVal || formatSuggestionDisplayText(data[i]) === initialVal) {
        item = data[i];
        break;
      }
    }
    if (item) {
      $('#streetNameRaw').val(item.name || '');
      $('#streetType').val((item.type || '').toLowerCase());
      $('#streetNameUdm').val(item.nameUdm || '');
      $('#streetTypeUdm').val(item.typeUdm || '');
    }
  });
})();

// $streetName.focus();

// });
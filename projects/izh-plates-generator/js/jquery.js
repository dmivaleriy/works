var $streetName = $('#streetName');

var options = {
  url: 'js/sign-suggest-list.json',
  getValue: 'name',
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
      $("#streetName").val(selectedData.name || "");
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
      return ' <span class="type">' + item.type.toLowerCase() + '</span>' + ' ' + value;
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
      if (String(data[i].name) === initialVal) {
        item = data[i];
        break;
      }
    }
    if (item) {
      $('#streetType').val((item.type || '').toLowerCase());
      $('#streetNameUdm').val(item.nameUdm || '');
      $('#streetTypeUdm').val(item.typeUdm || '');
    }
  });
})();

// $streetName.focus();

// });
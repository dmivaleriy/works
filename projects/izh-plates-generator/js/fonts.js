// Load IZH-260 fonts from OTF files
(function (jsPDFAPI) {

  // Track font loading state
  window.IZH260FontsReady = false;

  // Store loaded font data
  const fontData = {};

  // Helper function to load font file and convert to base64
  function loadFontFile(url, fontName, fontFamily, fontStyle) {
    return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load font: ${url} (${response.status})`);
        }
        return response.blob();
      })
      .then(blob => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = function () {
            const base64 = reader.result.split(',')[1]; // Remove data:application/octet-stream;base64, prefix
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      })
      .then(base64 => {
        // Store font data for later use
        const fileName = fontName + '-normal.otf';
        fontData[fontFamily] = {
          fileName: fileName,
          base64: base64,
          fontStyle: fontStyle
        };
        // console.log('Font data loaded:', fontFamily);
        return true;
      })
      .catch(error => {
        console.error('Error loading font:', fontFamily, error);
        throw error;
      });
  }

  // Function to add fonts to a jsPDF document instance
  function addFontsToDocument(doc) {
    for (const fontFamily in fontData) {
      const font = fontData[fontFamily];
      try {
        doc.addFileToVFS(font.fileName, font.base64);
        doc.addFont(font.fileName, fontFamily, font.fontStyle);
        // console.log('Font added to document:', fontFamily);
      } catch (e) {
        console.error('Error adding font to document:', fontFamily, e);
      }
    }
  }

  // Register fonts using jsPDF events system
  // This will be called when a new jsPDF document is created
  var callAddFont = function () {
    // 'this' refers to the jsPDF document instance
    for (const fontFamily in fontData) {
      const font = fontData[fontFamily];
      try {
        this.addFileToVFS(font.fileName, font.base64);
        this.addFont(font.fileName, fontFamily, font.fontStyle);
      } catch (e) {
        console.error('Error adding font via events:', fontFamily, e);
      }
    }
  };

  // Register the event handler
  jsPDFAPI.events.push(['addFonts', callAddFont]);

  // Load fonts asynchronously
  // Update these paths to point to your OTF font files
  const fontBasePath = 'fonts/'; // Adjust this path as needed

  Promise.all([
    loadFontFile(fontBasePath + 'IZH-260-T.otf', 'IZH-260-T', 'IZH-260-T', 'normal'),
    loadFontFile(fontBasePath + 'IZH-260-A.otf', 'IZH-260-A', 'IZH-260-A', 'normal')
  ]).then(() => {
    window.IZH260FontsReady = true;
    // console.log('All IZH-260 fonts loaded successfully');
    // Trigger a custom event when fonts are ready
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('izh260FontsLoaded'));
    }
  }).catch(error => {
    console.error('Error loading fonts:', error);
    window.IZH260FontsReady = false;
  });

})(jsPDF.API);

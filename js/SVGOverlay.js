// Global instance of SVGRepository
var svgRepository = new SVGRepository();

/**
 * SVGOverlay Constructor
 *
 * @param {Object}             options
 * @param {String}             options.image
 * @param {String}             options.colour
 * @param {String}             options.label
 * @param {Number}             options.heading
 * @param {Function}           options.onClick
 * @param {google.maps.LatLng} options.position
 * @param {google.maps.Size}   options.size
 * @param {google.maps.Map}    options.map
 *
 * @constructor
 */
function SVGOverlay(options) {
    this._position = options.position;
    this._heading = options.heading;
    this._image = options.image;
    this._colour = options.colour;
    this._label = options.label;
    this._size = options.size;
    this._anchor = new google.maps.Point(this._size.width/2, this._size.height/2);
    this._map = options.map;

    this._onClick = options.onClick;
    this._clickListener = null;

    this._colourSelector = '#car-body';
    this._loaded = false;
    this._div = null;

    this.setMap(this._map);
}

SVGOverlay.prototype = new google.maps.OverlayView();

/**
 * Get the position of the marker
 *
 * @returns {google.maps.LatLng}
 */
SVGOverlay.prototype.getPosition = function() {
    return this._position;
};

/**
 * Set the position of the marker
 *
 * @param {google.maps.LatLng} position
 */
SVGOverlay.prototype.setPosition = function(position) {
    this._position = position;
    this.draw();
};

/**
* Get the heading of the marker in degrees
*
* @returns {Number}
*/
SVGOverlay.prototype.getHeading = function() {
    return this._heading;
};

/**
 * Check if SVG is loaded
 *
 * @returns {Boolean}
 */
SVGOverlay.prototype.isLoaded = function() {
    return this._loaded;
};

/**
 * Add, update or remove the label overlay
 *
 * @param {String} label
 */
SVGOverlay.prototype.setLabel = function(label) {
    var labelDiv = this._div.querySelector('.svg-label');
    if (label) {
        // Add or update label
        this._label = label;
        if (labelDiv) {
            labelDiv.innerHTML = this._label;
        } else {
            var lbl = document.createElement('div');
            lbl.innerHTML = this._label;
            lbl.className = 'svg-label';
            lbl.style.position = 'absolute';
            lbl.style.left = Math.floor(this._size.width * 0.15) + 'px'; // 7px at 48px wide
            lbl.style.top = '0';
            lbl.style.width = this._size.width + 'px';
            lbl.style.height = this._size.height + 'px';
            lbl.style.lineHeight = this._size.height + 'px';
            lbl.style.fontFamily = 'Arial,sans-serif';
            lbl.style.fontSize = Math.floor(this._size.height * 0.4) + 'px';
            lbl.style.color = 'black';
            if (this._heading > 180 || this._heading < 0) {
                // Flip the label if heading left
                Utils.setTransform(lbl, 'rotate(180deg)');
                lbl.style.textAlign = 'right';
            }
            this._div.appendChild(lbl);
        }
    } else {
        // Remove label
        if (labelDiv) {
            labelDiv.parentNode.removeChild(labelDiv);
            this._label = null;
        }
    }
};

/**
 * Resize the <object> and label
 *
 * @param {google.maps.Size} size
 */
SVGOverlay.prototype.setSize = function(size) {
    if (!this._div) { return; }

    if (size && size.width && size.height) {
        this._size = size;
        this._anchor = new google.maps.Point(this._size.width/2, this._size.height/2);

        var img = this._div.querySelector('img'),
            label = this._div.querySelector('.svg-label');

        if (img) {
            img.style.width = this._size.width + 'px';
            img.style.height = this._size.height + 'px';
        }
        if (label) {
            label.style.width = this._size.width + 'px';
            label.style.height = this._size.height + 'px';
            label.style.lineHeight = this._size.height + 'px';
            label.style.fontSize = (this._size.height * 0.4) + 'px';
            label.style.left = Math.floor(this._size.width * 0.15) + 'px';
        }

        // Force redraw
        this.draw();
    }
};

/**
 * Set the SVG colour of a predefined layer
 *
 * @param {String} colour
 */
SVGOverlay.prototype.setColour = function(colour) {
    if (!this._div) { return; }

    if (colour !== this._colour) {
        this._colour = colour;
        this.loadImage(function(image) {
            if (image) {
                this._div.querySelector('img').src = 'data:image/svg+xml;base64,'+btoa(new XMLSerializer().serializeToString(image));

                // Force redraw to fix Safari tiny SVG when changing <img> src bug
                // http://stackoverflow.com/questions/29235677/solution-to-svg-render-bug-in-safari
                if (Utils.isSafari()) {
                    this.setMap(null);
                    this.setMap(this._map);
                }
            }
        }.bind(this));
    }
};

/**
 * Callback for when image has been loaded
 *
 * @callback SVGOverlay~loadImageCallback
 * @param {XMLDocument} image
 */

/**
 * Load an SVG image from file or repository and pass to callback function
 *
 * @param {SVGOverlay~loadImageCallback} cb
 */
SVGOverlay.prototype.loadImage = function(cb) {
    var image, path;
    if (svgRepository.has(this._image+this._colour)) {
        // load from repository
        cb(svgRepository.load(this._image+this._colour));
    } else if (svgRepository.has(this._image)) {
        // load, modify and save to repository
        image = svgRepository.load(this._image);
        path = image ? image.querySelector(this._colourSelector) : null;
        if (path) {
            path.style.fill = this._colour;
            svgRepository.save(this._image+this._colour, image);
            cb(image);
        } else {
            cb(false);
        }
    } else {
        // load and save to repository
        this.fetchImage(this._image, function(image) {
            if (!image) cb(false);

            // save base image
            svgRepository.save(this._image, image);

            // colour, save and return image
            path = image.querySelector(this._colourSelector);
            if (path) {
                path.style.fill = this._colour;
                svgRepository.save(this._image+this._colour, image);
                cb(image);
            } else {
                cb(false);
            }
        }.bind(this));
    }
};

/**
 * Callback for when image has been fetched
 *
 * @callback SVGOverlay~fetchImageCallback
 * @param {XMLDocument} image
 */

/**
 * Fetch an SVG image file using XHR, then pass to callback
 *
 * @param {String}                       url
 * @param {SVGOverlay~fetchImageCallback} cb
 */
SVGOverlay.prototype.fetchImage = function(url, cb) {
    function xhrOnLoad() {
        var image;

        if (this.readyState === 4 && (image = this.responseXML.querySelector('svg'))) {
            cb(image);
        } else {
            cb(false);
        }
    }

    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', xhrOnLoad);
    xhr.open('get', url, true);
    xhr.send();
};

/**
 * Called when marker is created
 */
SVGOverlay.prototype.onAdd = function() {
    var div = document.createElement('div');
    div.style.position = 'absolute';
    Utils.setTransform(div, 'rotate('+(this._heading-90)+'deg)'); // offset rotation so that 0 = North

    this.loadImage(function(image) {
        if (!image) {
            console.error('failed loading '+this._image);
            return;
        }

        var img = document.createElement('img');
        img.src = 'data:image/svg+xml;base64,'+btoa(new XMLSerializer().serializeToString(image));
        img.className = 'svg-marker';
        img.style.width = this._size.width + 'px';
        img.style.height = this._size.height + 'px';
        div.appendChild(img);

        this._div = div;

        this.setLabel(this._label);

        // Set loaded status
        google.maps.event.addDomListenerOnce(img, 'load', function() {
            this._loaded = true;
        }.bind(this));

        // Add to pane
        var panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(this._div);

        // Add click handler
        if (this._onClick) {
            this._clickListener = google.maps.event.addDomListener(this._div, 'click', this._onClick.bind(this));
        }

        // First draw call, shouldn't need to call manually?
        this.draw();
    }.bind(this));
};

/**
 * Called whenever marker needs to be re-drawn
 */
SVGOverlay.prototype.draw = function() {
    var point = this.getProjection().fromLatLngToDivPixel(this._position);
    if (point && this._div) {
        this._div.style.left = point.x - this._anchor.x + 'px';
        this._div.style.top = point.y - this._anchor.y + 'px';
    }
};

/**
 * Called when marker is destroyed
 */
SVGOverlay.prototype.onRemove = function() {
    if (this._clickListener) {
        google.maps.event.removeListener(this._clickListener);
    }
    if (this._div) {
        this._div.parentNode.removeChild(this._div);
        this._div = null;
    }
};

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
 * @param {google.maps.LatLng} options.position
 * @param {google.maps.Size}   options.size
 * @param {google.maps.Point}  options.anchor
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
    this._anchor = options.anchor;
    this._map = options.map;

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
            lbl.style.color = ['white', 'yellow'].indexOf(this._colour) >= 0 ? 'black' : 'white';
            if (this._heading > 180 || this._heading < 0) {
                // Flip the label if heading left
                lbl.style.transform = 'rotate(180deg)';
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

        var obj = this._div.querySelector('object'),
            label = this._div.querySelector('.svg-label');

        if (obj) {
            obj.width = this._size.width;
            obj.height = this._size.height;
        }
        if (label) {
            label.style.width = this._size.width + 'px';
            label.style.height = this._size.height + 'px';
            label.style.lineHeight = this._size.height + 'px';
            label.style.fontSize = (this._size.height * 0.4) + 'px';
            label.style.left = Math.floor(this._size.width * 0.15) + 'px';
        }
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
    var obj, svg, path;
    if (svgRepository.has(this._image+this._colour)) {
        // load from repository
        cb(svgRepository.load(this._image+this._colour));
    } else if (svgRepository.has(this._image)) {
        // load, modify and save to repository
        svg = svgRepository.load(this._image);
        path = svg ? svg.querySelector(this._colourSelector) : null;
        if (path) {
            path.style.fill = this._colour;
            svgRepository.save(this._image+this._colour, svg);
            cb(svg);
        } else {
            cb(false);
        }
    } else {
        // load and save to repository
        obj = document.createElement('object');
        obj.type = 'image/svg+xml';
        obj.data = this._image;
        obj.style.zIndex = -1;
        document.querySelector('body').appendChild(obj);

        google.maps.event.addDomListenerOnce(obj, 'load', function() {
            svg = obj.getSVGDocument();
            if (svg) {
                // save base image
                svgRepository.save(this._image, svg);

                // colour, save and return image
                path = svg.querySelector(this._colourSelector);
                if (path) {
                    path.style.fill = this._colour;
                    svgRepository.save(this._image+this._colour, svg);
                    cb(svg);
                    document.querySelector('body').removeChild(obj);
                } else {
                    cb(false);
                }
            } else {
                cb(false);
            }
        }.bind(this));
    }
};

/**
 * Called when marker is created
 */
SVGOverlay.prototype.onAdd = function() {
    var div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.transform = 'rotate('+(this._heading-90)+'deg)'; // offset rotation so that 0 = North

    this.loadImage(function(image) {
        var obj = document.createElement('img');
        obj.src = 'data:image/svg+xml;base64,'+btoa(new XMLSerializer().serializeToString(image));
        obj.className = 'svg-marker';
        obj.width = this._size.width;
        obj.height = this._size.height;
        div.appendChild(obj);

        this._div = div;

        this.setLabel(this._label);

        // Set loaded status
        google.maps.event.addDomListener(obj, 'load', function() {
            this._loaded = true;
        }.bind(this));

        // Add to pane
        var panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(this._div);
    }.bind(this));

    /*google.maps.event.addDomListener(this._div, 'click', function() {
        google.maps.event.trigger(this, 'click');
        console.debug('click?', this);
    }.bind(this));*/
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
    if (this._div) {
        this._div.parentNode.removeChild(this._div);
        this._div = null;
    }
};

/**
 * SVGOverlay Constructor
 *
 * @param {Object} options
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
 * Set the colour of a specific path
 *
 * @param {(String|String[])} pathSpecs
 * @param {String}            colour
 */
SVGOverlay.prototype.setColour = function(pathSpecs, colour) {
    if (!Array.isArray(pathSpecs)) {
        pathSpecs = [pathSpecs];
    }

    if (!this._div) { return; }

    var obj = this._div.querySelector('object'),
        svg = obj ? obj.getSVGDocument() : null;

    pathSpecs.forEach(function(pathSpec) {
        var path = svg ? svg.querySelector(pathSpec) : null;

        if (path) {
            path.style.fill = colour;
        }
    }.bind(this));
};

/**
 * Called when marker is created
 */
SVGOverlay.prototype.onAdd = function() {
    var div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.transform = 'rotate('+(this._heading-90)+'deg)'; // offset rotation so that 0 = North

    var obj = document.createElement('object');
    obj.type = 'image/svg+xml';
    obj.data = this._image;
    obj.className = 'svg-marker';
    obj.width = this._size.width;
    obj.height = this._size.height;
    div.appendChild(obj);

    this._div = div;

    this.setLabel(this._label);

    // Wait until object is loaded before setting colour
    google.maps.event.addDomListener(obj, 'load', function() {
        this._loaded = true;
        this.setColour('#car-body', this._colour);
    }.bind(this));

    var panes = this.getPanes();
    panes.overlayMouseTarget.appendChild(this._div);

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

    if (point) {
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

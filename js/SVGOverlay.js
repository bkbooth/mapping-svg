/**
 * SVGOverlay Constructor
 *
 * @param {Object} options
 * @param {String}             options.image
 * @param {String}             options.colour
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

    var lbl = document.createElement('div');
    lbl.innerHTML = this._label;
    lbl.className = 'svg-label';
    lbl.style.position = 'absolute';
    lbl.style.left = '7px';
    lbl.style.top = '0';
    lbl.style.width = this._size.width + 'px';
    lbl.style.height = this._size.height + 'px';
    lbl.style.lineHeight = this._size.height + 'px';
    lbl.style.fontFamily = 'Arial,sans-serif';
    lbl.style.fontSize = (this._size.height * 0.4) + 'px';
    lbl.style.color = ['white', 'yellow'].indexOf(this._colour) >= 0 ? 'black' : 'white';
    div.appendChild(lbl);

    this._div = div;

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

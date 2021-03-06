/**
 * OptionsControl Constructor
 *
 * @param {Object}          options
 * @param {HTMLElement}     options.div
 * @param {Function}        options.onChange
 * @param {google.maps.Map} options.map
 *
 * @constructor
 */
function OptionsControl(options) {
    this._map = options.map;
    this._onChange = options.onChange || null;

    this._div = options.div;
    this._text = null;
    this._visible = true;

    this.init();
}

/**
 * Setup the HTML and all listeners
 */
OptionsControl.prototype.init = function() {
    var container = document.createElement('div');
    container.className = 'svg-options-control';
    this._div.appendChild(container);

    var text = document.createElement('div');
    text.innerHTML =
        '<a id="toggleControl" href>&#x25BE;</a>' +
        '<h1>SVG Map Demo</h1>' +
        '<p>Click vehicles to change colour</p>' +
        '<form action="#" autocomplete="off">' +
            '<div class="input-group">' +
                '<label for="num-vehicles">Number of Vehicles</label>' +
                '<input type="range" id="num-vehicles" min="100" max="2500" step="100" value="100">' +
                '<output for="num-vehicles" id="num-vehicles-output">100</output>' +
            '</div>' +
            '<div class="input-group">' +
                '<label for="vehicle-image">Vehicle Image</label>' +
                '<select id="vehicle-image">' +
                    '<option value="tack-car-top-view.svg">Sports Car</option>' +
                    '<option value="simple-truck.svg" selected>Simple Van</option>' +
                    '<option value="basic-rectangle.svg">Basic Rectangle</option>' +
                '</select>' +
            '</div>' +
            '<div class="input-group">' +
                '<label for="vehicle-image-size">Vehicle Image Size</label>' +
                '<select id="vehicle-image-size">' +
                    '<option value="16">Extra Small (16)</option>' +
                    '<option value="32">Small (32)</option>' +
                    '<option value="48" selected>Medium (48)</option>' +
                    '<option value="64">Large (64)</option>' +
                    '<option value="96">Extra Large (96)</option>' +
                    '<option value="128">Jumbo (128)</option>' +
                '</select>' +
            '</div>' +
            '<div class="input-group">' +
                '<label for="automatic-size">' +
                    '<input type="checkbox" id="automatic-size" value="1"> Automatic Size' +
                '</label>' +
            '</div>' +
            '<div class="input-group">' +
                '<label for="show-labels">' +
                    '<input type="checkbox" id="show-labels" value="1" checked> Show Vehicle Labels' +
                '</label>' +
            '</div>' +
            '<div class="input-group">' +
                '<label for="vehicle-speed">Vehicle Speed</label>' +
                '<input type="range" id="vehicle-speed" min="0.1" max="5.0" step="0.1" value="0.5">' +
                '<output for="vehicle-speed" id="vehicle-speed-output">0.5</output> m/ms' +
            '</div>' +
            '<div class="input-group">' +
                '<label for="refresh-interval">Refresh Interval</label>' +
                '<input type="range" id="refresh-interval" min="100" max="60000" step="100" value="1000" list="refresh-interval-options">' +
                '<datalist id="refresh-interval-options">' +
                    '<option>100</option>' +
                    '<option>500</option>' +
                    '<option>1000</option>' +
                    '<option>5000</option>' +
                    '<option>10000</option>' +
                    '<option>30000</option>' +
                    '<option>60000</option>' +
                '</datalist>' +
                '<output for="refresh-interval" id="refresh-interval-output">1000</output> ms' +
            '</div>' +
            '<div class="input-group">' +
                '<button id="reset-defaults" type="reset">Reset Defaults</button>' +
            '</div>' +
        '</form>'
    ;
    container.appendChild(text);

    // Update input 'range' output fields
    this.linkInputToOutput(text.querySelector('#num-vehicles'), text.querySelector('#num-vehicles-output'));
    this.linkInputToOutput(text.querySelector('#vehicle-speed'), text.querySelector('#vehicle-speed-output'));
    this.linkInputToOutput(text.querySelector('#refresh-interval'), text.querySelector('#refresh-interval-output'));

    // Setup the onChange listeners
    Array.prototype.forEach.call(text.querySelectorAll('input, select'), function(control) {
        google.maps.event.addDomListener(control, 'change', this.callOnChange.bind(this));
    }.bind(this));

    // Additional onChange listener to disable image size selection while automatic sizing is on
    google.maps.event.addDomListener(text.querySelector('#automatic-size'), 'change', function() {
        text.querySelector('#vehicle-image-size').disabled = this.checked;
    });

    // Add the Reset button listener
    google.maps.event.addDomListener(text.querySelector('form'), 'reset', this.resetDefaults.bind(this));

    // Add the toggle link listener
    google.maps.event.addDomListener(text.querySelector('#toggleControl'), 'click', this.toggleControl.bind(this));

    this._text = text;
};

/**
 * Link a HTML <output> element value to an <input> element
 *
 * @param {HTMLElement} inputElement
 * @param {HTMLElement} outputElement
 */
OptionsControl.prototype.linkInputToOutput = function(inputElement, outputElement) {
    if (inputElement && outputElement) {
        google.maps.event.addDomListener(inputElement, 'input', function() {
            outputElement.value = this.value;
        });
    }
};

/**
 * Returns value in the correct format (Boolean, Number, String)
 *
 * @param {HTMLElement} control
 * @returns {Boolean|Number|String}
 */
OptionsControl.prototype.getValue = function(control) {
    return control.type === 'checkbox' ?
        control.checked : ( // is a checkbox
        isNaN(Number(control.value)) ?
            control.value : // is a numeric value
            Number(control.value) // otherwise assume text value
        )
    ;
};

/**
 * Call onChange handler with id and value
 *
 * @param {Event} event
 */
OptionsControl.prototype.callOnChange = function(event) {
    if (this._onChange) {
        this._onChange(event.target.id, this.getValue(event.target));
    }
};

/**
 * Call onChange handler for each control and reset inputs
 */
OptionsControl.prototype.resetDefaults = function() {
    setTimeout(function() {
        // reset vehicle image size select enabled
        this._text.querySelector('#vehicle-image-size').disabled = this._text.querySelector('#automatic-size').checked;

        if (this._onChange) {
            Array.prototype.forEach.call(this._div.querySelectorAll('input, select'), function (control) {
                this._onChange(control.id, this.getValue(control));
            }.bind(this));
        }
    }.bind(this), 0);
};

/**
 * Toggle form visibility
 *
 * @param {Event} event
 */
OptionsControl.prototype.toggleControl = function(event) {
    event.preventDefault();

    this._visible = !this._visible;
    this._text.querySelector('form').style.display = this._visible ? 'block' : 'none';
    Utils.setTransform(this._text.querySelector('#toggleControl'), this._visible ? 'none' : 'rotate(180deg)');
};

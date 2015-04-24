var mapObj = null,
    initCentre = new google.maps.LatLng(51.502, -0.117),
    initZoom = 10,
    areaCentre = initCentre,
    areaRadius = 100000,
    numVehicles = 100,
    centreMarker = null,
    radiusMarker = null,
    vehicleMarkers = [],
    vehicleSpeed = 0.5,
    vehicleImage = 'simple-truck.svg',
    showLabels = true,
    refreshInterval = 1000,
    statuses = ['red', 'yellow', 'orange', 'blue', 'green', 'white', 'black'],
    types = ['4M', '7T', 'LU', 'VE', 'AL', 'AV', 'V', 'T', 'L', 'GL', 'GT', 'GV', 'GC', 'GX', 'PC', 'PL', 'MI', 'CV'],
    imageSize = new google.maps.Size(48, 36) // 640x480 base image
;

function init() {
    mapObj = new google.maps.Map(document.getElementById('map-canvas'), {
        center: initCentre,
        zoom: initZoom
    });

    addOptionsControl(mapObj);
    setCentreMarker(mapObj);
    setRadiusMarker(mapObj);

    for (var i = 0; i < numVehicles; i++) {
        vehicleMarkers[i] = loadVehicle(mapObj);
    }

    // Start the update loop
    update();
}

function addOptionsControl(map) {
    var optionsControlDiv = document.createElement('div'),
        optionsControl = new OptionsControl({
            div: optionsControlDiv,
            map: map,
            onChange: onOptionsChange
        });

    optionsControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(optionsControlDiv);
}

function onOptionsChange(id, value) {
    console.log('onOptionsChange', 'id=', id, 'value=', value);
    var i, label;
    switch(id) {
        case 'num-vehicles':
            if (value > numVehicles) {
                // add more vehicles
                for (i = numVehicles; i < value; i++) {
                    vehicleMarkers[i] = loadVehicle(mapObj);
                }
            } else if (value < numVehicles) {
                // remove some vehicles
                for (i = value; i < numVehicles; i++) {
                    vehicleMarkers[i].setMap(null);
                    vehicleMarkers[i] = void 0;
                }
            }
            numVehicles = value;
            break;
        case 'vehicle-image':
            if (value !== vehicleImage) {
                vehicleImage = value;
                clearVehicles();
                for (i = 0; i < numVehicles; i++) {
                    vehicleMarkers[i] = loadVehicle(mapObj);
                }
            }
            break;
        case 'vehicle-image-size':
            if (value !== imageSize.width) {
                imageSize = new google.maps.Size(value, value * 0.75);
                for (i = 0; i < numVehicles; i++) {
                    vehicleMarkers[i].setSize(imageSize);
                }
            }
            break;
        case 'show-labels':
            if (value !== showLabels) {
                showLabels = value;
                if (showLabels) {
                    // show labels
                    for (i = 0; i < numVehicles; i++) {
                        label = types[Math.floor(Math.random() * types.length)];
                        vehicleMarkers[i].setLabel(label);
                    }
                } else {
                    // hide labels
                    for (i = 0; i < numVehicles; i++) {
                        vehicleMarkers[i].setLabel();
                    }
                }
            }
            break;
        case 'vehicle-speed':
            vehicleSpeed = value;
            break;
        case 'refresh-interval':
            if (value !== refreshInterval) {
                refreshInterval = value;
                clearTimeout(refresher);
                update();
            }
            break;
    }
}

function setCentreMarker(map) {
    // Create the marker
    centreMarker = new google.maps.Marker({
        position: areaCentre,
        map: map,
        draggable: true
    });

    function setAreaCentre(event) {
        areaCentre = event.latLng;
        radiusMarker.setCenter(event.latLng);
    }

    // Update the centre and radius position during marker drag
    google.maps.event.addDomListener(centreMarker, 'drag', setAreaCentre);
    google.maps.event.addDomListener(centreMarker, 'dragend', setAreaCentre);

    // Update the centre and radius position, move the marker on map click
    google.maps.event.addDomListener(map, 'click', function(event) {
        setAreaCentre(event);
        centreMarker.setPosition(areaCentre);
    });
}

function setRadiusMarker(map) {
    // Create the circle
    radiusMarker = new google.maps.Circle({
        strokeColor: '#FF0000',
        strokeWeight: 0.5,
        fillColor: '#FF0000',
        fillOpacity: 0.05,
        map: map,
        center: areaCentre,
        radius: areaRadius
    });
}

function loadVehicle(map) {
    var latLng = randomPointFromCircle(radiusMarker),
        direction = Math.random() * 360,
        status = statuses[Math.floor(Math.random() * statuses.length)],
        type = showLabels ? types[Math.floor(Math.random() * types.length)] : false;

    return new SVGOverlay({
        image: '/img/' + vehicleImage,
        position: latLng,
        heading: direction,
        size: imageSize,
        colour: status,
        label: type,
        anchor: new google.maps.Point(imageSize.width/2, imageSize.height/2),
        map: map
    });
}

function clearVehicles() {
    for (var i = 0; i < numVehicles; i++) {
        vehicleMarkers[i].setMap(null);
        vehicleMarkers[i] = void 0;
    }
}

function randomPointFromCircle(circle) {
    /*var _origin = _circle.getCenter(),
        _bounds = _circle.getBounds(),
        _radius = _bounds.getNorthEast().lat() - _origin.lat(),

        angle = Math.random() * Math.PI * 2,
        radius = Math.sqrt(Math.random()) * _radius,
        x = _origin.lat() + radius * Math.cos(angle),
        y = _origin.lng() + radius * Math.sin(angle);

    //console.debug('randomPointFromCircle', _origin.lat(), _origin.lng(), _radius);
    //console.debug('google.maps.LatLng', 'angle', angle, 'radius', radius, 'x', x, 'y', y);

    return new google.maps.LatLng(x, y);*/
    var bounds = circle.getBounds(),
        sw = bounds.getSouthWest(),
        ne = bounds.getNorthEast();

    while (true) {
        var lat = Math.random() * (ne.lat() - sw.lat()) + sw.lat(),
            lng = Math.random() * (ne.lng() - sw.lng()) + sw.lng(),
            point = new google.maps.LatLng(lat, lng);

        if (google.maps.geometry.spherical.computeDistanceBetween(point, circle.getCenter()) < circle.getRadius()) {
            return point;
        }
    }
}

// requestAnimationFrame() too slow, use setTimeout with configurable interval
var time = null,
    refresher = null;
function update() {
    refresher = setTimeout(update, refreshInterval);

    // Calculate delta time
    var now = Number(new Date()),
        dt = now - (time || now);
    time = now;

    for (var i = 0; i < vehicleMarkers.length; i++) {
        if (vehicleMarkers[i] && vehicleMarkers[i].isLoaded()) {
            // Move the vehicle
            vehicleMarkers[i].setPosition(google.maps.geometry.spherical.computeOffset(
                vehicleMarkers[i].getPosition(),
                vehicleSpeed * dt,
                vehicleMarkers[i].getHeading()
            ));

            // Replace vehicle if it moves outside area
            if (google.maps.geometry.spherical.computeDistanceBetween(
                    vehicleMarkers[i].getPosition(),
                    radiusMarker.getCenter()
                ) > radiusMarker.getRadius()) {

                vehicleMarkers[i].setMap(null);
                vehicleMarkers[i] = loadVehicle(mapObj);
            }
        }
    }
}

google.maps.event.addDomListener(window, 'load', init);

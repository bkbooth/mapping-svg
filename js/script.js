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

    setCentreMarker(mapObj);
    setRadiusMarker(mapObj);

    for (var i = 0; i < numVehicles; i++) {
        vehicleMarkers[i] = loadVehicle(mapObj);
    }

    // Start the update loop
    update();
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
        type = types[Math.floor(Math.random() * types.length)];

    return new SVGOverlay({
        image: '/img/simple-truck.svg',
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
function update() {
    setTimeout(update, refreshInterval);

    for (var i = 0; i < vehicleMarkers.length; i++) {
        if (vehicleMarkers[i] && vehicleMarkers[i].isLoaded()) {
            // Move the vehicle
            vehicleMarkers[i].setPosition(google.maps.geometry.spherical.computeOffset(
                vehicleMarkers[i].getPosition(),
                vehicleSpeed * refreshInterval,
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

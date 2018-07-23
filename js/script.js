// variables to use throughout
var screenWidth = $(window).width();
var consoleWidth = $("#second-console").width();

var map = new mapboxgl.Map({
    container: 'map',
    style: {
        "version": 8,
        "sources": {
            "simple-tiles": {
                "type": "raster",
                "tiles": [
                    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}"
                ],
                "tileSize": 256,
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri'
            }
        },
        "layers": [{
            "id": "simple-tiles",
            "type": "raster",
            "source": "simple-tiles",
            "minzoom": 0,
            "maxzoom": 22
        }]
    },
    // style: 'https://openmaptiles.github.io/positron-gl-style/style-cdn.json',
    center: [5, 10],
    zoom: getMinZoom(screenWidth) + 0.3,
    // set so that can zoom in less far on a mobile, to avoid disorientation
    maxZoom: getMinZoom(screenWidth) + 4,
    // set so that can zoom out less far on a desktop, to avoid having to render too many tiles
    minZoom: getMinZoom(screenWidth),
    // remove options to rotate or change the pitch of the map
    pitchWithRotate: false,
    dragRotate: false,
    touchZoomRotate: false
});

function getMinZoom () {
    if (screenWidth > 1200) {
        return 1.5
    } else if (1201 > screenWidth && screenWidth > 900) {
        return 1
    }  else if (901 > screenWidth && screenWidth > 600) {
        return 0.5
    }  else {
        return 0
    }
}

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left');

map.on('load', function() {

    map.addSource("tiles", {
        "type": 'geojson',
        "data": './data/tiles-merge3.geojson'
    });

    map.addLayer({
        id: 'tile-fills',
        type: 'fill',
        source: "tiles",
        paint: {
            "fill-color": "#f3f3f3",
            'fill-color': {
                property: 'rcp26',
                stops: [
                    [0, '#0f1d85'],
                    [0.45, '#4b269f'],
                    [0.9, '#802ba4'],
                    [1.35, '#Aa2d93'],
                    [2, '#Ca4a78'],
                    [2.45, '#E66f5d'],
                    [2.9, '#f79649'],
                    [3.35, '#Fbc53d'],
                    [4, '#F0f73f']
                ]
            },
            "fill-opacity": ["case",
                ["boolean", ["feature-state", "hover"], false],
                0.1,
                0.62
            ]
        }
    });

    map.addLayer({
        "id": 'tile-lines',
        "type": 'line',
        "source": "tiles",
        "layout": {},
        "paint": {
            'line-color': '#f3f3f3',
            'line-opacity': {
                "type": "exponential",
                "stops": [
                    [1.5,0],
                    [3,0.2],
                    [5,0.4],
                ]
            },
            'line-width': {
                "type": "exponential",
                "stops": [
                    [1.5,0],
                    [3,0.5],
                    [5,0.7],
                    [7,0.9]
                ]
            }
        }
    });

    // RADIO BUTTON INTERACTIONS

    var radios = document.getElementsByName('rcp-radio');

    for(var i = 0, max = radios.length; i < max; i++) {
        radios[i].onclick = function() {

            var scenario = this.value;

            // update the tile fills
            map.setPaintProperty('tile-fills', 'fill-color', {
                property: scenario,
                stops: [
                    [0, '#0f1d85'],
                    [0.45, '#4b269f'],
                    [0.9, '#802ba4'],
                    [1.35, '#Aa2d93'],
                    [2, '#Ca4a78'],
                    [2.45, '#E66f5d'],
                    [2.9, '#f79649'],
                    [3.35, '#Fbc53d'],
                    [4, '#F0f73f']
                ]
            });
        }
    }

    
    var hoveredTileId = null;

    map.on("mousemove", "tile-fills", function(e) {

        if (e.features.length > 0) {
            if (hoveredTileId) {
                map.setFeatureState({source: 'tiles', id: hoveredTileId}, { hover: false});
            }
            hoveredTileId = e.features[0].id;

            // console.log(e.features[0]);
            // console.log(hoveredTileId);

            map.setFeatureState({source: 'tiles', id: hoveredTileId}, { hover: true});
        }
    });

    // Reset the state-fills-hover layer's filter when the mouse leaves the layer.
    map.on("mouseleave", "tile-fills", function() {
        if (hoveredTileId) {
            map.setFeatureState({source: 'tiles', id: hoveredTileId}, { hover: false});
        }
        hoveredStateId =  null;
        // console.log("leave");
    });

    map.on("click", "tile-fills", function(e) {

        // BRING IN CONSOLE

        $('#second-console').removeClass('console-initial console-close').addClass('console-open');
        $('#arrow-left').removeClass("arrow-showing").addClass("arrow-hidden");
        $('#arrow-right').removeClass("arrow-hidden").addClass("arrow-showing");

        // console.log("show console");

        // BRING DOWN KEY

        $('#landing-console').removeClass('console-up').addClass('console-down');
        $('#arrow-down').removeClass("arrow-showing").addClass("arrow-hidden");
        $('#arrow-up').removeClass("arrow-hidden").addClass("arrow-showing");

        // HIGHLIGHT CLICKED FEATURE

        var features = map.queryRenderedFeatures(e.point, { layers: ['tile-fills'] });
        if (!features.length) {
            return;
        }
        if (typeof map.getLayer('selectedTile') !== "undefined" ){         
            map.removeLayer('selectedTile')
            map.removeSource('selectedTile');   
        }
        var feature = features[0];
        //I think you could add the vector tile feature to the map, but I'm more familiar with JSON
        console.log(feature.toJSON());
        map.addSource('selectedTile', {
            "type":"geojson",
            "data": feature.toJSON()
        });
        map.addLayer({
            "id": "selectedTile",
            "type": "line",
            "source": "selectedTile",
            "layout": {
                "line-join": "round",
                "line-cap": "round"
            },
            "paint": {
                "line-color": "white",
                'line-width': {
                    "type": "exponential",
                    "stops": [
                        [1.5,0.5],
                        [3,1],
                        [5,2],
                        [7,3.2]
                    ]
                }
            }
        });

        // ADJUST VIEW OF MAP

        var coordinates = e.features[0].geometry.coordinates[0];
        var bounds = coordinates.reduce(function (bounds, coord) {
            return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        // console.log(bounds);

        var getPaddingRight = (consoleWidth + 90);

        // console.log(consoleWidth);
        // console.log(getPaddingRight);

        map.fitBounds(bounds, {
            padding: {
                top: 20,
                right: getPaddingRight,
                left: 20,
                bottom: 20
            }
        });

    })



});

// RESET RADIO ON WINDOW RELOAD

$(document).ready(function () {
    rcps.reset();
})

// REMOVE LOADING MASK AFTER SHORT INTERVAL

setTimeout (function() {
    $('#loading').css('visibility', 'hidden');
}, 5000);

// TOGGLE BUTTON

$("#toggle-across").click(function() {
    $("#second-console").toggleClass('console-close console-open');
    $('#arrow-left').toggleClass('arrow-showing arrow-hidden');
    $('#arrow-right').toggleClass('arrow-hidden arrow-showing');
});

$("#toggle-down").click(function() {
    $("#landing-console").toggleClass('console-up console-down');
    $('#arrow-up').toggleClass('arrow-showing arrow-hidden');
    $('#arrow-down').toggleClass('arrow-hidden arrow-showing');
});


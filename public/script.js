mapboxgl.accessToken = 'pk.eyJ1IjoiY3V6em1vdGlvbiIsImEiOiJjbTF3Mnh5NWswZjhnMmtwcWNrazM5OWM0In0.CaBYToHwxrb804rdXCxC0g';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [0, 0], // Coordenadas iniciales
    zoom: 1
});

let gridSize = 0.5; // Valor predeterminado para el tamaño del grid

// Cargar el archivo GeoJSON de Landsat WRS-2 (descenso)
map.on('load', () => {
    map.addSource('wrs2-grids', {
        'type': 'geojson',
        'data': 'https://geojsonweb.glitch.me/WRS2_descending.json' // Reemplaza con la ruta de tu archivo GeoJSON de Landsat WRS-2
    });

    // Añadir la capa con los grids de Landsat
    map.addLayer({
        'id': 'wrs2-layer',
        'type': 'line',
        'source': 'wrs2-grids',
        'layout': {},
        'paint': {
            'line-color': '#FF0000',
            'line-width': 1.5
        }
    });
});

// Función para crear un cuadrado en una posición específica
function createSquare(center, offsetX, offsetY, width, height) {
    const [lng, lat] = [center.lng + offsetX * width, center.lat + offsetY * height];
    return [
        [lng - width / 2, lat + height / 2],  // superior izquierda
        [lng + width / 2, lat + height / 2],  // superior derecha
        [lng + width / 2, lat - height / 2],  // inferior derecha
        [lng - width / 2, lat - height / 2],  // inferior izquierda
        [lng - width / 2, lat + height / 2]   // volver al punto inicial
    ];
}

// Función para generar el grid 3x3 (nueve cuadrados)
function createGrid(center, width, height) {
    const grid = [];
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            grid.push(createSquare(center, x, y, width, height));
        }
    }
    return grid;
}

// Evento para marcar el grid 3x3 al hacer clic en el mapa
map.on('click', (e) => {
    const coords = e.lngLat;
    document.getElementById('info').innerText = `Longitud: ${coords.lng}, Latitud: ${coords.lat}`;

    // Si ya existe un grid, lo removemos
    if (map.getLayer('grid')) {
        map.removeLayer('grid');
        map.removeSource('grid');
    }

    // Obtener el tamaño del grid desde los inputs del usuario
    const gridWidth = parseFloat(document.getElementById('gridWidth').value);
    const gridHeight = parseFloat(document.getElementById('gridHeight').value);

    // Crear el grid 3x3 alrededor del punto clickeado con las dimensiones personalizadas
    const gridCoordinates = createGrid(coords, gridWidth, gridHeight);

    // Crear una colección GeoJSON para todos los cuadrados
    const features = gridCoordinates.map((coords) => ({
        'type': 'Feature',
        'geometry': {
            'type': 'Polygon',
            'coordinates': [coords]
        }
    }));

    // Añadir la fuente y la capa de la cuadrícula al mapa
    map.addSource('grid', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': features
        }
    });

    // Añadir la capa con el grid visible en el mapa, asegurando que esté por encima del layer 'wrs2-layer'
    map.addLayer({
        'id': 'grid',
        'type': 'fill',
        'source': 'grid',
        'layout': {},
        'paint': {
            'fill-color': '#088',
            'fill-opacity': 0.4,
            'fill-outline-color': '#000'
        }
    }, 'wrs2-layer'); // Coloca la capa de grid por encima de 'wrs2-layer'

    // Mostrar los metadatos del GeoJSON relacionados con las coordenadas clickeadas
    displayMetadata(coords);
});

// Función para mostrar los metadatos en el HTML
async function displayMetadata(coords) {
    const metadataDiv = document.getElementById('metadata');
    metadataDiv.innerHTML = ''; // Limpiar metadatos previos

    const response = await fetch('https://geojsonweb.glitch.me/WRS2_descending.json');
    const geojson = await response.json();

    geojson.features.forEach((feature, index) => {
        const properties = feature.properties;
        // Aquí puedes filtrar según la lógica que quieras aplicar (coordenadas o Path y Row)
        if (isCoordinateInsideFeature(coords, feature)) {
            const metadataItem = document.createElement('div');
            metadataItem.innerHTML = `
                <strong>Feature ${index + 1}</strong><br>
                Path: ${properties.PATH}<br>
                Row: ${properties.ROW}<br>
                Área: ${properties.AREA}<br>
                Secuencia: ${properties.SEQUENCE}<br>
            `;
            metadataDiv.appendChild(metadataItem);
        }
    });
}

// Función para verificar si las coordenadas están dentro de un feature (simple ejemplo)
function isCoordinateInsideFeature(coords, feature) {
    // Aquí puedes agregar lógica para verificar si las coordenadas están dentro del feature
    // Esto es un ejemplo básico comparando la longitud y latitud del centro del polígono
    const polygon = feature.geometry.coordinates[0];
    const lngLatCenter = polygon.reduce((acc, coord) => {
        acc[0] += coord[0];
        acc[1] += coord[1];
        return acc;
    }, [0, 0]).map(val => val / polygon.length);
    
    return Math.abs(coords.lng - lngLatCenter[0]) < 0.5 && Math.abs(coords.lat - lngLatCenter[1]) < 0.5;
}

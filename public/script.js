mapboxgl.accessToken = 'pk.eyJ1IjoiY3V6em1vdGlvbiIsImEiOiJjbTF3Mnh5NWswZjhnMmtwcWNrazM5OWM0In0.CaBYToHwxrb804rdXCxC0g';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [0, 0], // Coordenadas iniciales
    zoom: 1
});

// Obtener coordenadas cuando se hace clic en el mapa
map.on('click', (e) => {
    const coords = e.lngLat;
    document.getElementById('info').innerText = 
      `Longitud: ${coords.lng}, Latitud: ${coords.lat}`;
});

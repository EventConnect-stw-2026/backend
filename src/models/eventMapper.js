const proj4 = require('proj4');

// Sistema de coordenadas UTM zona 30N (EPSG:25830) que usa Zaragoza
proj4.defs('EPSG:25830', '+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

function convertCoords(x, y) {
  if (!x || !y) return { lat: null, lng: null };
  try {
    const [lng, lat] = proj4('EPSG:25830', 'WGS84', [parseFloat(x), parseFloat(y)]);
    // Sanity check: Zaragoza está en ~41.6N, ~-0.9E
    if (lat > 40 && lat < 43 && lng > -2 && lng < 2) {
      return { lat, lng };
    }
    return { lat: null, lng: null };
  } catch {
    return { lat: null, lng: null };
  }
}

function mapZaragozaEvent(event) {
  const sub = event.subEvent?.[0] || {};
  const rawCoords = event.geometry?.coordinates || [];
  
  // Intenta primero las coordenadas del geometry, luego las del evento directo
  let lat = null, lng = null;
  
  if (rawCoords.length >= 2) {
    // Si son coordenadas pequeñas (WGS84 directas)
    if (Math.abs(rawCoords[1]) < 90 && Math.abs(rawCoords[0]) < 180) {
      lat = rawCoords[1];
      lng = rawCoords[0];
    } else {
      // Son UTM, convertir
      const converted = convertCoords(rawCoords[0], rawCoords[1]);
      lat = converted.lat;
      lng = converted.lng;
    }
  }

  const startRaw = sub.startDate || event.startDate;
  const endRaw = sub.endDate || event.endDate;

  return {
    externalId: String(event.id),
    title: event.title || "Sin título",
    description: (event.description || "Sin descripción").slice(0, 5000),
    category: event.category?.[0]?.title || "general",
    subcategory: event.tipoActividad || null,
    startDate: startRaw ? new Date(startRaw) : null,
    endDate: endRaw ? new Date(endRaw) : null,
    locationName: sub.location?.title || event.location?.title || "Ubicación desconocida",
    address: event.location?.address || null,
    latitude: lat,
    longitude: lng,
    imageUrl: event.image || null,
    sourceUrl: event.sameAs || null,
    isFree: !event.formaPago || event.formaPago === "Gratuita",
    status: "active",
    syncedAt: new Date()
  };
}

module.exports = mapZaragozaEvent;
import { createClient } from '@supabase/supabase-js';
// Node v20.6+ will inject env vars if run with --env-file=.env.local

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
const BBOX = "28.50,77.15,28.65,77.25";

const OVERPASS_QUERY = `
[out:json][timeout:60];
(
  node["amenity"="street_lamp"](${BBOX});
  node["amenity"="police"](${BBOX});
  node["public_transport"="stop_position"](${BBOX});
  node["highway"="bus_stop"](${BBOX});
);
out body;
`;

// Helper for delays/retries
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchOverpassData(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Fetching data from Overpass API (Attempt ${i + 1}/${retries})...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const response = await fetch(OVERPASS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'HerSafetyAppSeedScript/1.0'
        },
        body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (err) {
      console.error(`Attempt ${i + 1} failed: ${err.message}`);
      if (i === retries - 1) {
        throw new Error("Failed to fetch data from Overpass after maximum retries.");
      }
      console.log(`Waiting ${2 * (i + 1)} seconds before retrying...`);
      await delay(2000 * (i + 1));
    }
  }
}

function mapOsmToDataPoint(node) {
  const { id, lat, lon, tags } = node;
  let dataType = 'unknown';
  let weight = 0;

  if (tags.amenity === 'street_lamp') {
    dataType = 'street_lamp';
    weight = -1;
  } else if (tags.amenity === 'police') {
    dataType = 'police_station';
    weight = -2;
  } else if (tags.public_transport === 'stop_position' || tags.highway === 'bus_stop') {
    dataType = 'transit_stop';
    weight = 0;
  }

  return {
    source: 'osm',
    latitude: lat,
    longitude: lon,
    data_type: dataType,
    weight,
    metadata: {
      osm_id: id,
      ...tags
    }
  };
}

async function runSeed() {
  try {
    const elements = await fetchOverpassData();
    console.log(`Fetched ${elements.length} nodes from OSM.`);

    const dataPoints = elements.map(mapOsmToDataPoint).filter(p => p.data_type !== 'unknown');
    console.log(`Mapped to ${dataPoints.length} public_data_points payload.`);

    if (dataPoints.length === 0) {
      console.log("No data points to insert. Exiting.");
      return;
    }

    // Optional: Clear existing OSM data in this bounding box if we want idempotency?
    // User asked for a "one-time seed", so we'll just insert.
    // If they run it twice it duplicates, but that's fine for a seed script.
    
    console.log("Emptying old OSM data to prevent duplicates (if any)...");
    await supabase.from('public_data_points').delete().eq('source', 'osm');

    console.log("Batch inserting into Supabase...");
    
    // Batch inserts to avoid payload limits
    const BATCH_SIZE = 500;
    for (let i = 0; i < dataPoints.length; i += BATCH_SIZE) {
      const batch = dataPoints.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('public_data_points').insert(batch);
      
      if (error) {
        console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
      } else {
        console.log(`Inserted batch ${i / BATCH_SIZE + 1} (${batch.length} rows)`);
      }
    }

    // Verify row count
    const { count, error: countError } = await supabase
      .from('public_data_points')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error("Error verifying row count:", countError.message);
    } else {
      console.log(`Seed complete! Total rows in public_data_points: ${count}`);
    }

  } catch (err) {
    console.error("Seed script failed:", err.message);
    process.exit(1);
  }
}

runSeed();

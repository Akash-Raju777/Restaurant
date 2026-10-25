import fs from 'fs';
import path from 'path';
import https from 'https';

const images = [
  // Food items
  { url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80', dest: 'public/images/food/paneer-tikka.png' },
  { url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80', dest: 'public/images/food/butter-chicken.png' },
  { url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80', dest: 'public/images/food/veg-biryani.png' },
  { url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80', dest: 'public/images/food/chicken-biryani.png' },
  { url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80', dest: 'public/images/food/chocolate-lava-cake.png' },
  { url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80', dest: 'public/images/food/mojito.png' },
  { url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80', dest: 'public/images/food/chicken-tikka.png' },
  { url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80', dest: 'public/images/food/paneer-butter-masala.png' },
  { url: 'https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=800&q=80', dest: 'public/images/food/mutton-rogan-josh.png' },
  { url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80', dest: 'public/images/food/garlic-naan.png' },
  { url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', dest: 'public/images/food/hero-dish.png' },
  { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', dest: 'public/images/food/placeholder.png' },

  // Offers
  { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', dest: 'public/images/offers/weekend-special.png' },
  { url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', dest: 'public/images/offers/family-combo.png' },
  { url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', dest: 'public/images/offers/lunch-combo.png' },

  // About and Gallery
  { url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80', dest: 'public/images/about/chef-arjun.png' },
  { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80', dest: 'public/images/about/restaurant-ambience.png' },
  { url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80', dest: 'public/images/gallery/gallery-1.png' },
  { url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80', dest: 'public/images/gallery/gallery-2.png' },
  { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80', dest: 'public/images/gallery/gallery-3.png' },
  { url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80', dest: 'public/images/gallery/gallery-4.png' },
];

async function download(url, dest) {
  const fullPath = path.resolve(dest);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (redirectRes) => {
          const file = fs.createWriteStream(fullPath);
          redirectRes.pipe(file);
          file.on('finish', () => { file.close(); resolve(true); });
        }).on('error', () => resolve(false));
      } else {
        const file = fs.createWriteStream(fullPath);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(true); });
      }
    }).on('error', (err) => {
      console.error(`Error downloading ${url}:`, err.message);
      resolve(false);
    });
  });
}

async function run() {
  console.log('Downloading luxury culinary assets matching reference design...');
  for (const item of images) {
    process.stdout.write(`Fetching ${item.dest}... `);
    const success = await download(item.url, item.dest);
    console.log(success ? 'OK' : 'FAILED');
  }
  console.log('All imagery assets processed.');
}

run();

export const PRODUCT_IMAGES = [
  'assets/product-scenes/nectar-gold-marble.jpg',
  'assets/product-scenes/nectar-burgundy-rose.jpg',
  'assets/product-scenes/nectar-ivory-water.jpg',
  'assets/product-scenes/nectar-citrus.jpg',
  'assets/product-scenes/nectar-oud-smoke.jpg',
  'assets/product-scenes/nectar-rose-garden.jpg',
  'assets/product-scenes/nectar-aquatic.jpg',
  'assets/product-scenes/nectar-vanilla-spice.jpg',
  'assets/product-scenes/nectar-midnight-city.jpg',
  'assets/product-scenes/nectar-desert.jpg',
];

const pageOrders = new Map();

function shuffledOrder(page) {
  if (pageOrders.has(page)) return pageOrders.get(page);

  const order = PRODUCT_IMAGES.map((_, index) => index);
  let seed = (0x9e3779b9 ^ ((page + 1) * 0x85ebca6b)) >>> 0;

  for (let index = order.length - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }

  pageOrders.set(page, order);
  return order;
}

export function productImageForPosition(position, pageSize = 10) {
  const page = Math.floor(position / pageSize);
  const slot = position % pageSize;
  const order = shuffledOrder(page);
  return PRODUCT_IMAGES[order[slot % PRODUCT_IMAGES.length]];
}

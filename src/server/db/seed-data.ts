import { seedImages, type SeedImage } from "./seed-images";

export interface SeedVariant {
  price: string;
  stock: number;
  options: Record<string, string>;
}

export interface SeedProduct {
  name: string;
  description: string;
  isFeatured?: boolean;
  variants: SeedVariant[];
  images: readonly SeedImage[];
}

export interface SeedCategory {
  name: string;
  products: SeedProduct[];
}

export const seedCategories: SeedCategory[] = [
  {
    name: "Apparel",
    products: [
      {
        name: "Everyday Cotton Tee",
        description:
          "A soft, mid-weight 100% cotton tee with a relaxed fit. Pre-shrunk, tagless, and made to be worn on repeat.",
        isFeatured: true,
        variants: [
          { price: "24.00", stock: 40, options: { color: "White", size: "S" } },
          { price: "24.00", stock: 55, options: { color: "White", size: "M" } },
          { price: "24.00", stock: 50, options: { color: "White", size: "L" } },
          { price: "24.00", stock: 30, options: { color: "Black", size: "M" } },
          { price: "24.00", stock: 0, options: { color: "Black", size: "L" } },
        ],
        images: seedImages.tee,
      },
      {
        name: "Washed Denim Jacket",
        description:
          "A classic trucker-style jacket in light-wash denim. Button front, chest pockets, and a slightly cropped cut that pairs with everything.",
        variants: [
          { price: "89.00", stock: 12, options: { size: "S" } },
          { price: "89.00", stock: 18, options: { size: "M" } },
          { price: "89.00", stock: 15, options: { size: "L" } },
        ],
        images: seedImages.denimJacket,
      },
      {
        name: "Cloud Runner Sneakers",
        description:
          "Lightweight running sneakers with a breathable knit upper and a cushioned foam sole. Built for daily miles and everyday wear.",
        isFeatured: true,
        variants: [
          {
            price: "119.00",
            stock: 20,
            options: { color: "White", size: "8" },
          },
          {
            price: "119.00",
            stock: 25,
            options: { color: "White", size: "9" },
          },
          {
            price: "119.00",
            stock: 22,
            options: { color: "White", size: "10" },
          },
          {
            price: "119.00",
            stock: 10,
            options: { color: "Berry", size: "8" },
          },
          { price: "119.00", stock: 8, options: { color: "Berry", size: "9" } },
        ],
        images: seedImages.sneakers,
      },
      {
        name: "Ribbed Knit Beanie",
        description:
          "A warm, stretchy ribbed beanie in a soft acrylic-wool blend. One size, cuffed, and available in a few seasonal colors.",
        variants: [
          { price: "22.00", stock: 60, options: { color: "Rust" } },
          { price: "22.00", stock: 45, options: { color: "Charcoal" } },
          { price: "22.00", stock: 35, options: { color: "Sky Blue" } },
        ],
        images: seedImages.beanie,
      },
    ],
  },
  {
    name: "Food",
    products: [
      {
        name: "Whole Bean Coffee",
        description:
          "Small-batch roasted arabica beans with notes of chocolate, caramel, and red fruit. Roasted to order and shipped within 48 hours.",
        isFeatured: true,
        variants: [
          {
            price: "16.00",
            stock: 80,
            options: { roast: "Medium", size: "12 oz" },
          },
          {
            price: "28.00",
            stock: 40,
            options: { roast: "Medium", size: "2 lb" },
          },
          {
            price: "16.00",
            stock: 70,
            options: { roast: "Dark", size: "12 oz" },
          },
          {
            price: "28.00",
            stock: 35,
            options: { roast: "Dark", size: "2 lb" },
          },
        ],
        images: seedImages.coffee,
      },
      {
        name: "Dark Chocolate Bar",
        description:
          "Single-origin dark chocolate made from ethically sourced cacao. Rich, slightly fruity, and never too sweet.",
        variants: [
          { price: "6.50", stock: 120, options: { cacao: "70%" } },
          { price: "7.00", stock: 90, options: { cacao: "85%" } },
          { price: "7.50", stock: 0, options: { cacao: "100%" } },
        ],
        images: seedImages.chocolate,
      },
      {
        name: "Raw Wildflower Honey",
        description:
          "Unfiltered, unheated honey from wildflower meadows. Thick, floral, and perfect for tea, toast, or straight off the spoon.",
        variants: [
          { price: "12.00", stock: 50, options: { size: "8 oz" } },
          { price: "20.00", stock: 30, options: { size: "16 oz" } },
        ],
        images: seedImages.honey,
      },
      {
        name: "Loose Leaf Tea",
        description:
          "Hand-blended loose leaf tea in resealable tins. Brew hot or cold for a smooth cup with no bitterness.",
        variants: [
          {
            price: "14.00",
            stock: 45,
            options: { blend: "English Breakfast" },
          },
          { price: "14.00", stock: 40, options: { blend: "Jasmine Green" } },
          { price: "15.00", stock: 25, options: { blend: "Chamomile Mint" } },
        ],
        images: seedImages.tea,
      },
    ],
  },
  {
    name: "Electronics",
    products: [
      {
        name: "Wireless Over-Ear Headphones",
        description:
          "Active noise-cancelling headphones with 30-hour battery life, plush memory-foam ear cups, and multipoint Bluetooth pairing.",
        isFeatured: true,
        variants: [
          { price: "199.00", stock: 25, options: { color: "Black" } },
          { price: "199.00", stock: 15, options: { color: "White" } },
        ],
        images: seedImages.headphones,
      },
      {
        name: "Mechanical Keyboard",
        description:
          "A compact 75% mechanical keyboard with hot-swappable switches, PBT keycaps, and per-key RGB. Wired or wireless.",
        variants: [
          {
            price: "129.00",
            stock: 30,
            options: { switch: "Tactile (Brown)" },
          },
          { price: "129.00", stock: 22, options: { switch: "Linear (Red)" } },
          { price: "129.00", stock: 0, options: { switch: "Clicky (Blue)" } },
        ],
        images: seedImages.keyboard,
      },
      {
        name: "Portable Bluetooth Speaker",
        description:
          "A pocket-sized speaker with surprisingly big sound. Water-resistant, 12-hour battery, and pairs with a second speaker for stereo.",
        variants: [
          { price: "59.00", stock: 40, options: { color: "White" } },
          { price: "59.00", stock: 35, options: { color: "Black" } },
        ],
        images: seedImages.speaker,
      },
      {
        name: "Retro Compact Camera",
        description:
          "A modern compact camera with a classic rangefinder look. 24MP sensor, fast fixed lens, and film-style color profiles built in.",
        variants: [
          { price: "449.00", stock: 8, options: { finish: "Black" } },
          { price: "449.00", stock: 5, options: { finish: "Silver" } },
        ],
        images: seedImages.camera,
      },
    ],
  },
  {
    name: "Home",
    products: [
      {
        name: "Stoneware Mug",
        description:
          "A 12 oz hand-glazed stoneware mug with a comfortable handle and a satin finish. Dishwasher and microwave safe.",
        isFeatured: true,
        variants: [
          { price: "18.00", stock: 70, options: { color: "Cream" } },
          { price: "18.00", stock: 55, options: { color: "Slate" } },
          { price: "18.00", stock: 40, options: { color: "Sage" } },
        ],
        images: seedImages.mug,
      },
      {
        name: "Soy Wax Jar Candle",
        description:
          "Hand-poured soy wax candle in a reusable glass jar with a cotton wick. Around 45 hours of clean, even burn.",
        variants: [
          { price: "26.00", stock: 50, options: { scent: "Cedar & Amber" } },
          { price: "26.00", stock: 45, options: { scent: "Sea Salt" } },
          { price: "26.00", stock: 30, options: { scent: "Fig & Vanilla" } },
        ],
        images: seedImages.candle,
      },
      {
        name: "Chunky Knit Throw",
        description:
          "An oversized chunky-knit throw blanket in a soft, washable yarn. Big enough to share on the couch.",
        variants: [
          { price: "79.00", stock: 20, options: { color: "Oatmeal" } },
          { price: "79.00", stock: 15, options: { color: "Moss" } },
          { price: "79.00", stock: 12, options: { color: "Grey" } },
        ],
        images: seedImages.blanket,
      },
      {
        name: "Ceramic Planter",
        description:
          "A minimal matte ceramic planter with a drainage hole and matching saucer. Sized for desks, shelves, and windowsills.",
        variants: [
          { price: "24.00", stock: 40, options: { size: "Small (4 in)" } },
          { price: "34.00", stock: 25, options: { size: "Medium (6 in)" } },
          { price: "48.00", stock: 10, options: { size: "Large (8 in)" } },
        ],
        images: seedImages.planter,
      },
    ],
  },
];

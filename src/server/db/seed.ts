// import 'dotenv/config';
// // Import Drizzle and Neon DB client
// import { drizzle } from 'drizzle-orm/neon-http';
// import { neon } from '@neondatabase/serverless';

// // We ONLY import the schema definitions we need, not the main 'db' instance
// import { products } from '~/server/db/schema';

// // Mock data for your products
// const mockProducts = [
//   {
//     name: 'Classic Cotton Tee',
//     description: 'A super soft, 100% cotton tee. Perfect for everyday wear.',
//     price: '24.99', // Remember, 'numeric' is a string
//     stock: 100,
//     images: ['https://placehold.co/600x600/f0f0f0/333?text=Tee'],
//     isFeatured: true,
//   },
//   {
//     name: 'Modern Denim Jeans',
//     description: 'Stylish, comfortable slim-fit jeans.',
//     price: '59.99',
//     stock: 50,
//     images: ['https://placehold.co/600x600/e0e0e0/333?text=Jeans'],
//   },
//   {
//     name: 'Leather Biker Jacket',
//     description: 'A timeless jacket with a modern cut. Real leather.',
//     price: '149.99',
//     stock: 20,
//     images: ['https://placehold.co/600x600/d0d0d0/333?text=Jacket'],
//   },
//   {
//     name: 'Canvas Sneakers',
//     description: 'White canvas sneakers, a must-have for any wardrobe.',
//     price: '45.00',
//     stock: 75,
//     images: ['https://placehold.co/600x600/c0c0c0/333?text=Sneakers'],
//   },
// ];

// async function main() {
//   console.log('🌱 Seeding database with mock products...');

//   // 1. Create a new, standalone DB connection for the script
//   if (!process.env.DATABASE_URL) {
//     throw new Error('DATABASE_URL is not set in your .env file');
//   }
//   const sql = neon(process.env.DATABASE_URL);

//   // 2. Pass the 'products' schema to Drizzle
//   // We don't need the full schema, just what we're seeding
//   const db = drizzle(sql, { schema: { products } });

//   try {
//     // 3. Clear existing products (optional, but good for testing)
//     console.log('Clearing old products...');
//     await db.delete(products);

//     // 4. Insert the new mock products
//     console.log('Inserting new products...');
//     await db.insert(products).values(mockProducts);

//     console.log('✅ Database seeded successfully!');
//   } catch (error) {
//     console.error('❌ Failed to seed database:', error);
//     process.exit(1);
//   }

//   // The script will automatically exit as there are no more tasks
// }

// void main();

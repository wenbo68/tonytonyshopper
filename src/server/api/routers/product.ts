import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
// import { db } from '~/server/db';

export const productRouter = createTRPCRouter({
  /**
   * Fetches all products.
   * We will add pagination and filtering here later.
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.query.products.findMany();
    return products;
  }),
});

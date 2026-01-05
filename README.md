# ecommerce website

## content

### products

- Home page: shows selected products
- All products page: all products, filters, pagination
- Product details page: details of a product, comments, comment filters
- Cart page: guest -> localstorage | user -> db
- Checkout page: stripe

### user

- Login page: google/discord oauth
- Orders page: user's order history, order filters, returns

### admin

- Sales page: admin's sales history, sales filters, ship/refunds
- Add product page: add new product
- Edit product page: edit existing product

### legal

- about us
- contact us
- privacy policy
- terms & conditions

## pending features

### comments

- current comments design: backend feed tree to frontend (as opposed to backend feeding list and frontend building tree out of list)
- good for reading: frontend just displays the tree
- bad to interactivity (optimistic updates): needs to change the entire comment tree instead of just 1 comment in the list

## reminders

### next/image

- Image: consists of a container (size can be set by classname in Image) and an image
- Image needs width/height or fill (fills the parent container)

#### w/h vs. fill

- w/h: image size but image will fill container if using object-fill/cover (will not crop, so must set overflow-hidden in container)
- if image size >= container size, image clear
- if image size < container size, image blurry

- fill: image resolution always = container size (resolution adjusts when container size change due to responsive screen size)

#### Image classname: object-fill/cover/contain/none/scale-down

- object-fill (default): fill container, don't keep ratio
- object-cover: fill container, keep ratio
- object-contain: show whole image, keep ratio
- object-none: don't change image size (will overflow if image size > container size, but overflow: hidden in container will crop overflow)
- object-scale-down: if image size > container size, scale down, keep ratio; if image size < container size, nothing

#### Image classname: object-center/top/bottom/left/right

- only matters when there are white spaces between image & container of Image (object-center is default)

### race condition (only triggered by db writes/updates but not db reads to the same row in a table)

- db update race condition: if different users can trigger db update simultaneously (or 1 user fires 2nd update when 1st update isn't finished) -> can lead to race condition
- to prevent race condition, make the db update use transaction

### transaction

- prevents partial updates via rollbacks
- prevents race conditions via isolation.
- Isolation can be implemented using locks (serializes both reads/writes to the same row so reads will block writes and vice versa), MVCC (only writes to the same row are serialized), etc.
- best practice: transactions should be declared once at the very top level (usually in the trpc procedure) to represent 1 business logic
- so helper function should not declare its own transactions but use tx passed from caller (ie trpc procedure)

### react query

#### mutation flags

- isPending: mutation running

#### query flags

- isLoading (isPending in newest version): 1st fetch running
- isRefetching: refetch (any fetch after 1st fetch) running
- isFetching: any fetch (1st fetch or fetch) running

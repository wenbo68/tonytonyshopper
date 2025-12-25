# ecommerce website

## content

### products

- Home page: shows selected products
- All page: all products, filters, pagination
- detail page: details of a product, comments, comment filters
- cart page: guest -> localstorage | user -> db
- checkout page: stripe

### user

- login page: google/discord oauth
- order history
- admin: add product page

### legal

- about us
- contact us
- privacy policy
- terms & conditions

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

### race condition

- db update race condition: if different users can trigger db update simultaneously -> can lead to race condition
- to prevent race condition, make the db update use transaction

### react query

#### mutation flags

- isPending: mutation running

#### query flags

- isLoading (isPending in newest version): 1st fetch running
- isRefetching: refetch (any fetch after 1st fetch) running
- isFetching: any fetch (1st fetch or fetch) running

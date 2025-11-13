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

- Image: consists of a container (size can be set by classname in Image) and an image
- Image needs width/height or fill (fills the parent container)

- w/h: image size but image will fill container if using object-fill/cover
- if image size >= container size, image clear
- if image size < container size, image blurry

- fill: image resolution always = container size (resolution adjusts when container size change due to responsive screen size)

- Image classname: object-fill/cover/contain/none/scale-down
- object-fill (default): fill container, don't keep ratio
- object-cover: fill container, keep ratio, crop overflow
- object-contain: show whole image, keep ratio
- object-none: don't change image size (will overflow if image size > container size, but overflow: hidden in container will crop overflow)
- object-scale-down: if image size > container size, scale down, keep ratio; if image size < container size, nothing

- Image classname: object-center/top/bottom/left/right
- only matters when there are white spaces between image & container of Image (object-center is default)

- db update race condition: if different users can trigger db update simultaneously -> can lead to race condition
- to prevent race condition, make the db update use transaction

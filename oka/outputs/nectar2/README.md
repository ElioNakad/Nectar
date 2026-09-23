# NECTAR

A cinematic, responsive luxury fragrance landing page with 3D pointer tilt, magnetic calls to action, scroll reveals, interactive fragrance notes, a size selector, accordion ritual, and bag feedback.

`shop.html` is the separate full-catalog experience. It loads products from the Supabase `perfume_catalog` view and performs pagination, gender filtering, name/brand search, and sorting in the database.

Gender uses the source catalog's tags, product-description metadata, and explicit wording in product names. Products without an explicit source gender remain under All and display “Not specified”; they are not assigned to Women, Men, or Unisex.

The project is plain HTML, CSS, and JavaScript with no frontend build step. `supabase-client.js` contains the public Supabase project URL and publishable key, so the site works with any normal static server and on Vercel without environment-variable configuration.

Never place a Supabase secret or `service_role` key in this frontend. Public access is controlled by the database grants and RLS policies.

The campaign image was generated specifically for this concept using the built-in image generation tool. Prompt summary: an ultra-premium amber perfume bottle on obsidian, surrounded by liquid-gold ribbons, black-plum atmosphere, and cinematic chiaroscuro lighting, with negative space for headline copy.

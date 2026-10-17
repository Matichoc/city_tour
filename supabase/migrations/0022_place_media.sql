-- Imágenes de las fichas que entrega cada comercio (logo, carta, fotos y
-- promociones) y su registro en SERNATUR.

-- 1) Tipo, tamaño y texto alternativo en inglés y portugués.
--    storage_path: ruta pública del sitio (/lugares/...) o, más adelante,
--    del bucket place-images cuando se suban desde el panel.
alter table public.place_images
  add column kind text not null default 'photo'
    check (kind in ('photo', 'menu', 'promo', 'logo')),
  add column width integer check (width > 0),
  add column height integer check (height > 0),
  add column alt_text_en text,
  add column alt_text_pt text;

-- 2) Registro de prestadores de servicios turísticos de SERNATUR (lo informa
--    el local; se confirma al verificar la ficha).
alter table public.places
  add column sernatur_number text check (sernatur_number ~ '^[0-9]{1,10}$'),
  add column sernatur_valid_until date,
  add constraint places_sernatur_pair check ((sernatur_number is null) = (sernatur_valid_until is null));

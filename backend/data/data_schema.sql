CREATE TABLE items (
  name         TEXT,
  description  TEXT,
  price        NUMERIC,
  category     TEXT,
  brand_store  TEXT,
  material     TEXT,
  date_posted  TIMESTAMPTZ,
  location     TEXT,
  sizes        TEXT[], 
  image_urls   TEXT[],
  data_source  TEXT,
  api_source   TEXT
);

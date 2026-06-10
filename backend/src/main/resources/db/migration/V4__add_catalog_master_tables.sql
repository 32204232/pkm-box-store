CREATE TABLE IF NOT EXISTS categories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    display_order INT NOT NULL,
    active BIT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_categories_slug (slug),
    INDEX idx_categories_active_display_order (active, display_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_types (
    id BIGINT NOT NULL AUTO_INCREMENT,
    category_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    display_order INT NOT NULL,
    active BIT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_product_types_category_slug (category_id, slug),
    INDEX idx_product_types_category_active_display_order (category_id, active, display_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS series (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    display_order INT NOT NULL,
    active BIT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_series_slug (slug),
    INDEX idx_series_active_display_order (active, display_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE products
    ADD COLUMN retail_price DECIMAL(12, 2) NULL,
    ADD COLUMN category_id BIGINT NULL,
    ADD COLUMN product_type_id BIGINT NULL,
    ADD COLUMN series_id BIGINT NULL,
    ADD COLUMN language VARCHAR(30) NULL;

CREATE INDEX idx_products_category_id ON products (category_id);
CREATE INDEX idx_products_product_type_id ON products (product_type_id);
CREATE INDEX idx_products_series_id ON products (series_id);
CREATE INDEX idx_products_language ON products (language);

INSERT INTO categories (name, slug, description, display_order, active, created_at, updated_at) VALUES
('미개봉 상품', 'sealed-product', '미개봉 포켓몬 카드 박스와 세트 상품', 10, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('싱글 카드', 'single-card', '개별 포켓몬 카드와 프로모 카드', 20, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('서플라이', 'supply', '슬리브, 플레이매트 등 포켓몬 카드 관련 용품', 30, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('기타', 'other', '기타 포켓몬 TCG 관련 상품', 90, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

INSERT INTO product_types (category_id, name, slug, description, display_order, active, created_at, updated_at)
SELECT id, '확장팩 박스', 'expansion-box', '확장팩 sealed box 상품', 10, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM categories WHERE slug = 'sealed-product';

INSERT INTO product_types (category_id, name, slug, description, display_order, active, created_at, updated_at)
SELECT id, '강화 확장팩 박스', 'enhanced-expansion-box', '강화 확장팩 sealed box 상품', 20, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM categories WHERE slug = 'sealed-product';

INSERT INTO product_types (category_id, name, slug, description, display_order, active, created_at, updated_at)
SELECT id, '하이크래스팩 박스', 'high-class-pack-box', '하이크래스팩 sealed box 상품', 30, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM categories WHERE slug = 'sealed-product';

INSERT INTO product_types (category_id, name, slug, description, display_order, active, created_at, updated_at)
SELECT id, '스페셜 세트', 'special-set', '스페셜 세트 상품', 40, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM categories WHERE slug = 'sealed-product';

INSERT INTO product_types (category_id, name, slug, description, display_order, active, created_at, updated_at)
SELECT id, '스타터 덱', 'starter-deck', '스타터 덱 상품', 50, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM categories WHERE slug = 'sealed-product';

INSERT INTO product_types (category_id, name, slug, description, display_order, active, created_at, updated_at)
SELECT id, '싱글 카드', 'single-card', '개별 싱글 카드 상품', 10, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM categories WHERE slug = 'single-card';

INSERT INTO product_types (category_id, name, slug, description, display_order, active, created_at, updated_at)
SELECT id, '프로모 카드', 'promo-card', '프로모 카드 상품', 20, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM categories WHERE slug = 'single-card';

INSERT INTO product_types (category_id, name, slug, description, display_order, active, created_at, updated_at)
SELECT id, '슬리브', 'sleeve', '카드 슬리브 상품', 10, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM categories WHERE slug = 'supply';

INSERT INTO product_types (category_id, name, slug, description, display_order, active, created_at, updated_at)
SELECT id, '플레이매트', 'playmat', '플레이매트 상품', 20, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM categories WHERE slug = 'supply';

INSERT INTO product_types (category_id, name, slug, description, display_order, active, created_at, updated_at)
SELECT id, '기타', 'other', '기타 상품 유형', 10, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM categories WHERE slug = 'other';

INSERT INTO series (name, slug, description, display_order, active, created_at, updated_at) VALUES
('스칼렛&바이올렛', 'scarlet-violet', '스칼렛&바이올렛 시리즈', 10, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('소드&실드', 'sword-shield', '소드&실드 시리즈', 20, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('썬&문', 'sun-moon', '썬&문 시리즈', 30, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('블랙볼트', 'black-bolt', '블랙볼트 상품군', 40, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('화이트플레어', 'white-flare', '화이트플레어 상품군', 50, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('기타', 'other', '기타 시리즈', 90, b'1', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

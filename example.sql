# 1. Complex query with multiple joins, grouping, and sorting
SELECT 
    p.category,
    p.name as product_name,
    COUNT(DISTINCT po.id_user) as total_owners,
    SUM(po.stock) as total_stock,
    AVG(po.price_sell - po.price_buy) as avg_margin,
    MAX(po.price_sell) as highest_price,
    MIN(po.price_sell) as lowest_price
FROM product p
LEFT JOIN product_owner po ON p.id = po.id_product
WHERE po.stock > 0 
    AND po.price_sell > 0
GROUP BY p.category, p.name
HAVING avg_margin > 10000
ORDER BY total_stock DESC, avg_margin DESC;

# 2. Query with subqueries and complex conditions
SELECT 
    u.id_user,
    (SELECT COUNT(*) 
     FROM product_owner po2 
     WHERE po2.id_user = po.id_user) as products_owned,
    p.name,
    po.stock,
    po.price_sell,
    (SELECT AVG(price_sell) 
     FROM product_owner po3 
     WHERE po3.id_product = p.id 
     AND po3.id_user != po.id_user) as avg_others_price
FROM product_owner po
JOIN product p ON po.id_product = p.id
WHERE po.price_sell > (
    SELECT AVG(price_sell) * 1.5
    FROM product_owner
    WHERE id_product = po.id_product
)
AND po.stock > (
    SELECT AVG(stock)
    FROM product_owner
    WHERE id_product = po.id_product
)
ORDER BY po.price_sell DESC;

# 3. Query with self-join and aggregates
SELECT 
    p1.category,
    p1.name,
    po1.price_sell as current_price,
    po1.stock as current_stock,
    COUNT(DISTINCT po2.id_user) as competing_sellers,
    MIN(po2.price_sell) as min_market_price,
    MAX(po2.price_sell) as max_market_price,
    AVG(po2.price_sell) as avg_market_price,
    SUM(po2.stock) as total_market_stock
FROM product p1
JOIN product_owner po1 ON p1.id = po1.id_product
LEFT JOIN product_owner po2 ON p1.id = po2.id_product 
    AND po2.id_user != po1.id_user
    AND po2.price_sell > 0
WHERE po1.stock > 0
GROUP BY p1.category, p1.name, po1.price_sell, po1.stock
HAVING competing_sellers > 0
ORDER BY (po1.price_sell - min_market_price) DESC;
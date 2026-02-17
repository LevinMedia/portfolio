-- Allow private-access users to see works with is_private = true.
-- 1) New RPC: list of published works including private (for authenticated private-access users).
-- 2) Slug RPC: return is_private so API can restrict private works when user lacks access.

-- New function: get published selected works including private (same shape as prod_get_selected_works)
CREATE OR REPLACE FUNCTION prod_get_selected_works_include_private()
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    content TEXT,
    feature_image_url TEXT,
    thumbnail_crop JSONB,
    display_order INTEGER,
    published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sw.id,
        sw.title,
        sw.slug,
        sw.content,
        sw.feature_image_url,
        sw.thumbnail_crop,
        sw.display_order,
        sw.published_at
    FROM selected_works sw
    WHERE sw.is_published = true
    ORDER BY sw.display_order DESC, sw.published_at DESC;
END;
$$;

-- Slug function: add is_private to return so API can enforce access
-- Must drop first because return type (OUT parameters) is changing
DROP FUNCTION IF EXISTS prod_get_selected_work_by_slug(TEXT);

CREATE OR REPLACE FUNCTION prod_get_selected_work_by_slug(p_slug TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    content TEXT,
    feature_image_url TEXT,
    thumbnail_crop JSONB,
    display_order INTEGER,
    published_at TIMESTAMPTZ,
    is_private BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sw.id,
        sw.title,
        sw.slug,
        sw.content,
        sw.feature_image_url,
        sw.thumbnail_crop,
        sw.display_order,
        sw.published_at,
        COALESCE(sw.is_private, false)
    FROM selected_works sw
    WHERE sw.slug = p_slug AND sw.is_published = true
    LIMIT 1;
END;
$$;

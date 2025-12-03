-- Add GIN indexes for full-text search on templates table
-- This will dramatically improve search performance on large datasets (1000+ records)

-- Create tsvector columns for better performance (pre-computed full-text vectors)
ALTER TABLE templates 
ADD COLUMN name_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, ''))) STORED,
ADD COLUMN content_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED;

-- Create GIN indexes on tsvector columns for fast full-text search
CREATE INDEX idx_templates_name_tsv ON templates USING gin(name_tsv);
CREATE INDEX idx_templates_content_tsv ON templates USING gin(content_tsv);

-- Also add regular B-tree indexes for exact matches and sorting
CREATE INDEX idx_templates_name_btree ON templates(name);
CREATE INDEX idx_templates_user_updated ON templates(user_id, updated_at DESC);

-- Create composite GIN index for combined search (name + content)
-- This allows searching across both fields efficiently
CREATE INDEX idx_templates_combined_tsv ON templates USING gin(
  (setweight(to_tsvector('english', coalesce(name, '')), 'A') || 
   setweight(to_tsvector('english', coalesce(content, '')), 'B'))
);

-- Add similar indexes for projects table (for future search optimization)
ALTER TABLE projects 
ADD COLUMN name_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, ''))) STORED;

CREATE INDEX idx_projects_name_tsv ON projects USING gin(name_tsv);
CREATE INDEX idx_projects_user_updated ON projects(user_id, updated_at DESC);

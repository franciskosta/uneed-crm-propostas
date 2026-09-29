-- Private bucket, no browser grants or Storage policies. Backend mediates all access.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kickoff-images', 'kickoff-images', false, 10485760,
        array['image/jpeg','image/png','image/webp']);

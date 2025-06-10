/*
  # Add Storage Policies for Profile Images

  1. New Storage Policies
    - Create policies for the avatars bucket to allow users to upload and manage their own profile images
    - Enable public access to profile images

  2. Security
    - Ensure users can only upload and manage their own profile images
    - Allow public read access to all profile images
*/

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload avatar images
CREATE POLICY "Users can upload their own avatar images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-images' AND
  POSITION(auth.uid()::text IN name) > 0
);

-- Create policy to allow users to update/delete their own avatar images
CREATE POLICY "Users can update/delete their own avatar images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-images' AND
  POSITION(auth.uid()::text IN name) > 0
);

CREATE POLICY "Users can delete their own avatar images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-images' AND
  POSITION(auth.uid()::text IN name) > 0
);

-- Create policy to allow public access to avatar images
CREATE POLICY "Public can view all avatar images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-images'
);
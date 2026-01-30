-- Add DELETE policy for notification_preferences to allow users to delete their own data
CREATE POLICY "Users can delete their own preferences"
  ON public.notification_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add admin storage policies for UPDATE and DELETE on borrower-documents bucket
CREATE POLICY "Admins can update all documents"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'borrower-documents' AND public.has_role(auth.uid(), 'admin'::public.user_role));

CREATE POLICY "Admins can delete all documents"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'borrower-documents' AND public.has_role(auth.uid(), 'admin'::public.user_role));
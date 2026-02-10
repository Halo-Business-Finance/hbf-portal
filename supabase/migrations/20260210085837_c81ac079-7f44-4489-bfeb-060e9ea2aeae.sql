INSERT INTO public.user_roles (user_id, role)
VALUES ('c38d5267-f662-4f8c-92b6-1ae8f12e32ac', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
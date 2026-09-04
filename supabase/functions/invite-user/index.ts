import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const auth = req.headers.get('Authorization');
  if (!auth) return new Response('Unauthorized', { status: 401 });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const caller = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const admin = createClient(url, service);

  const { data: { user } } = await caller.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: profile } = await admin.from('attendance_profiles').select('role,status').eq('id', user.id).single();
  if (profile?.role !== 'admin' || profile?.status !== 'active') return new Response('Forbidden', { status: 403 });

  const body = await req.json();
  const email = String(body.email || '').trim().toLowerCase();
  const full_name = String(body.full_name || '').trim();
  const role = ['admin', 'teacher', 'viewer'].includes(body.role) ? body.role : 'viewer';
  if (!email || !full_name) return new Response('Email and full name are required', { status: 400 });

  const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name }
  });
  if (error) return new Response(error.message, { status: 400 });

  const { error: profileError } = await admin.from('attendance_profiles').upsert({
    id: invited.user.id, full_name, email, role, status: 'active'
  });
  if (profileError) return new Response(profileError.message, { status: 400 });

  await admin.from('attendance_activity_logs').insert({
    user_id: user.id,
    user_name: profile?.full_name || user.email,
    action: 'user_invited',
    target_type: 'user',
    target_id: invited.user.id,
    metadata: { email, role }
  });

  return Response.json({ id: invited.user.id, email, role });
});

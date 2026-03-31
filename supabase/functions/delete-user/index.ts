import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check caller is admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent admin from deleting themselves
    if (user_id === caller.id) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's class info before deletion (to clean up class if they're the rep)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('class_id, is_representative')
      .eq('user_id', user_id)
      .maybeSingle();

    // Delete related data in order
    await supabaseAdmin.from('notifications').delete().eq('user_id', user_id);
    await supabaseAdmin.from('booking_status_history').delete().in(
      'booking_id',
      (await supabaseAdmin.from('bookings').select('id').eq('user_id', user_id)).data?.map(b => b.id) || []
    );
    await supabaseAdmin.from('equipment_issues').delete().eq('user_id', user_id);
    await supabaseAdmin.from('bookings').delete().eq('user_id', user_id);
    await supabaseAdmin.from('class_members').delete().eq('user_id', user_id);
    await supabaseAdmin.from('user_roles').delete().eq('user_id', user_id);
    await supabaseAdmin.from('profiles').delete().eq('user_id', user_id);

    // If user was a class representative, deactivate the class so it can be re-registered
    if (profile?.is_representative && profile?.class_id) {
      await supabaseAdmin.from('classes')
        .update({ representative_user_id: null, is_active: false })
        .eq('id', profile.class_id);
    }

    // Delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (deleteError) {
      throw deleteError;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to delete user' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

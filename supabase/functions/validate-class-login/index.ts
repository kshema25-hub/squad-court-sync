import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ValidateLoginRequest {
  email: string;
  class_code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, class_code }: ValidateLoginRequest = await req.json();

    console.log("Validating login for:", email, "with class code:", class_code);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the class with this code
    const { data: classData, error: classError } = await supabaseAdmin
      .from("classes")
      .select("id, name, representative_user_id, is_active")
      .eq("class_code", class_code.toUpperCase())
      .single();

    if (classError || !classData) {
      console.error("Class not found:", classError);
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid class code" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!classData.is_active) {
      return new Response(
        JSON.stringify({ valid: false, error: "This class is no longer active" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error fetching users:", userError);
      throw new Error("Failed to validate user");
    }

    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      return new Response(
        JSON.stringify({ valid: false, error: "Email not found" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if this user is the representative for this class
    if (classData.representative_user_id !== user.id) {
      return new Response(
        JSON.stringify({ valid: false, error: "This email is not authorized for this class code" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Login validation successful for class:", classData.name);

    return new Response(
      JSON.stringify({ 
        valid: true, 
        class_id: classData.id,
        class_name: classData.name,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in validate-class-login:", error);
    return new Response(
      JSON.stringify({ valid: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
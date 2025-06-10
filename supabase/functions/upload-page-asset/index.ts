import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface UploadAssetRequest {
  page_id: string
  asset_type: string
  file_name: string
  file_data: string // base64 encoded
  mime_type: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { page_id, asset_type, file_name, file_data, mime_type }: UploadAssetRequest = await req.json()

    if (!page_id || !asset_type || !file_name || !file_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user is an admin
    const { data: adminRole } = await supabase
      .from('admin_role_assignments')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .in('role_name', ['super_admin', 'admin'])
      .single()

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Decode base64 file data
    const base64Data = file_data.split(',')[1] || file_data
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

    // Generate a unique file path
    const timestamp = Date.now()
    const fileExt = file_name.split('.').pop()
    const storagePath = `${page_id}/${asset_type}/${timestamp}_${file_name}`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('page-assets')
      .upload(storagePath, binaryData, {
        contentType: mime_type,
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('page-assets')
      .getPublicUrl(storagePath)

    // Record in page_assets table
    const { data: assetRecord, error: assetError } = await supabase
      .from('page_assets')
      .insert({
        page_id,
        asset_type,
        file_name,
        storage_path: storagePath,
        mime_type,
        file_size: binaryData.length,
        created_by: user.id
      })
      .select()
      .single()

    if (assetError) {
      throw assetError
    }

    return new Response(
      JSON.stringify({
        success: true,
        asset_id: assetRecord.id,
        public_url: publicUrlData.publicUrl
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
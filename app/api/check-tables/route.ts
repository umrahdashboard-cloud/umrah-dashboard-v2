import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Try to list all tables in the public schema
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (error) {
      // Try an alternative approach - query pg_tables
      const { data: pgData, error: pgError } = await supabase.rpc('get_tables', {})
      if (pgError) {
        return Response.json({
          error: 'Could not list tables',
          supabaseError: pgError,
        })
      }
      return Response.json({ tables: pgData })
    }

    return Response.json({ tables: data })
  } catch (err) {
    return Response.json({
      error: String(err),
    })
  }
}

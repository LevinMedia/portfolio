import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Test 1: Check if tables exist
    console.log('Testing table existence...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['work_companies', 'work_positions', 'admin_users'])

    if (tablesError) {
      console.error('Error checking tables:', tablesError)
      return NextResponse.json({ error: 'Failed to check tables', details: tablesError }, { status: 500 })
    }

    console.log('Tables found:', tables)

    // Test 2: Check if functions exist
    console.log('Testing function existence...')
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .in('routine_name', ['prod_get_work_history', 'prod_upsert_work_company'])

    if (functionsError) {
      console.error('Error checking functions:', functionsError)
      return NextResponse.json({ error: 'Failed to check functions', details: functionsError }, { status: 500 })
    }

    console.log('Functions found:', functions)

    // Test 3: Direct table query
    console.log('Testing direct table query...')
    const { data: companies, error: companiesError } = await supabase
      .from('work_companies')
      .select('*')
      .limit(5)

    if (companiesError) {
      console.error('Error querying companies:', companiesError)
      return NextResponse.json({ error: 'Failed to query companies', details: companiesError }, { status: 500 })
    }

    console.log('Companies found:', companies)

    // Test 4: Try the function
    console.log('Testing prod_get_work_history function...')
    const { data: workHistory, error: workHistoryError } = await supabase.rpc('prod_get_work_history')

    if (workHistoryError) {
      console.error('Error calling prod_get_work_history:', workHistoryError)
      return NextResponse.json({ 
        error: 'Failed to call prod_get_work_history', 
        details: workHistoryError,
        tables,
        functions,
        companies
      }, { status: 500 })
    }

    console.log('Work history function result:', workHistory)

    return NextResponse.json({
      success: true,
      tables,
      functions,
      companies,
      workHistory
    })

  } catch (err) {
    console.error('Error in test-db API:', err)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}

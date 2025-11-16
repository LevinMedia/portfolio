import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here
    const authHeader = request.headers.get('authorization')
    const secret = process.env.REVALIDATION_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Revalidate the home page and the howdy API route
    revalidatePath('/')
    revalidatePath('/api/howdy')
    
    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (err) {
    console.error('Error revalidating:', err)
    return NextResponse.json(
      { error: 'Error revalidating' },
      { status: 500 }
    )
  }
}


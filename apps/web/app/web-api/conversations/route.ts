import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch conversations from backend
    const response = await fetch(`http://localhost:8001/api/v1/conversations/?user_id=${user.id}`);
    
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    
    // Transform backend format to frontend format
    const conversations = data.conversations.map((conv: any) => {
      const title = conv.title || (conv.last_message ? conv.last_message.substring(0, 50) + '...' : 'New Conversation');
      return {
        id: conv.id,
        title: title,
        createdAt: conv.timestamp || new Date().toISOString(),
        preview: conv.last_message || ''
      };
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // For new conversations, we'll let the backend generate the ID
    const newConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: body.title || 'New Conversation',
      createdAt: new Date().toISOString(),
      preview: ''
    };

    return NextResponse.json(newConversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}

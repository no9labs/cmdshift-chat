import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Fetch messages from backend
    const response = await fetch(
      `http://localhost:8001/api/v1/conversations/${id}/messages?user_id=${user.id}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return new Response('Failed to fetch messages', { status: response.status });
    }

    const messages = await response.json();
    return Response.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Optional, Any
import json
import logging
from app.services.memory import MemoryManager
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()
memory_manager = MemoryManager()

class ConversationMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None
    model: Optional[str] = None

@router.get("/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    user_id: str,
    request: Request,
    limit: int = 50
) -> Dict[str, Any]:
    """Get messages for a specific conversation"""
    try:
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        # Get messages from memory manager
        messages = await memory_manager.get_context(
            conversation_id=conversation_id,
            user_id=user_id,
            max_messages=limit
        )
        
        return {
            "conversation_id": conversation_id,
            "messages": messages,
            "count": len(messages)
        }
        
    except Exception as e:
        logger.error(f"Error fetching conversation messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_conversations(
    user_id: str,
    request: Request,
    limit: int = 20
) -> Dict[str, Any]:
    """List user's conversations"""
    try:
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        # Get conversations from memory manager
        conversations = await memory_manager.get_user_conversations(
            user_id=user_id,
            limit=limit
        )
        
        return {
            "conversations": conversations,
            "count": len(conversations)
        }
        
    except Exception as e:
        logger.error(f"Error listing conversations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_id: str,
    request: Request
) -> Dict[str, str]:
    """Delete a conversation"""
    try:
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        # Clear conversation from memory
        await memory_manager.clear_conversation(
            conversation_id=conversation_id,
            user_id=user_id
        )
        
        return {"message": "Conversation deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
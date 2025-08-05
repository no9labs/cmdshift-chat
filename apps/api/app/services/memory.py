from typing import List, Dict, Optional
import json
from datetime import datetime, timedelta
import redis.asyncio as redis
from app.core.config import settings

class MemoryManager:
    def __init__(self):
        self.redis_client = None
        self.memory_ttl = 7 * 24 * 60 * 60  # 7 days in seconds
        
    async def _get_redis(self) -> redis.Redis:
        """Get or create Redis connection"""
        if not self.redis_client:
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True
            )
        return self.redis_client
    
    async def get_context(
        self,
        conversation_id: str,
        user_id: str,
        max_messages: int = 20
    ) -> List[Dict[str, str]]:
        """Retrieve conversation context from memory"""
        try:
            redis_client = await self._get_redis()
            key = f"conv:{user_id}:{conversation_id}"
            
            # Get recent messages
            messages = await redis_client.lrange(key, -max_messages, -1)
            
            # Parse JSON messages
            context = []
            for msg in messages:
                try:
                    context.append(json.loads(msg))
                except json.JSONDecodeError:
                    continue
                    
            return context
            
        except Exception as e:
            print(f"Error retrieving context: {e}")
            return []
    
    async def store_conversation(
        self,
        conversation_id: str,
        user_id: str,
        messages: List[Dict[str, str]],
        model: str
    ):
        """Store conversation messages in memory"""
        try:
            redis_client = await self._get_redis()
            key = f"conv:{user_id}:{conversation_id}"
            
            # Store each message
            for msg in messages:
                # Convert ChatMessage objects to dict if needed
                if hasattr(msg, 'dict'):
                    msg_dict = msg.dict()
                else:
                    msg_dict = msg
                    
                # Add metadata
                msg_with_meta = {
                    **msg_dict,
                    "timestamp": datetime.utcnow().isoformat(),
                    "model": model if msg_dict["role"] == "assistant" else None
                }
                
                # Push to Redis list
                await redis_client.rpush(key, json.dumps(msg_with_meta))
            
            # Set TTL on the key
            await redis_client.expire(key, self.memory_ttl)
            
            # Update conversation index
            index_key = f"user_convs:{user_id}"
            await redis_client.zadd(
                index_key,
                {conversation_id: datetime.utcnow().timestamp()}
            )
            await redis_client.expire(index_key, self.memory_ttl)
            
        except Exception as e:
            print(f"Error storing conversation: {e}")
    
    async def search_memories(
        self,
        user_id: str,
        query: str,
        limit: int = 10
    ) -> List[Dict]:
        """Search through user's conversation history"""
        try:
            redis_client = await self._get_redis()
            
            # Get all user conversations
            index_key = f"user_convs:{user_id}"
            conv_ids = await redis_client.zrange(index_key, 0, -1)
            
            results = []
            for conv_id in conv_ids:
                key = f"conv:{user_id}:{conv_id}"
                messages = await redis_client.lrange(key, 0, -1)
                
                # Search through messages
                for msg_str in messages:
                    try:
                        msg = json.loads(msg_str)
                        if query.lower() in msg.get("content", "").lower():
                            results.append({
                                "conversation_id": conv_id,
                                "message": msg,
                                "score": 1.0  # TODO: Implement proper scoring
                            })
                            
                            if len(results) >= limit:
                                return results
                    except:
                        continue
                        
            return results
            
        except Exception as e:
            print(f"Error searching memories: {e}")
            return []
    
    async def get_user_conversations(
        self,
        user_id: str,
        limit: int = 20
    ) -> List[Dict]:
        """Get list of user's recent conversations"""
        try:
            redis_client = await self._get_redis()
            index_key = f"user_convs:{user_id}"
            
            # Get recent conversation IDs
            conv_ids = await redis_client.zrevrange(
                index_key, 0, limit - 1, withscores=True
            )
            
            conversations = []
            for conv_id, timestamp in conv_ids:
                # Get last message for preview
                key = f"conv:{user_id}:{conv_id}"
                last_msg = await redis_client.lindex(key, -1)
                
                # Get metadata (title) if it exists
                meta_key = f"conv:meta:{user_id}:{conv_id}"
                title = await redis_client.hget(meta_key, "title")
                
                if last_msg:
                    try:
                        msg = json.loads(last_msg)
                        
                        # Use generated title if available, otherwise use last message preview
                        conv_title = title if title else None
                        if not conv_title:
                            # Fallback to last message preview
                            last_content = msg.get("content", "New Conversation")
                            conv_title = last_content[:50] + ("..." if len(last_content) > 50 else "")
                        
                        conversations.append({
                            "id": conv_id,
                            "title": conv_title,
                            "last_message": msg.get("content", "")[:100],
                            "timestamp": datetime.fromtimestamp(timestamp).isoformat(),
                            "role": msg.get("role", "unknown")
                        })
                    except:
                        continue
                        
            return conversations
            
        except Exception as e:
            print(f"Error getting conversations: {e}")
            return []
    
    async def clear_conversation(
        self,
        conversation_id: str,
        user_id: str
    ):
        """Clear a specific conversation from memory"""
        try:
            redis_client = await self._get_redis()
            
            # Delete conversation
            key = f"conv:{user_id}:{conversation_id}"
            await redis_client.delete(key)
            
            # Remove from index
            index_key = f"user_convs:{user_id}"
            await redis_client.zrem(index_key, conversation_id)
            
        except Exception as e:
            print(f"Error clearing conversation: {e}")
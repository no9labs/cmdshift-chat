import asyncio
import sys
sys.path.append('../api')
from app.services.memory import MemoryManager

async def test():
    mm = MemoryManager()
    messages = await mm.get_context(
        conversation_id="conv_1754125860971_bgybhbgq6",
        user_id="692a4738-5530-4627-8950-04d40d9b7d7e",
        max_messages=50
    )
    print(f"Found {len(messages)} messages")
    for msg in messages:
        print(f"- {msg['role']}: {msg['content'][:50]}...")

asyncio.run(test())

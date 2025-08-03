from fastapi import APIRouter, HTTPException, Request, Query
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import redis.asyncio as redis
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Model pricing per million tokens
MODEL_PRICING = {
    "deepseek-chat": {"input": 0.14, "output": 0.28},  # $0.14/$0.28 per million
    "deepseek-coder": {"input": 0.14, "output": 0.28},
    "glm-4-plus": {"input": 0.05, "output": 0.05},     # $0.05/$0.05 per million
    "glm-4-flash": {"input": 0.0001, "output": 0.0001}, # $0.0001/$0.0001 per million
    "qwen3-235b-a22b": {"input": 2.80, "output": 2.80}, # $2.80/$2.80 per million
}

class ModelUsage(BaseModel):
    tokens: int
    cost: float
    percentage: float

class DailyUsage(BaseModel):
    date: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    total_cost: float
    messages: int
    model_usage: Optional[Dict[str, int]] = {}

class MonthlyTotal(BaseModel):
    total_tokens: int
    input_tokens: int
    output_tokens: int
    total_cost: float
    total_messages: int

class UsageStats(BaseModel):
    daily: List[DailyUsage]
    monthly_total: MonthlyTotal
    model_breakdown: Dict[str, ModelUsage]
    total_tokens: int
    total_cost: float
    total_messages: int
    period_start: str
    period_end: str

async def get_redis_client(request: Request) -> redis.Redis:
    """Get Redis client from request"""
    return request.app.state.redis

async def calculate_cost(tokens: int, model: str, token_type: str = "output") -> float:
    """Calculate cost based on tokens and model"""
    # Extract base model name (e.g., "deepseek-chat" from any variant)
    base_model = model.split("-")[0] + "-" + model.split("-")[1] if "-" in model else model
    
    # Find pricing - check exact match first, then try to find partial match
    pricing = MODEL_PRICING.get(model)
    if not pricing:
        # Try to find a model that starts with the base name
        for model_key, model_pricing in MODEL_PRICING.items():
            if model_key.startswith(base_model):
                pricing = model_pricing
                break
    
    if not pricing:
        # Default to average pricing if model not found
        pricing = {"input": 0.5, "output": 0.5}
    
    # Calculate cost (price per million tokens)
    price_per_token = pricing[token_type] / 1_000_000
    return tokens * price_per_token

@router.get("/usage", response_model=UsageStats)
async def get_usage_stats(
    request: Request,
    user_id: Optional[str] = Query(None, description="User ID to get usage for"),
    days: int = Query(30, description="Number of days to retrieve", ge=1, le=365)
):
    """Get usage statistics for a user"""
    redis_client = await get_redis_client(request)
    
    # Use provided user_id or default to "anonymous" for demo
    target_user = user_id or "anonymous"
    
    try:
        # Use local timezone to match other services
        end_date = datetime.now()
        today = datetime.now().date()
        print(f"DEBUG: Usage API using date: {today}")
        start_date = end_date - timedelta(days=days)
        
        daily_stats = []
        total_input_tokens = 0
        total_output_tokens = 0
        total_cost = 0.0
        total_messages = 0
        model_totals = {}  # Track totals by model
        
        # Iterate through each day
        current_date = start_date
        while current_date <= end_date:
            date_key = current_date.strftime("%Y-%m-%d")
            usage_key = f"usage:{target_user}:{date_key}"
            
            # Get usage data from Redis
            usage_data = await redis_client.hgetall(usage_key)
            
            # Get message count for this day
            messages_key = f"usage:{target_user}:{date_key}:messages"
            daily_messages = await redis_client.get(messages_key)
            daily_messages = int(daily_messages) if daily_messages else 0
            
            if usage_data or daily_messages > 0:
                input_tokens = int(usage_data.get("input_tokens", 0)) if usage_data else 0
                output_tokens = int(usage_data.get("output_tokens", 0)) if usage_data else 0
                total_tokens = int(usage_data.get("total_tokens", 0)) if usage_data else 0
                
                # Extract model-specific usage
                day_model_usage = {}
                if usage_data:
                    for field, value in usage_data.items():
                        if field.startswith("model:") and field.endswith(":tokens"):
                            model_name = field.split(":")[1]
                            tokens = int(value)
                            
                            # Add to daily model usage
                            day_model_usage[model_name] = tokens
                            
                            # Add to model totals
                            if model_name not in model_totals:
                                model_totals[model_name] = 0
                            model_totals[model_name] += tokens
                
                # Calculate cost based on model usage
                daily_total_cost = 0.0
                if day_model_usage:
                    # Use actual model usage for cost calculation
                    for model, tokens in day_model_usage.items():
                        # Use average of input/output pricing for simplicity
                        model_pricing = MODEL_PRICING.get(model, {"input": 0.5, "output": 0.5})
                        avg_price = (model_pricing["input"] + model_pricing["output"]) / 2
                        cost = (tokens / 1_000_000) * avg_price
                        daily_total_cost += cost
                else:
                    # Fallback to average pricing if no model data
                    avg_input_cost = sum(p["input"] for p in MODEL_PRICING.values()) / len(MODEL_PRICING)
                    avg_output_cost = sum(p["output"] for p in MODEL_PRICING.values()) / len(MODEL_PRICING)
                    input_cost = (input_tokens / 1_000_000) * avg_input_cost
                    output_cost = (output_tokens / 1_000_000) * avg_output_cost
                    daily_total_cost = input_cost + output_cost
                
                # Add to totals
                total_input_tokens += input_tokens
                total_output_tokens += output_tokens
                total_cost += daily_total_cost
                total_messages += daily_messages
                
                daily_stats.append(DailyUsage(
                    date=date_key,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    total_tokens=total_tokens,
                    total_cost=round(daily_total_cost, 4),
                    messages=daily_messages,
                    model_usage=day_model_usage
                ))
            else:
                # Include days with zero usage for complete daily data
                daily_stats.append(DailyUsage(
                    date=date_key,
                    input_tokens=0,
                    output_tokens=0,
                    total_tokens=0,
                    total_cost=0.0,
                    messages=0,
                    model_usage={}
                ))
            
            current_date += timedelta(days=1)
        
        # Calculate monthly total
        monthly_total = MonthlyTotal(
            input_tokens=total_input_tokens,
            output_tokens=total_output_tokens,
            total_tokens=total_input_tokens + total_output_tokens,
            total_cost=round(total_cost, 4),
            total_messages=total_messages
        )
        
        # Calculate model breakdown with costs and percentages
        model_breakdown = {}
        total_tokens_all = total_input_tokens + total_output_tokens
        for model, tokens in model_totals.items():
            model_pricing = MODEL_PRICING.get(model, {"input": 0.5, "output": 0.5})
            avg_price = (model_pricing["input"] + model_pricing["output"]) / 2
            cost = (tokens / 1_000_000) * avg_price
            percentage = (tokens / total_tokens_all * 100) if total_tokens_all > 0 else 0
            
            model_breakdown[model] = ModelUsage(
                tokens=tokens,
                cost=round(cost, 4),
                percentage=round(percentage, 2)
            )
        
        return UsageStats(
            daily=daily_stats,
            monthly_total=monthly_total,
            total_tokens=total_input_tokens + total_output_tokens,
            total_cost=round(total_cost, 4),
            total_messages=total_messages,
            period_start=start_date.strftime("%Y-%m-%d"),
            period_end=end_date.strftime("%Y-%m-%d"),
            model_breakdown=model_breakdown
        )
        
    except Exception as e:
        logger.error(f"Error retrieving usage stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve usage statistics")

@router.get("/usage/models")
async def get_model_pricing():
    """Get current model pricing information"""
    return {
        "pricing": MODEL_PRICING,
        "currency": "USD",
        "unit": "per_million_tokens",
        "last_updated": "2024-01-01"
    }

@router.delete("/usage/{user_id}")
async def clear_usage_data(
    request: Request,
    user_id: str,
    confirm: bool = Query(False, description="Confirm deletion")
):
    """Clear usage data for a specific user (admin only)"""
    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Please set confirm=true to delete usage data"
        )
    
    redis_client = await get_redis_client(request)
    
    try:
        # Find all usage keys for the user
        pattern = f"usage:{user_id}:*"
        keys = []
        async for key in redis_client.scan_iter(match=pattern):
            keys.append(key)
        
        # Delete all found keys
        if keys:
            await redis_client.delete(*keys)
        
        return {
            "status": "success",
            "deleted_keys": len(keys),
            "message": f"Deleted {len(keys)} usage records for user {user_id}"
        }
        
    except Exception as e:
        logger.error(f"Error clearing usage data: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear usage data")
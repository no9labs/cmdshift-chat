from typing import Dict, List, Optional
from enum import Enum
import json
import time
import os
from app.core.config import settings
import redis.asyncio as redis

class ModelType(Enum):
    DEEPSEEK_V3 = "deepseek-chat"
    GLM_45 = "glm-4.5"
    QWEN_25 = "qwen3-235b-a22b"

class TaskType(Enum):
    CODE = "code"
    GENERAL = "general"
    MATH = "math"
    CREATIVE = "creative"
    TECHNICAL = "technical"
    MULTILINGUAL = "multilingual"

class ModelRouter:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.models = {
            ModelType.DEEPSEEK_V3: {
                "cost": 0.5,  # Relative cost factor
                "specialties": [TaskType.CODE, TaskType.MATH, TaskType.TECHNICAL],
                "context_window": 128000,
                "latency": "medium",
                "api_key": settings.DEEPSEEK_API_KEY,
                "endpoint": "https://api.deepseek.com/v1/chat/completions"
            },
            ModelType.GLM_45: {
                "cost": 0.4,
                "specialties": [TaskType.GENERAL, TaskType.TECHNICAL],
                "context_window": 128000,
                "latency": "low",
                "api_key": settings.GLM_API_KEY,
                "endpoint": "https://open.bigmodel.cn/api/paas/v4/chat/completions"
            },
            ModelType.QWEN_25: {
                "name": "Qwen3-235B-A22B",
                "provider": "qwen",
                "cost": 0.38,  # Update if you know the actual cost
                "specialties": [TaskType.GENERAL, TaskType.MULTILINGUAL],
                "api_key": os.getenv("QWEN_API_KEY"),
                "context_window": 32000
            }
        }
        
    async def analyze_task_type(self, query: str) -> TaskType:
        """Analyze query to determine task type"""
        query_lower = query.lower()
        
        # Code indicators
        code_keywords = ['code', 'function', 'debug', 'error', 'implement', 'python', 'javascript', 'class', 'method']
        if any(keyword in query_lower for keyword in code_keywords):
            return TaskType.CODE
            
        # Math indicators
        math_keywords = ['calculate', 'solve', 'equation', 'math', 'formula', 'derivative', 'integral']
        if any(keyword in query_lower for keyword in math_keywords):
            return TaskType.MATH
            
        # Technical indicators
        tech_keywords = ['technical', 'architecture', 'system', 'database', 'api', 'infrastructure']
        if any(keyword in query_lower for keyword in tech_keywords):
            return TaskType.TECHNICAL
            
        # Creative indicators
        creative_keywords = ['write', 'story', 'creative', 'poem', 'essay', 'narrative']
        if any(keyword in query_lower for keyword in creative_keywords):
            return TaskType.CREATIVE
            
        # Multilingual check (simple detection)
        non_ascii = len([c for c in query if ord(c) > 127])
        if non_ascii > len(query) * 0.1:  # More than 10% non-ASCII
            return TaskType.MULTILINGUAL
            
        return TaskType.GENERAL
    
    async def select_model(
        self,
        query: str,
        user_preference: Optional[str] = None,
        context_length: int = 0
    ) -> tuple[ModelType, str]:
        """Select optimal model based on query analysis"""
        
        
        # Check if user has a preference
        if user_preference and user_preference != "auto":
            for model_type in ModelType:
                if model_type.value == user_preference:
                    # Verify API key exists for preferred model and is not a placeholder
                    api_key = self.models[model_type]["api_key"]
                    if api_key and not api_key.startswith("your-"):
                        return model_type, "user_preference"
                    else:
                        # User preference unavailable, fall through to auto selection
                        break
        
        # Analyze task type
        task_type = await self.analyze_task_type(query)
        
        # Filter models by context window requirement AND API key availability
        available_models = {
            model: config for model, config in self.models.items()
            if config["context_window"] >= context_length 
            and config["api_key"] is not None 
            and not config["api_key"].startswith("your-")  # Filter out placeholder keys
        }
        
        
        if not available_models:
            # Try to find ANY model with an API key
            models_with_keys = {
                model: config for model, config in self.models.items()
                if config["api_key"] is not None and not config["api_key"].startswith("your-")
            }
            
            if models_with_keys:
                # Use the first available model with an API key
                fallback_model = list(models_with_keys.keys())[0]
                return fallback_model, "api_key_fallback"
            else:
                # No models have API keys configured
                raise ValueError("No models have API keys configured. Please add at least one API key to your .env file.")
        
        # Score models based on task match and cost
        scores = {}
        for model, config in available_models.items():
            score = 0
            
            # Task specialization score (0-50 points)
            if task_type in config["specialties"]:
                score += 50
            else:
                score += 20  # Base score for general capability
                
            # Cost efficiency score (0-30 points)
            cost_score = (1 / config["cost"]) * 10
            score += min(cost_score, 30)
            
            # Latency score (0-20 points)
            latency_scores = {"low": 20, "medium": 10, "high": 5}
            score += latency_scores.get(config["latency"], 10)
            
            scores[model] = score
        
        # Select highest scoring model
        best_model = max(scores.items(), key=lambda x: x[1])[0]
        
        
        # Cache the routing decision for analytics
        await self._cache_routing_decision(query, task_type, best_model, scores)
        
        return best_model, f"task_match_{task_type.value}"
    
    async def _cache_routing_decision(
        self,
        query: str,
        task_type: TaskType,
        selected_model: ModelType,
        scores: Dict[ModelType, float]
    ):
        """Cache routing decision for analytics"""
        decision = {
            "query_preview": query[:100],
            "task_type": task_type.value,
            "selected_model": selected_model.value,
            "scores": {model.value: score for model, score in scores.items()},
            "timestamp": int(time.time())
        }
        
        # Store in Redis with 7-day expiry
        key = f"routing_decision:{int(time.time() * 1000)}"
        await self.redis.setex(key, 7 * 24 * 3600, json.dumps(decision))
    
    async def get_fallback_model(self, failed_model: ModelType) -> Optional[ModelType]:
        """Get fallback model when primary fails"""
        # Return the next cheapest available model
        sorted_models = sorted(
            self.models.items(),
            key=lambda x: x[1]["cost"]
        )
        
        for model, _ in sorted_models:
            if model != failed_model:
                return model
                
        return None
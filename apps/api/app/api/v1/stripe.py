from fastapi import APIRouter, HTTPException, Request, Header
from typing import Optional, Literal
from pydantic import BaseModel
import stripe
import json
from app.core.config import settings
from app.core.database import get_supabase_client
import logging

logger = logging.getLogger(__name__)

class SubscribeRequest(BaseModel):
    tier: Literal["starter", "pro"]
    user_id: str
    user_email: str

router = APIRouter()

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

PRICE_IDS = {
    "starter": settings.STRIPE_PRICE_STARTER,
    "pro": settings.STRIPE_PRICE_PRO
}

@router.post("/subscribe")
async def create_checkout_session(request: SubscribeRequest):
    """Create a Stripe checkout session for subscription upgrade"""
    try:
        price_id = PRICE_IDS.get(request.tier)
        if not price_id:
            raise HTTPException(status_code=400, detail="Invalid subscription tier")
        
        # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price": price_id,
                "quantity": 1,
            }],
            mode="subscription",
            success_url=f"http://localhost:3000/profile?upgrade=success",
            cancel_url=f"http://localhost:3000/profile?upgrade=cancelled",
            customer_email=request.user_email,
            metadata={
                "user_id": request.user_id,
                "tier": request.tier.upper()
            }
        )
        
        logger.info(f"Created checkout session for user {request.user_id}, tier: {request.tier}")
        
        return {
            "checkout_url": session.url,
            "session_id": session.id
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None)
):
    """Handle Stripe webhook events"""
    payload = await request.body()
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET
    
    if not webhook_secret or webhook_secret == "whsec_PLACEHOLDER_WILL_ADD_LATER":
        # Development mode - skip signature verification
        logger.warning("Webhook secret not configured, skipping signature verification")
        event = stripe.Event.construct_from(
            json.loads(payload.decode()),
            stripe.api_key
        )
    else:
        # Production - verify signature
        try:
            event = stripe.Webhook.construct_event(
                payload, stripe_signature, webhook_secret
            )
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid webhook signature")
            raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        
        # Handle test events that might not have metadata
        metadata = session.get("metadata", {})
        user_id = metadata.get("user_id")
        tier = metadata.get("tier")
        
        if not user_id or not tier:
            logger.warning(f"Checkout completed but missing metadata: {metadata}")
            return {"status": "skipped", "reason": "missing metadata"}
        
        stripe_customer_id = session["customer"]
        stripe_subscription_id = session["subscription"]
        
        # Update database
        try:
            supabase = get_supabase_client()
            result = supabase.table('user_profiles').update({
                'subscription_tier': tier,
                'stripe_customer_id': stripe_customer_id,
                'stripe_subscription_id': stripe_subscription_id
            }).eq('id', user_id).execute()
                
            logger.info(f"Updated user {user_id} to tier {tier}")
            
        except Exception as e:
            logger.error(f"Failed to update user subscription: {str(e)}")
            # Don't raise - Stripe will retry
    
    elif event["type"] == "customer.subscription.deleted":
        # Handle subscription cancellation
        subscription = event["data"]["object"]
        stripe_subscription_id = subscription["id"]
        
        try:
            supabase = get_supabase_client()
            result = supabase.table('user_profiles').update({
                'subscription_tier': 'FREE'
            }).eq('stripe_subscription_id', stripe_subscription_id).execute()
                
            logger.info(f"Downgraded subscription {stripe_subscription_id} to FREE")
            
        except Exception as e:
            logger.error(f"Failed to downgrade subscription: {str(e)}")
    
    return {"status": "success"}
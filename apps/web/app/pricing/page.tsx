'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TIER_INFO, SubscriptionTier } from '@/lib/types/subscription';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  
  const tiers = [
    TIER_INFO[SubscriptionTier.FREE],
    TIER_INFO[SubscriptionTier.STARTER],
    TIER_INFO[SubscriptionTier.PRO],
    TIER_INFO[SubscriptionTier.BUSINESS],
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start with our free tier and upgrade as you grow
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-1 text-green-600 text-xs">Save 20%</span>
            </button>
          </div>
        </div>
        
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier) => {
            const yearlyPrice = tier.price * 12 * 0.8; // 20% discount
            const displayPrice = billingPeriod === 'monthly' ? tier.price : yearlyPrice / 12;
            const isPopular = tier.tier === SubscriptionTier.PRO;
            
            return (
              <div
                key={tier.tier}
                className={`relative bg-white rounded-lg shadow-lg overflow-hidden ${
                  isPopular ? 'ring-2 ring-blue-600' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    MOST POPULAR
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-gray-600 mb-6 min-h-[48px]">
                    {tier.description}
                  </p>
                  
                  <div className="mb-6">
                    {tier.price === 0 ? (
                      <div className="text-4xl font-bold text-gray-900">Free</div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-gray-900">
                          ${displayPrice.toFixed(2)}
                        </div>
                        <div className="text-gray-600">
                          per month
                          {billingPeriod === 'yearly' && (
                            <span className="text-sm text-green-600 ml-2">
                              (billed annually)
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <Link
                    href={tier.price === 0 ? '/signup' : `/checkout?tier=${tier.tier}&period=${billingPeriod}`}
                    className={`block w-full text-center py-3 px-6 rounded-lg font-medium transition-colors ${
                      isPopular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {tier.price === 0 ? 'Get Started' : 'Subscribe'}
                  </Link>
                </div>
                
                <div className="px-6 pb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">
                    What&apos;s included:
                  </h4>
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change plans at any time?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we&apos;ll prorate any charges.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens if I exceed my message limit?
              </h3>
              <p className="text-gray-600">
                You&apos;ll be prompted to upgrade your plan. Your conversation history remains accessible, but you won&apos;t be able to send new messages until the next billing period or after upgrading.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 7-day money-back guarantee for all paid plans. If you&apos;re not satisfied, contact our support team for a full refund.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Is my data secure?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use industry-standard encryption and never train our models on your data. Your conversations are private and secure.
              </p>
            </div>
          </div>
        </div>
        
        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'

export default function PricingPage() {
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const plans = [
    {
      name: 'Free',
      description: 'Get started with basic AI chat capabilities',
      price: 'Free',
      priceMonthly: 0,
      priceYearly: 0,
      popular: false,
      features: [
        '50 messages per day',
        'Access to all AI models',
        'Basic chat history',
        'Usage analytics'
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outline' as const
    },
    {
      name: 'Starter',
      description: 'Perfect for individuals and light users',
      price: '$9.99',
      priceMonthly: 9.99,
      priceYearly: 99.99,
      popular: false,
      features: [
        '2,000 messages per month',
        'Access to all AI models',
        'Full chat history',
        'Advanced usage analytics',
        'Export conversations'
      ],
      buttonText: 'Subscribe',
      buttonVariant: 'outline' as const
    },
    {
      name: 'Pro',
      description: 'Unlimited AI conversations for power users',
      price: '$19.99',
      priceMonthly: 19.99,
      priceYearly: 199.99,
      popular: true,
      features: [
        'Unlimited messages',
        'Access to all AI models',
        'Priority response times',
        'API access',
        'Priority support',
        'Custom prompts library'
      ],
      buttonText: 'Subscribe',
      buttonVariant: 'default' as const
    },
    {
      name: 'Business',
      description: 'Advanced features for teams and businesses',
      price: '$49.99',
      priceMonthly: 49.99,
      priceYearly: 499.99,
      popular: false,
      features: [
        'Everything in Pro',
        'Team collaboration (up to 10 members)',
        'Custom AI models',
        'SSO integration',
        'Dedicated support',
        'Usage analytics dashboard',
        'Compliance features'
      ],
      buttonText: 'Subscribe',
      buttonVariant: 'outline' as const
    }
  ]

  const faqs = [
    {
      question: 'Can I change plans at any time?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we\'ll prorate any charges.'
    },
    {
      question: 'What happens if I exceed my message limit?',
      answer: 'For Free and Starter plans, you\'ll be notified when approaching your limit. You can upgrade to continue using the service or wait for the next period.'
    },
    {
      question: 'Do you offer educational or non-profit discounts?',
      answer: 'Yes, we offer special pricing for educational institutions and registered non-profits. Contact our support team for more information.'
    },
    {
      question: 'Is there a free trial for paid plans?',
      answer: 'New users can try Pro features free for 7 days. No credit card required to start your trial.'
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Absolutely. You can cancel your subscription at any time from your account settings. You\'ll continue to have access until the end of your billing period.'
    }
  ]

  const handleSubscribe = (planName: string) => {
    if (planName === 'Free') {
      router.push('/signup')
    } else {
      // Redirect to Stripe checkout or subscription flow
      router.push(`/subscribe?plan=${planName.toLowerCase()}&period=${billingPeriod}`)
    }
  }

  const containerStyle = {
    minHeight: '100vh',
    padding: '64px 16px',
    backgroundColor: '#fafafa'
  };

  const maxWidthStyle = {
    maxWidth: '1280px',
    margin: '0 auto'
  };

  const headerStyle = {
    textAlign: 'center' as const,
    marginBottom: '48px'
  };

  const titleStyle = {
    fontSize: '36px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#111'
  };

  const subtitleStyle = {
    fontSize: '18px',
    color: '#666',
    marginBottom: '32px'
  };

  const billingToggleStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px',
    backgroundColor: '#f3f4f6',
    borderRadius: '9999px',
    border: '1px solid #e5e7eb'
  };

  const toggleButtonStyle = (active: boolean) => ({
    padding: '6px 12px',
    borderRadius: '9999px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: active ? 'white' : 'transparent',
    color: active ? '#111' : '#666',
    boxShadow: active ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
  });

  const saveBadgeStyle = {
    marginLeft: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 6px',
    borderRadius: '9999px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    fontSize: '12px',
    fontWeight: '500'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '64px'
  };

  const cardStyle = (popular: boolean) => ({
    position: 'relative' as const,
    backgroundColor: 'white',
    borderRadius: '8px',
    border: popular ? '2px solid #3b82f6' : '1px solid #e5e7eb',
    boxShadow: popular ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    transition: 'transform 0.2s, box-shadow 0.2s',
    transform: popular ? 'scale(1.05)' : 'scale(1)',
    marginTop: popular ? '-16px' : '0'
  });

  const popularBadgeStyle = {
    position: 'absolute' as const,
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  const planNameStyle = {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px'
  };

  const planDescriptionStyle = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px'
  };

  const priceStyle = {
    fontSize: '30px',
    fontWeight: '600',
    marginBottom: '4px'
  };

  const pricePeriodStyle = {
    fontSize: '14px',
    color: '#666'
  };

  const featureListStyle = {
    listStyle: 'none',
    padding: '0',
    margin: '24px 0',
    flex: '1'
  };

  const featureItemStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '12px',
    fontSize: '14px',
    color: '#4b5563'
  };

  const buttonStyle = (variant: string) => ({
    width: '100%',
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: variant === 'default' ? 'none' : '1px solid #d1d5db',
    backgroundColor: variant === 'default' ? '#3b82f6' : 'white',
    color: variant === 'default' ? 'white' : '#374151'
  });

  const faqSectionStyle = {
    maxWidth: '768px',
    margin: '0 auto'
  };

  const faqTitleStyle = {
    fontSize: '24px',
    fontWeight: '600',
    textAlign: 'center' as const,
    marginBottom: '32px'
  };

  const faqItemStyle = {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '8px',
    overflow: 'hidden'
  };

  const faqQuestionStyle = {
    width: '100%',
    padding: '16px',
    backgroundColor: 'transparent',
    border: 'none',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const faqAnswerStyle = {
    padding: '0 16px 16px',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6'
  };

  const ctaSectionStyle = {
    textAlign: 'center' as const,
    marginTop: '64px'
  };

  const ctaTextStyle = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '16px'
  };

  const ctaButtonStyle = {
    display: 'inline-block',
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#374151',
    textDecoration: 'none',
    transition: 'all 0.2s'
  };

  return (
    <div style={containerStyle}>
      <div style={maxWidthStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>Choose Your Plan</h1>
          <p style={subtitleStyle}>
            Start with our free tier and upgrade as you grow
          </p>
          
          {/* Billing Toggle */}
          <div style={billingToggleStyle}>
            <button
              onClick={() => setBillingPeriod('monthly')}
              style={toggleButtonStyle(billingPeriod === 'monthly')}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              style={toggleButtonStyle(billingPeriod === 'yearly')}
            >
              Yearly
              {billingPeriod === 'yearly' && (
                <span style={saveBadgeStyle}>Save 20%</span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={gridStyle}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={cardStyle(plan.popular)}
              onMouseEnter={(e) => {
                if (!plan.popular) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!plan.popular) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              {plan.popular && (
                <div style={popularBadgeStyle}>
                  <Sparkles size={12} />
                  Most Popular
                </div>
              )}
              
              <h3 style={planNameStyle}>{plan.name}</h3>
              <p style={planDescriptionStyle}>{plan.description}</p>
              
              <div>
                <div style={priceStyle}>
                  {plan.priceMonthly === 0 ? 'Free' : 
                   billingPeriod === 'monthly' ? `$${plan.priceMonthly}` : `$${(plan.priceYearly / 12).toFixed(2)}`}
                </div>
                {plan.priceMonthly > 0 && (
                  <div style={pricePeriodStyle}>per month</div>
                )}
                {billingPeriod === 'yearly' && plan.priceYearly > 0 && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Billed ${plan.priceYearly} annually
                  </div>
                )}
              </div>
              
              <ul style={featureListStyle}>
                {plan.features.map((feature, index) => (
                  <li key={index} style={featureItemStyle}>
                    <Check size={16} color="#10b981" style={{ flexShrink: 0 }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                style={buttonStyle(plan.buttonVariant)}
                onClick={() => handleSubscribe(plan.name)}
                onMouseEnter={(e) => {
                  if (plan.buttonVariant === 'default') {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                  } else {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (plan.buttonVariant === 'default') {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                  } else {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div style={faqSectionStyle}>
          <h2 style={faqTitleStyle}>Frequently Asked Questions</h2>
          <div>
            {faqs.map((faq, index) => (
              <div key={index} style={faqItemStyle}>
                <button
                  style={faqQuestionStyle}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span>{faq.question}</span>
                  <span style={{ fontSize: '18px' }}>{openFaq === index ? '−' : '+'}</span>
                </button>
                {openFaq === index && (
                  <div style={faqAnswerStyle}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={ctaSectionStyle}>
          <p style={ctaTextStyle}>
            Need a custom plan for your organization?
          </p>
          <Link href="/contact" style={ctaButtonStyle}>
            Contact Sales
          </Link>
        </div>
      </div>
    </div>
  )
}
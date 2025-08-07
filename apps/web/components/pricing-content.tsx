"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ThemeToggle } from "@/components/theme-toggle"
import { Check, Crown, MessageSquare, Shield, Users, Headphones, Globe, Star, Sparkles } from "lucide-react"

// Pricing data
const pricingPlans = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: MessageSquare,
    features: ["100 messages per month", "Basic AI models", "Standard support", "Web access only", "Basic templates"],
    limitations: ["Limited conversation history", "No priority support", "Basic features only"],
    buttonText: "Get Started",
    buttonVariant: "outline" as const,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Most popular for professionals",
    monthlyPrice: 20,
    yearlyPrice: 200,
    icon: Crown,
    popular: true,
    features: [
      "Unlimited messages",
      "All AI models (GPT-4, Claude, etc.)",
      "Priority support",
      "Mobile & web access",
      "Advanced templates",
      "Conversation export",
      "Custom instructions",
      "API access",
    ],
    buttonText: "Start Pro Trial",
    buttonVariant: "default" as const,
  },
  {
    id: "team",
    name: "Team",
    description: "Collaboration for small teams",
    monthlyPrice: 50,
    yearlyPrice: 500,
    icon: Users,
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Shared conversations",
      "Team analytics",
      "Admin controls",
      "SSO integration",
      "Custom branding",
      "Dedicated support",
    ],
    buttonText: "Start Team Trial",
    buttonVariant: "outline" as const,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Advanced features for large organizations",
    monthlyPrice: null,
    yearlyPrice: null,
    icon: Shield,
    features: [
      "Everything in Team",
      "Unlimited team members",
      "Advanced security",
      "Custom integrations",
      "On-premise deployment",
      "24/7 phone support",
      "Custom training",
      "SLA guarantee",
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
  },
]

const faqData = [
  {
    question: "What's included in the free plan?",
    answer:
      "The free plan includes 100 messages per month, access to basic AI models, standard support, and web access. It's perfect for trying out CmdShift and light usage.",
  },
  {
    question: "Can I change my plan at any time?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments.",
  },
  {
    question: "What AI models do you support?",
    answer:
      "We support all major AI models including GPT-4, GPT-3.5, Claude, and more. Pro and higher plans get access to all models, while free users have access to basic models.",
  },
  {
    question: "Is there a free trial for paid plans?",
    answer: "Yes! Pro and Team plans come with a 14-day free trial. No credit card required to start your trial.",
  },
  {
    question: "How does billing work?",
    answer:
      "You can choose monthly or yearly billing. Yearly plans save you 2 months (17% discount). All plans are billed in advance and you can cancel anytime.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Yes, we offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact us for a full refund.",
  },
  {
    question: "Can I use CmdShift for commercial purposes?",
    answer:
      "Yes, all our plans allow commercial use. For large-scale commercial deployments, we recommend our Enterprise plan with additional compliance features.",
  },
  {
    question: "What kind of support do you provide?",
    answer:
      "Free users get community support, Pro users get email support, Team users get priority support, and Enterprise users get 24/7 phone support with dedicated account management.",
  },
]

export function PricingContent() {
  const [isYearly, setIsYearly] = useState(false)

  const getPrice = (plan: (typeof pricingPlans)[0]) => {
    if (plan.monthlyPrice === null) return "Custom"
    if (plan.monthlyPrice === 0) return "Free"

    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
    return `$${price}`
  }

  const getPeriod = () => {
    return isYearly ? "/year" : "/month"
  }

  const getSavings = (plan: (typeof pricingPlans)[0]) => {
    if (!plan.monthlyPrice || plan.monthlyPrice === 0) return null
    const monthlyCost = plan.monthlyPrice * 12
    const yearlyCost = plan.yearlyPrice
    const savings = monthlyCost - yearlyCost
    return savings
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-gray-900 flex-shrink-0 text-center relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white mb-2">Choose Your Plan</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-8">
          Select the perfect plan for your needs. Upgrade or downgrade at any time.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-white dark:bg-zinc-950 rounded-full p-1 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              !isYearly
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 relative ${
              isYearly
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan) => {
              const IconComponent = plan.icon
              const savings = getSavings(plan)

              return (
                <Card
                  key={plan.id}
                  className={`relative bg-white dark:bg-zinc-950 border-2 shadow-sm transition-all duration-200 hover:shadow-md ${
                    plan.popular
                      ? "border-[#3A4D6F] ring-2 ring-[#3A4D6F]/20 hover:border-[#3A4D6F]/80 dark:hover:border-[#3A4D6F]/80"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-zinc-900 text-white hover:bg-zinc-900 px-3 py-1">
                        <Star className="size-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div
                        className={`p-3 rounded-full ${plan.popular ? "bg-zinc-900" : "bg-zinc-200 dark:bg-zinc-800"}`}
                      >
                        <IconComponent
                          className={`size-6 ${plan.popular ? "text-white" : "text-zinc-900 dark:text-gray-300"}`}
                        />
                      </div>
                    </div>
                    <CardTitle className="text-xl font-semibold text-zinc-900 dark:text-white">{plan.name}</CardTitle>
                    <CardDescription className="text-zinc-500 dark:text-zinc-400">{plan.description}</CardDescription>

                    <div className="mt-4">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold text-zinc-900 dark:text-white">{getPrice(plan)}</span>
                        {plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
                          <span className="text-zinc-500 dark:text-zinc-400">{getPeriod()}</span>
                        )}
                      </div>
                      {isYearly && savings && <p className="text-sm text-green-600 mt-1">Save ${savings}/year</p>}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <Button
                      className={`w-full ${
                        plan.buttonVariant === "default"
                          ? "bg-zinc-900 hover:bg-zinc-900/90 text-white"
                          : "border-zinc-200 dark:border-zinc-600 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 bg-transparent"
                      }`}
                      variant={plan.buttonVariant}
                    >
                      {plan.buttonText}
                    </Button>

                    <div className="space-y-3">
                      <h4 className="font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="size-4 text-zinc-900" />
                        Features included:
                      </h4>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Check className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-zinc-900 dark:text-white">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {plan.limitations && (
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                          <ul className="space-y-1">
                            {plan.limitations.map((limitation, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400"
                              >
                                <span className="text-zinc-500 dark:text-zinc-400 mt-0.5">•</span>
                                <span>{limitation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Additional Info */}
          <div className="text-center py-8 border-t border-zinc-200 dark:border-zinc-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-zinc-200 dark:bg-zinc-800 rounded-full">
                  <Shield className="size-6 text-zinc-900 dark:text-gray-300" />
                </div>
                <h3 className="font-medium text-zinc-900 dark:text-white">Secure & Private</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                  Your data is encrypted and never used to train AI models
                </p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-zinc-200 dark:bg-zinc-800 rounded-full">
                  <Headphones className="size-6 text-zinc-900 dark:text-gray-300" />
                </div>
                <h3 className="font-medium text-zinc-900 dark:text-white">24/7 Support</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                  Get help when you need it with our dedicated support team
                </p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-zinc-200 dark:bg-zinc-800 rounded-full">
                  <Globe className="size-6 text-zinc-900 dark:text-gray-300" />
                </div>
                <h3 className="font-medium text-zinc-900 dark:text-white">Global Access</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                  Access CmdShift from anywhere in the world, anytime
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">Frequently Asked Questions</h2>
              <p className="text-zinc-500 dark:text-zinc-400">
                Everything you need to know about our pricing and plans
              </p>
            </div>

            <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-[#3A4D6F]/20 dark:hover:border-[#3A4D6F]/30 transition-colors duration-200">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="space-y-2">
                  {faqData.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0"
                    >
                      <AccordionTrigger className="text-left font-medium text-zinc-900 dark:text-white hover:text-zinc-900 hover:no-underline py-4">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-zinc-500 dark:text-zinc-400 pb-4 leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center py-12 bg-gradient-to-r from-zinc-900/5 to-[#3A4D6F]/10 dark:from-zinc-900/10 dark:to-[#3A4D6F]/20 rounded-2xl">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">Ready to get started?</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-2xl mx-auto">
              Join thousands of professionals who trust CmdShift for their AI-powered conversations. Start your free
              trial today, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-zinc-900 hover:bg-zinc-900/90 text-white px-8">Start Free Trial</Button>
              <Button
                variant="outline"
                className="border-zinc-200 dark:border-zinc-600 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 bg-transparent px-8"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

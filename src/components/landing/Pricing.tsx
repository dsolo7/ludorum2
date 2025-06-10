import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

type PricingPeriod = 'monthly' | 'annual';

interface Plan {
  name: string;
  description: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  features: string[];
  cta: string;
  highlighted?: boolean;
  order?: number;
}

const Pricing: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<PricingPeriod>('monthly');

  const plans: Plan[] = [
    {
      name: 'Rookie',
      description: 'Start Smart with 20 Free Tokens',
      monthlyPrice: null,
      annualPrice: null,
      features: [
        '20 Tokens',
        'Basic statistical models',
        'Line movement alerts',
        'Mobile app access',
        'Community support',
        'Standard API access',
        'Basic analytics',
        'Single device'
      ],
      cta: 'Get Started',
      order: 1
    },
    {
      name: 'MVP Elite',
      description: 'Elite access. MVP results.',
      monthlyPrice: 99,
      annualPrice: 949,
      features: [
        billingPeriod === 'monthly' ? '6000 Tokens Per Month' : '6000 Tokens Per Month',
        'Enterprise statistical models',
        'Instant line movement alerts',
        'Custom AI models',
        'Unlimited API access',
        'Dedicated account manager',
        'Multi-device access',
        'White-label options'
      ],
      cta: 'Get Elite',
      highlighted: true,
      order: 2
    },
    {
      name: 'PRO Edge',
      description: 'Gain the edge. Play like a pro.',
      monthlyPrice: 39,
      annualPrice: 369,
      features: [
        billingPeriod === 'monthly' ? '2000 Tokens Per Month' : '2000 Tokens Per Month',
        'Advanced statistical models',
        'Real-time line movement alerts',
        'Custom betting strategies',
        'Priority API access',
        '24/7 priority support',
        'Mobile app access',
        'DFS lineup optimizer'
      ],
      cta: 'Get PRO Edge',
      order: 3
    }
  ];

  const getDiscount = (monthly: number, annual: number) => {
    return Math.round(100 - ((annual / (monthly * 12)) * 100));
  };

  return (
    <div id="pricing" className="py-16 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">Pricing</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Professional betting insights
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto">
            Unlock unlimited AI-powered betting analysis with Sports Genius
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="relative bg-white dark:bg-gray-800 p-1 rounded-lg inline-flex">
            <button
              type="button"
              className={`${
                billingPeriod === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              } relative py-2 px-6 border border-transparent rounded-md text-sm font-medium whitespace-nowrap`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly billing
            </button>
            <button
              type="button"
              className={`${
                billingPeriod === 'annual'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              } ml-2 relative py-2 px-6 border border-transparent rounded-md text-sm font-medium whitespace-nowrap`}
              onClick={() => setBillingPeriod('annual')}
            >
              Annual billing
              <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Save up to 20%
              </span>
            </button>
          </div>
        </div>

        <div className="mt-24 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {[...plans].sort((a, b) => (a.order || 0) - (b.order || 0)).map((plan) => (
            <div
              key={plan.name}
              className={`relative ${plan.highlighted ? 'lg:-mt-8' : ''} ${
                plan.order === 1 ? 'order-first lg:order-none' : ''
              }`}
            >
              <div
                className={`rounded-2xl shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden relative
                  ${plan.highlighted ? 'bg-white dark:bg-gray-800 transform lg:scale-110 z-10' : 'bg-white dark:bg-gray-800'}`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">{plan.description}</p>
                  <p className="mt-4">
                    {plan.monthlyPrice === null ? (
                      <span className="text-4xl font-extrabold text-gray-900 dark:text-white">Free</span>
                    ) : (
                      <>
                        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                          ${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                        </span>
                        <span className="text-base font-medium text-gray-500 dark:text-gray-400">
                          /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      </>
                    )}
                  </p>
                  {billingPeriod === 'annual' && plan.monthlyPrice && plan.annualPrice && (
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                      Save {getDiscount(plan.monthlyPrice, plan.annualPrice)}% with annual billing
                    </p>
                  )}
                  <Link
                    to="/signup"
                    className={`mt-6 block w-full py-3 px-6 border border-transparent rounded-xl text-center font-medium transition-colors ${
                      plan.highlighted
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900 dark:hover:bg-indigo-800 dark:text-indigo-300'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
                <div className="pt-6 pb-8 px-8">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">What's included</h4>
                  <ul className="space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className={`flex-shrink-0 h-5 w-5 ${
                          plan.highlighted ? 'text-indigo-500' : 'text-green-500'
                        }`} />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
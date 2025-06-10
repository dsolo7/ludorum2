import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type FAQItem = {
  question: string;
  answer: string;
};

const faqs: FAQItem[] = [
  {
    question: "How does Sports Genius AI analyze my betting slips?",
    answer: "Sports Genius AI uses advanced computer vision and machine learning models to extract information from your uploaded betting slip images. Our AI then processes this data against historical statistics, current matchups, and situational factors to provide you with insights and recommendations."
  },
  {
    question: "Which sports are currently supported?",
    answer: "We currently support NFL, NBA, MLB, NHL, and major soccer leagues. We're constantly adding support for more sports and betting types based on user demand and seasonal relevance."
  },
  {
    question: "How accurate is the AI analysis?",
    answer: "Our AI models are continuously trained and updated with the latest data and trends. While no prediction system is perfect, our analysis provides data-driven insights that go beyond human intuition. Many users report significant improvements in their betting success rates when using our platform."
  },
  {
    question: "Can I cancel my subscription at any time?",
    answer: "Yes, you can cancel your subscription at any time through your account settings. You'll continue to have access to the service until the end of your current billing period."
  },
  {
    question: "How do I upload my betting slips?",
    answer: "In your dashboard, simply click the 'Upload' button and select an image file from your device, or use our mobile app to take a photo directly. Our system accepts JPG, PNG, and PDF formats for betting slip uploads."
  },
  {
    question: "Is my betting data secure?",
    answer: "Absolutely. We use industry-standard encryption to protect all your data, and we never share your personal information or betting history with third parties. Your privacy and security are our top priorities."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 7-day money-back guarantee for new subscribers. If you're not satisfied with our service within your first week, contact our support team for a full refund of your subscription fee."
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">FAQ</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Frequently asked questions
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto">
            Everything you need to know about Sports Genius AI
          </p>
        </div>

        <div className="mt-12">
          <dl className="space-y-6 divide-y divide-gray-200 dark:divide-gray-700">
            {faqs.map((faq, index) => (
              <div key={index} className="pt-6">
                <dt className="text-lg">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="text-left w-full flex justify-between items-start text-gray-900 dark:text-white focus:outline-none"
                    aria-expanded={openIndex === index}
                  >
                    <span className="font-medium">{faq.question}</span>
                    <span className="ml-6 flex-shrink-0">
                      {openIndex === index ? (
                        <ChevronUp className="h-5 w-5 text-indigo-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-indigo-500" />
                      )}
                    </span>
                  </button>
                </dt>
                <dd
                  className={`mt-2 pr-12 transition-all duration-300 ease-in-out overflow-hidden ${
                    openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-base text-gray-600 dark:text-gray-400">{faq.answer}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-12 text-center">
          <p className="text-base text-gray-600 dark:text-gray-400">
            Can't find the answer you're looking for?{' '}
            <a
              href="#contact"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
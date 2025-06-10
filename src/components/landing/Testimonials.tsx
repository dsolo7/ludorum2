import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    content: "BetSmart AI has completely transformed my approach to sports betting. The AI analysis of player props has given me insights I would never have found on my own.",
    author: "Michael Johnson",
    title: "Fantasy Sports Enthusiast",
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300",
    rating: 5
  },
  {
    content: "The parlay evaluator saved me from making some terrible decisions. It's like having a professional handicapper in your pocket at all times.",
    author: "Sarah Williams",
    title: "Sports Bettor",
    image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300",
    rating: 5
  },
  {
    content: "As someone who loves betting on the NBA, the line movement tracker has been invaluable. I've caught so many value opportunities before they disappeared.",
    author: "David Chen",
    title: "NBA Betting Specialist",
    image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300",
    rating: 5
  }
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">Testimonials</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Hear from our users
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto">
            See how BetSmart AI has helped sports bettors make smarter decisions.
          </p>
        </div>
        
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden transform transition duration-500 hover:scale-105"
            >
              <div className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                  {[...Array(5 - testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-8 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img 
                    className="h-12 w-12 rounded-full object-cover"
                    src={testimonial.image}
                    alt={testimonial.author}
                  />
                  <div className="ml-4">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{testimonial.author}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{testimonial.title}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
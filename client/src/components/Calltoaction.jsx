import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CtaBackground from "../assets/calltoaction.jpg";

const testimonials = [
  {
    name: "Ms. Pallavi",
    designation: "HR Manager",
    industry: "Insurance",
    text: "The team understood our hiring needs in Life Insurance sales better than anyone. Within weeks, we had quality candidates lined up who were job-ready and aligned with our growth plans.",
  },
  {
    name: "Mr. Deepak",
    designation: "Manager - Talent Acquisition",
    industry: "Prop. Trading",
    text: "For our Equity Research desk, they provided talent with exactly the right skill set and analytical mindset. Saved us months of screening.",
  },
  {
    name: "Ms. Komal",
    designation: "HR Manager",
    industry: "Equity Broking",
    text: "Recruitment in stock broking is tough, but their network is solid. We closed multiple roles in record time thanks to their proactive approach.",
  },
  {
    name: "Mr. Devarsh",
    designation: "Sr. Executive - Ops",
    industry: "Insurance",
    text: "I was struggling to get into the Life Insurance sector, but they guided me, prepped me for the interview, and placed me in a top company.",
  },
  {
    name: "Mr. Vishwajeet",
    designation: "Equity Dealer",
    industry: "Equity Broking",
    text: "Thanks to them, I moved from a small broking house to a reputed equity stock broking firm. My career growth is finally on track.",
  },
  {
    name: "Mr. Jignesh",
    designation: "Sr. Technical Analyst",
    industry: "Equity Research",
    text: "The agency was supportive at every step – from resume building to interview prep. Now I’m working as an Equity Research Analyst, which was my dream role.",
  },
];

const CallToAction = () => {
  const [index, setIndex] = useState(0);

  // Auto rotate every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={CtaBackground}
          alt="Background"
          className="object-cover w-full h-full"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, rgba(26, 28, 103, 0.7), rgba(255, 0, 0, 0.7))",
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto">
        <div className="px-8 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20 rounded-3xl backdrop-blur-sm bg-white/5 border border-white/10 shadow-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-8">
            What People Say <br />
            <span className="text-red-400">About DE Employmint</span>
          </h2>

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
              className="text-white"
            >
              <p className="text-lg italic text-red-100 mb-6">
                “{testimonials[index].text}”
              </p>
              <h4 className="text-xl font-semibold text-white">
                {testimonials[index].name}
              </h4>
              <p className="text-sm text-red-200">
                {testimonials[index].designation} — {testimonials[index].industry}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dots Navigation */}
          <div className="flex justify-center mt-6 gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-3 h-3 rounded-full transition ${
                  i === index ? "bg-red-500" : "bg-white/40"
                }`}
              ></button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
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
    text: "The agency was supportive at every step – from resume building to interview prep. Now I'm working as an Equity Research Analyst, which was my dream role.",
  },
];

const Testimonial = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <section className="relative overflow-hidden mx-4 my-6 lg:mx-8 lg:my-10 rounded-3xl shadow-2xl">

        {/* Background image (original, no effect) */}
        <div className="absolute inset-0">
          <img
            src={CtaBackground}
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="px-8 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20 rounded-3xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-2xl text-center">

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl font-bold sm:text-5xl mb-8 text-black"
            >
              What People Say <br />
              About DE Employmint
            </motion.h2>

            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6 }}
                className="text-black"
              >
                <motion.p
                  className="text-lg italic mb-6 leading-relaxed text-black"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  "{testimonials[index].text}"
                </motion.p>

                <motion.h4
                  className="text-xl font-semibold mb-2 text-black"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {testimonials[index].name}
                </motion.h4>

                <motion.p
                  className="text-sm text-black"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {testimonials[index].designation} — {testimonials[index].industry}
                </motion.p>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <motion.div
              className="flex justify-center mt-8 gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {testimonials.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
                    i === index ? "bg-red-600 scale-125" : "bg-black/30 hover:bg-black/60"
                  }`}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default Testimonial;

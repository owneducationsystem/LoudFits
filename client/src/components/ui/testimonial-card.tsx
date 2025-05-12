import { Star, StarHalf } from "lucide-react";
import { motion } from "framer-motion";
import { Testimonial } from "@shared/schema";

interface TestimonialCardProps {
  testimonial: Testimonial;
  index: number;
}

const TestimonialCard = ({ testimonial, index }: TestimonialCardProps) => {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="fill-[#582A34] text-[#582A34]" size={16} />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="fill-[#582A34] text-[#582A34]" size={16} />);
    }

    return stars;
  };

  return (
    <motion.div 
      className="bg-white p-6 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ 
        duration: 0.5,
        delay: index * 0.1
      }}
    >
      <div className="flex items-center mb-4">
        <div className="text-[#582A34] flex">
          {renderStars(testimonial.rating)}
        </div>
      </div>
      <p className="mb-4 text-gray-700">"{testimonial.review}"</p>
      <div className="font-bold">{testimonial.name}</div>
    </motion.div>
  );
};

export default TestimonialCard;

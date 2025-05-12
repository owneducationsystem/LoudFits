import { motion } from "framer-motion";
import { Shirt, Palette, Truck, RotateCcw } from "lucide-react";

const UspSection = () => {
  const features = [
    {
      icon: <Shirt className="text-3xl mb-3 text-[#582A34]" size={30} />,
      title: "PREMIUM QUALITY",
      description: "100% cotton premium fabric",
    },
    {
      icon: <Palette className="text-3xl mb-3 text-[#582A34]" size={30} />,
      title: "CUSTOM DESIGNS",
      description: "Create your unique style",
    },
    {
      icon: <Truck className="text-3xl mb-3 text-[#582A34]" size={30} />,
      title: "FAST DELIVERY",
      description: "3-5 business days nationwide",
    },
    {
      icon: <RotateCcw className="text-3xl mb-3 text-[#582A34]" size={30} />,
      title: "EASY RETURNS",
      description: "30-day hassle-free returns",
    },
  ];

  return (
    <section className="py-12 px-4 bg-white">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.5,
                delay: index * 0.1
              }}
            >
              {feature.icon}
              <h3 className="font-bold text-sm sm:text-base">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UspSection;

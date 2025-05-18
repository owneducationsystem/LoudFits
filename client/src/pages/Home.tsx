import { useQuery } from "@tanstack/react-query";
import { Testimonial } from "@shared/schema";
import { Helmet } from "react-helmet";
import HeroCarousel from "@/components/ui/hero-carousel";
import FeaturedCategories from "@/components/ui/featured-categories";
import TrendingProducts from "@/components/ui/trending-products";
import UspSection from "@/components/ui/usp-section";
import FeaturedCollection from "@/components/ui/featured-collection";
import InstagramGrid from "@/components/ui/instagram-grid";
import NewsletterForm from "@/components/ui/newsletter-form";
import TestimonialCard from "@/components/ui/testimonial-card";

const Home = () => {
  const { data: testimonials, isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  // No fallback data - only use database data

  const instagramImages = [
    { 
      src: "https://pixabay.com/get/g36698be9a7dacb6ad6b811100129bc3ab1dcf1fd7f465231bbf63ba83f366adecf492bb27fa3192a95b6fd9796fb4d6735bedc4c0d2668e476ceb5b32bfb8f64_1280.jpg", 
      alt: "Instagram post - Person wearing Loudfits t-shirt" 
    },
    { 
      src: "https://pixabay.com/get/gbdb559dd326f3d59288c1579c599c899e4c05b3ac1487a41083916171bb132dea9e766ad0ddefe5d2c6e773453e64d46fe87d34ac5f30f50b80f385acfee4927_1280.jpg", 
      alt: "Instagram post - Close-up of t-shirt design" 
    },
    { 
      src: "https://pixabay.com/get/gd1d3ea4f76402f12076cc8f415413ebce56d3a3cf51d3b1010929cb3c9962a966218611a95c2eed480425d0c5d98be38e86733a3fd7d0c0ded8dc85bd237d8f0_1280.jpg", 
      alt: "Instagram post - Group of friends wearing Loudfits" 
    },
    { 
      src: "https://images.unsplash.com/photo-1516826957135-700dedea698c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400", 
      alt: "Instagram post - Stylish outfit with Loudfits t-shirt" 
    }
  ];

  return (
    <>
      <Helmet>
        <title>Loudfits - Make Noise With Your Style</title>
        <meta name="description" content="Loudfits offers bold, expressive t-shirts that help you stand out and make a statement. Shop our collection of printed and customizable tees." />
      </Helmet>
      
      <HeroCarousel 
        images={[
          {
            src: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080",
            alt: "Model wearing Loudfits t-shirt",
            title: "MAKE NOISE<br>WITH YOUR STYLE",
            subtitle: "Express yourself with our bold printed designs that speak volumes without saying a word.",
            link: "/shop",
            linkText: "SHOP NOW",
            secondaryLink: "/shop?category=printed-tees",
            secondaryLinkText: "PRINTED TEES"
          },
          {
            src: "https://images.unsplash.com/photo-1589465885857-44edb59bbff2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080",
            alt: "Urban fashion showcase",
            title: "NEW COLLECTION<br>JUST ARRIVED",
            subtitle: "Discover our latest designs that blend urban style with bold artistic expression.",
            link: "/shop?category=new-arrivals",
            linkText: "SHOP NEW ARRIVALS",
            secondaryLink: "/shop",
            secondaryLinkText: "VIEW ALL"
          },
          {
            src: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080",
            alt: "Graphic tees collection",
            title: "STATEMENT<br>GRAPHICS",
            subtitle: "Our graphic tees feature bold designs that make a statement about who you are.",
            link: "/shop?category=graphic-tees",
            linkText: "SHOP GRAPHIC TEES",
            secondaryLink: "/customize",
            secondaryLinkText: "CUSTOMIZE YOUR OWN"
          }
        ]}
        autoplaySpeed={6000}
      />
      
      <FeaturedCategories />
      
      <TrendingProducts />
      
      <UspSection />
      
      <FeaturedCollection />
      
      <InstagramGrid images={instagramImages} />
      
      {/* Testimonials Section */}
      <section className="py-12 px-4 bg-[#BECCD5] bg-opacity-20">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">WHAT OUR CUSTOMERS SAY</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials && testimonials.length > 0 ? (
              testimonials.map((testimonial, index) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <p className="text-gray-500">No testimonials available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Email Subscription */}
      <section className="py-12 px-4 bg-[#532E4E] text-white">
        <div className="container mx-auto">
          <NewsletterForm />
        </div>
      </section>
    </>
  );
};

export default Home;

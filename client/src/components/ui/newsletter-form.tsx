import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

const NewsletterForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/subscribe", { email: values.email });
      toast({
        title: "Subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className="max-w-xl mx-auto text-center"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={formVariants}
    >
      <h2 className="text-3xl font-bold mb-3">JOIN THE LOUDFITS FAMILY</h2>
      <p className="mb-6">Subscribe to get exclusive offers, early access to new designs, and style inspiration.</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="Your email address"
                    className="py-3 px-4 text-black focus:outline-none w-full"
                  />
                </FormControl>
                <FormMessage className="text-left text-sm" />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-black text-white hover:bg-[#582A34] transition-colors py-3 px-6 font-bold shrink-0"
          >
            SUBSCRIBE
          </Button>
        </form>
      </Form>
    </motion.div>
  );
};

export default NewsletterForm;

import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Jennifer O.",
    quote: "As soon as I start tapping I instantly feel calmer. I use it every day and am a totally different person from the one I was pre Tapaway.",
    rating: 5,
    cardBg: "bg-primary/5 border-primary/20",
    quoteBg: "text-primary/30",
    avatarBg: "bg-primary/20 text-primary",
  },
  {
    name: "Steven H.",
    quote: "Tapping has helped me to get rid of anxiety. I used to wake up anxious... It doesn't happen often now, but if it does I simply tap it away!",
    rating: 5,
    cardBg: "bg-orange-50 border-orange-200",
    quoteBg: "text-orange-300",
    avatarBg: "bg-orange-100 text-orange-600",
  },
  {
    name: "Sam R.",
    quote: "All my friends can tell a difference in me. Daily tapping is incredibly powerful!",
    rating: 5,
    cardBg: "bg-purple-50 border-purple-200",
    quoteBg: "text-purple-300",
    avatarBg: "bg-purple-100 text-purple-600",
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Why People Love Tapaway
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real stories from real people who have transformed their emotional wellbeing.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`${testimonial.cardBg} border rounded-2xl p-8 shadow-soft hover-lift transition-all duration-300 relative`}
            >
              <Quote className={`absolute top-4 right-4 w-8 h-8 ${testimonial.quoteBg}`} />
              
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              
              <p className="text-foreground mb-6 leading-relaxed italic">
                "{testimonial.quote}"
              </p>
              
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${testimonial.avatarBg} flex items-center justify-center`}>
                  <span className="font-semibold">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <span className="font-medium text-foreground">{testimonial.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

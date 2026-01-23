import { Clock, Target, Shield, Beaker } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Available wherever you are, whenever you need it. No appointments, no waiting.",
  },
  {
    icon: Target,
    title: "Tailored Sessions",
    description: "Personalised help with anxiety, stress, low mood, and more—designed just for you.",
  },
  {
    icon: Shield,
    title: "Private & Personal",
    description: "No need to talk to anyone or explain your story. Your journey, your pace.",
  },
  {
    icon: Beaker,
    title: "Science-Backed",
    description: "Proven techniques supported by 100+ peer-reviewed studies and clinical trials.",
  },
];

export const BenefitsSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl bg-card shadow-soft hover-lift transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4">
                <benefit.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

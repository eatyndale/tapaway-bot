import { Clock, Target, Shield, Beaker } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Available wherever you are, whenever you need it. No appointments, no waiting.",
    accentColor: "bg-primary/15 text-primary border-primary/20",
    iconBg: "bg-primary/20 text-primary",
  },
  {
    icon: Target,
    title: "Tailored Sessions",
    description: "Personalised help with anxiety, stress, low mood, and more—designed just for you.",
    accentColor: "bg-orange-50 text-orange-600 border-orange-200",
    iconBg: "bg-orange-100 text-orange-600",
  },
  {
    icon: Shield,
    title: "Private & Personal",
    description: "No need to talk to anyone or explain your story. Your journey, your pace.",
    accentColor: "bg-purple-50 text-purple-600 border-purple-200",
    iconBg: "bg-purple-100 text-purple-600",
  },
  {
    icon: Beaker,
    title: "Science-Backed",
    description: "Proven techniques supported by 100+ peer-reviewed studies and clinical trials.",
    accentColor: "bg-emerald-50 text-emerald-600 border-emerald-200",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
];

export const BenefitsSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-orange-50/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`text-center p-6 rounded-2xl bg-card shadow-soft hover-lift transition-all duration-300 border-l-4 ${benefit.accentColor.split(' ')[2]}`}
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${benefit.iconBg} mb-4`}>
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

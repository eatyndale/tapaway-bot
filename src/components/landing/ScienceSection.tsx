import { Beaker, Brain, BookOpen, TrendingDown } from "lucide-react";

const stats = [
  {
    value: "43%",
    label: "Cortisol Reduction",
    description: "vs 14% in talk therapy alone",
    source: "Journal of Nervous and Mental Disease",
    icon: TrendingDown,
  },
  {
    value: "41%",
    label: "Anxiety Reduction",
    description: "Average across multiple clinical trials",
    source: "2022 Meta-Analysis",
    icon: Brain,
  },
  {
    value: "100+",
    label: "Peer-Reviewed Studies",
    description: "Supporting EFT effectiveness",
    source: "Research Database",
    icon: BookOpen,
  },
];

export const ScienceSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Beaker className="w-4 h-4" />
            <span className="text-sm font-medium">Evidence-Based</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            The Science Behind Tapping
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            EFT tapping isn't just about feeling better—it's backed by rigorous scientific research 
            showing measurable changes in your brain and body.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="glass rounded-2xl p-8 text-center hover-lift transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-5xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-lg font-semibold text-foreground mb-2">{stat.label}</div>
              <p className="text-muted-foreground text-sm mb-3">{stat.description}</p>
              <p className="text-xs text-muted-foreground/70 italic">{stat.source}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
            <strong>MRI studies</strong> show EFT tapping affects the amygdala—your brain's emotional 
            processing center—helping to reduce the intensity of emotional responses. Clinical trials 
            demonstrate lasting effects for <strong>PTSD, depression, anxiety, and phobias</strong>.
          </p>
        </div>
      </div>
    </section>
  );
};

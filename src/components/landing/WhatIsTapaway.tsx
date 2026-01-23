import { Sparkles, Heart } from "lucide-react";

export const WhatIsTapaway = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              What is Tapaway?
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Tapaway is a gentle, guided system designed to help you clear emotional blocks 
              using the power of <strong className="text-foreground">Emotional Freedom Techniques (EFT)</strong>. 
              Whether you're feeling stuck, overwhelmed, anxious, or disconnected, 
              Tapaway helps you come back to yourself—calm, clear, and ready.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="glass rounded-2xl p-8 hover-lift transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-6">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                Step 1: Tap Away the Blocks
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Release emotions, limiting beliefs, and nervous system stress through guided tapping sequences. 
                Think of it as <strong className="text-foreground">emotional decluttering</strong>—clearing 
                out what no longer serves you.
              </p>
            </div>

            <div className="glass rounded-2xl p-8 hover-lift transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 text-accent-foreground mb-6">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                Step 2: Guided Affirmations
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Once clear, align with positive statements that help you feel calm and centred. 
                These <strong className="text-foreground">"Tapamations"</strong> reinforce your new 
                emotional state and build lasting resilience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

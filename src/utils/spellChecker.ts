// Spell checking and typo correction utilities
export class SpellChecker {
  // Common anxiety-related words and their corrections
  private static anxietyTerms: Record<string, string> = {
    // Common misspellings
    'anxious': 'anxious',
    'anxios': 'anxious', 
    'anxiuos': 'anxious',
    'anixous': 'anxious',
    'stressed': 'stressed',
    'stresed': 'stressed',
    'stresd': 'stressed',
    'depressed': 'depressed',
    'depresed': 'depressed',
    'depress': 'depressed',
    'worried': 'worried',
    'worryed': 'worried',
    'woried': 'worried',
    'scared': 'scared',
    'scaed': 'scared',
    'afraid': 'afraid',
    'afraaid': 'afraid',
    'overwhelmed': 'overwhelmed',
    'overwelmed': 'overwhelmed',
    'overwhelmd': 'overwhelmed',
    'panicked': 'panicked',
    'panicced': 'panicked',
    'terrified': 'terrified',
    'terified': 'terrified',
    'hopeless': 'hopeless',
    'hopeles': 'hopeless',
    'helpless': 'helpless',
    'helpeles': 'helpless',
    'frustrated': 'frustrated',
    'fustrated': 'frustrated',
    'frustraited': 'frustrated',
    // Body locations
    'chest': 'chest',
    'stomache': 'stomach',
    'stomch': 'stomach',
    'shouldor': 'shoulder',
    'shoulders': 'shoulders',
    'throut': 'throat',
    'throaht': 'throat',
    'forhead': 'forehead',
    'fourhead': 'forehead',
    // Common phrases
    'cant': "can't",
    'wont': "won't",
    'dont': "don't",
    'isnt': "isn't",
    'wasnt': "wasn't",
    'couldnt': "couldn't",
    'shouldnt': "shouldn't",
    'wouldnt': "wouldn't",
  };

  // Levenshtein distance calculation for fuzzy matching
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Auto-correct common typos in user input
  static correctTypos(input: string): string {
    if (!input || typeof input !== 'string') return input;
    
    let correctedInput = input.toLowerCase();
    
    // Direct replacements
    for (const [typo, correction] of Object.entries(this.anxietyTerms)) {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      correctedInput = correctedInput.replace(regex, correction);
    }
    
    return correctedInput;
  }

  // Find best match for a word using fuzzy matching
  static findBestMatch(word: string): string | null {
    const lowerWord = word.toLowerCase();
    let bestMatch: string | null = null;
    let bestDistance = Infinity;
    const maxDistance = Math.floor(word.length * 0.4); // Allow 40% character difference
    
    for (const [typo, correction] of Object.entries(this.anxietyTerms)) {
      const distance = this.levenshteinDistance(lowerWord, typo);
      if (distance <= maxDistance && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = correction;
      }
    }
    
    return bestMatch;
  }

  // Enhanced correction with fuzzy matching
  static correctWithFuzzyMatching(input: string): { corrected: string; changes: string[] } {
    if (!input || typeof input !== 'string') return { corrected: input, changes: [] };
    
    // Split on whitespace only, preserving contractions like "I'm", "you've"
    const tokens = input.split(/(\s+)/);
    const changes: string[] = [];
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      // Skip whitespace tokens
      if (/^\s+$/.test(token)) continue;
      
      // Extract the word part (without leading/trailing punctuation)
      const match = token.match(/^([^\w]*)(\w+)([^\w]*)$/);
      if (!match) continue;
      
      const [, prefix, word, suffix] = match;
      
      // Try direct correction first
      const directCorrection = this.anxietyTerms[word.toLowerCase()];
      if (directCorrection && directCorrection !== word.toLowerCase()) {
        tokens[i] = prefix + directCorrection + suffix;
        changes.push(`"${word}" → "${directCorrection}"`);
        continue;
      }
      
      // Try fuzzy matching for unrecognized words
      const fuzzyMatch = this.findBestMatch(word);
      if (fuzzyMatch && fuzzyMatch !== word.toLowerCase()) {
        tokens[i] = prefix + fuzzyMatch + suffix;
        changes.push(`"${word}" → "${fuzzyMatch}"`);
      }
    }
    
    return {
      corrected: tokens.join(''),
      changes
    };
  }

  // Context-aware validation for intensity and emotion words
  static validateEmotionInput(input: string): { isValid: boolean; suggestions: string[] } {
    const emotionWords = [
      'anxious', 'stressed', 'worried', 'scared', 'afraid', 'panicked', 
      'overwhelmed', 'frustrated', 'angry', 'sad', 'hopeless', 'helpless',
      'terrified', 'nervous', 'tense', 'restless', 'agitated', 'irritated'
    ];
    
    const lowerInput = input.toLowerCase().trim();
    const suggestions: string[] = [];
    
    // Check if input contains emotion words
    const containsEmotion = emotionWords.some(emotion => 
      lowerInput.includes(emotion) || this.levenshteinDistance(lowerInput, emotion) <= 2
    );
    
    if (!containsEmotion && lowerInput.length > 0) {
      // Suggest similar emotion words
      emotionWords.forEach(emotion => {
        if (this.levenshteinDistance(lowerInput, emotion) <= 3) {
          suggestions.push(emotion);
        }
      });
    }
    
    return {
      isValid: containsEmotion || lowerInput.length < 3, // Short inputs are okay
      suggestions: suggestions.slice(0, 3) // Limit to 3 suggestions
    };
  }
}
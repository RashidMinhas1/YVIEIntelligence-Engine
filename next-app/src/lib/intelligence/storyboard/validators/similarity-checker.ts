export class SimilarityChecker {
  /**
   * Calculates Levenshtein distance between two strings
   */
  public static calculateLevenshtein(a: string, b: string): number {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  /**
   * Returns a similarity score between 0 and 1
   * 1 = identical, 0 = completely different
   */
  public static calculateSimilarity(text1: string, text2: string): number {
    const a = text1.toLowerCase().trim();
    const b = text2.toLowerCase().trim();
    if (a.length === 0 && b.length === 0) return 1;
    if (a.length === 0 || b.length === 0) return 0;
    
    const distance = this.calculateLevenshtein(a, b);
    const maxLength = Math.max(a.length, b.length);
    return 1 - (distance / maxLength);
  }
}

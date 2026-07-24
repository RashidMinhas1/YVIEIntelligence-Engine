export class SemanticNormalizer {
  /**
   * Normalizes a prompt concept to a base semantic root.
   * "Messy desk", "Laptop desk", "Office desk" -> "desk"
   */
  public static normalizeConcept(text: string): string {
    const lower = text.toLowerCase().trim();
    
    // Desk variants
    if (lower.includes("desk") || lower.includes("workspace") || lower.includes("office table")) {
      return "desk";
    }
    
    // Laptop/Typing variants
    if (lower.includes("laptop") || lower.includes("typing") || lower.includes("keyboard") || lower.includes("code on screen")) {
      return "laptop/typing";
    }
    
    // Dark room variants
    if (lower.includes("dark room") || lower.includes("shadowy room") || lower.includes("dimly lit room")) {
      return "dark room";
    }
    
    // Server room variants
    if (lower.includes("server") || lower.includes("data center") || lower.includes("racks")) {
      return "server room";
    }

    // Hands variants
    if (lower.includes("hands") || lower.includes("fingers")) {
      return "hands";
    }

    return lower;
  }
}

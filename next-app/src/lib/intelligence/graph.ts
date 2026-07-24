import { IntelligenceGraph, IntelligenceGraphEdge } from "../types/viral-intelligence";

export class GraphAnalyzer {
  public static getEdgesByNode(graph: IntelligenceGraph, nodeName: string): IntelligenceGraphEdge[] {
    return graph.edges.filter(
      (edge) => edge.sourceNode.toLowerCase() === nodeName.toLowerCase() || 
                edge.targetNode.toLowerCase() === nodeName.toLowerCase()
    );
  }

  public static getConflicts(graph: IntelligenceGraph): IntelligenceGraphEdge[] {
    return graph.edges.filter(edge => edge.relationshipType === "conflicting");
  }

  public static getSynergies(graph: IntelligenceGraph): IntelligenceGraphEdge[] {
    return graph.edges.filter(edge => edge.relationshipType === "strong");
  }

  public static getMissingLinks(graph: IntelligenceGraph): IntelligenceGraphEdge[] {
    return graph.edges.filter(edge => edge.relationshipType === "missing");
  }
}

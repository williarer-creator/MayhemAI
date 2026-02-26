/**
 * Domain Selector
 *
 * Classifies design requests into knowledge domains and element types.
 * Uses rule-based heuristics and can be enhanced with AI reasoning.
 */

import type {
  DesignRequest,
  DomainClassification,
  ElementTypeClassification,
  KnowledgeDomain,
  ConnectionPoint,
} from './types';

// ============================================================================
// CLASSIFICATION RULES
// ============================================================================

/**
 * Keywords associated with each domain
 */
const domainKeywords: Record<KnowledgeDomain, string[]> = {
  access: [
    'stairs', 'stair', 'stairway', 'staircase', 'steps',
    'ladder', 'ladders', 'climb', 'climbing',
    'ramp', 'ramps', 'slope', 'incline',
    'platform', 'platforms', 'mezzanine', 'deck', 'decking',
    'walkway', 'walkways', 'catwalk', 'footbridge',
    'access', 'egress', 'exit', 'entry', 'entrance',
    'handrail', 'guardrail', 'balustrade',
    'elevation', 'level', 'floor', 'landing',
  ],
  structure: [
    'beam', 'beams', 'girder', 'joist', 'header',
    'column', 'columns', 'post', 'posts', 'pillar',
    'frame', 'frames', 'framing', 'framework',
    'support', 'supports', 'supporting',
    'bracket', 'brackets', 'cantilever',
    'brace', 'bracing', 'braced',
    'truss', 'trusses',
    'foundation', 'base', 'footing',
    'load', 'loads', 'load-bearing', 'structural',
  ],
  enclosure: [
    'guard', 'guards', 'guarding', 'machine guard',
    'cover', 'covers', 'covering', 'enclosure',
    'housing', 'housings', 'cabinet', 'box',
    'panel', 'panels', 'sheet metal',
    'fence', 'fences', 'fencing', 'barrier',
    'door', 'doors', 'gate', 'gates',
    'window', 'windows', 'viewport',
    'louver', 'louvers', 'vent', 'ventilation',
    'safety', 'protection', 'protect',
    'contain', 'containment', 'enclose',
  ],
  flow: [
    'pipe', 'pipes', 'piping', 'pipeline',
    'duct', 'ducts', 'ductwork', 'ducting',
    'conduit', 'conduits', 'raceway',
    'cable', 'cables', 'cable tray', 'wire',
    'tube', 'tubes', 'tubing',
    'route', 'routing', 'run', 'running',
    'fluid', 'liquid', 'gas', 'air', 'water',
    'hvac', 'plumbing', 'electrical',
    'flow', 'flowing', 'convey', 'transport',
  ],
  mechanical: [
    'shaft', 'shafts', 'axle', 'spindle',
    'coupling', 'couplings', 'connect', 'connection',
    'bearing', 'bearings', 'bushing',
    'linkage', 'linkages', 'mechanism',
    'lever', 'levers', 'arm', 'arms',
    'gear', 'gears', 'gearbox', 'transmission',
    'motor', 'motors', 'drive', 'driven',
    'mount', 'mounts', 'mounting', 'vibration',
    'rotate', 'rotation', 'rotary', 'rotating',
    'motion', 'movement', 'actuator',
  ],
};

/**
 * Element types within each domain
 */
const domainElements: Record<KnowledgeDomain, Array<{ type: string; keywords: string[] }>> = {
  access: [
    { type: 'stairs', keywords: ['stairs', 'stair', 'stairway', 'staircase', 'steps', 'rise', 'tread'] },
    { type: 'ladder', keywords: ['ladder', 'ladders', 'climb', 'rungs', 'cage', 'fixed ladder'] },
    { type: 'ramp', keywords: ['ramp', 'ramps', 'slope', 'incline', 'ada', 'wheelchair'] },
    { type: 'platform', keywords: ['platform', 'platforms', 'mezzanine', 'deck', 'landing'] },
    { type: 'walkway', keywords: ['walkway', 'walkways', 'catwalk', 'grating', 'footbridge'] },
  ],
  structure: [
    { type: 'beam', keywords: ['beam', 'beams', 'girder', 'joist', 'header', 'span'] },
    { type: 'column', keywords: ['column', 'columns', 'post', 'posts', 'pillar', 'vertical'] },
    { type: 'bracing', keywords: ['brace', 'bracing', 'braced', 'diagonal', 'lateral'] },
    { type: 'bracket', keywords: ['bracket', 'brackets', 'cantilever', 'support bracket'] },
    { type: 'connection', keywords: ['connection', 'joint', 'bolted', 'welded', 'moment'] },
  ],
  enclosure: [
    { type: 'guard', keywords: ['guard', 'guards', 'machine guard', 'safety guard'] },
    { type: 'cover', keywords: ['cover', 'covers', 'lid', 'top', 'weather cover'] },
    { type: 'panel', keywords: ['panel', 'panels', 'sheet', 'plate', 'skin'] },
    { type: 'fence', keywords: ['fence', 'fences', 'fencing', 'perimeter', 'barrier'] },
    { type: 'door', keywords: ['door', 'doors', 'gate', 'access door', 'hatch'] },
    { type: 'louver', keywords: ['louver', 'louvers', 'vent', 'ventilation', 'air intake'] },
  ],
  flow: [
    { type: 'pipe', keywords: ['pipe', 'pipes', 'piping', 'pipeline', 'tubing'] },
    { type: 'duct', keywords: ['duct', 'ducts', 'ductwork', 'hvac', 'air duct'] },
    { type: 'conduit', keywords: ['conduit', 'conduits', 'raceway', 'electrical'] },
    { type: 'cable-tray', keywords: ['cable tray', 'cable trays', 'wire tray', 'cable ladder'] },
    { type: 'supports', keywords: ['hanger', 'hangers', 'support', 'pipe support', 'duct hanger'] },
  ],
  mechanical: [
    { type: 'shaft', keywords: ['shaft', 'shafts', 'axle', 'spindle', 'drive shaft'] },
    { type: 'coupling', keywords: ['coupling', 'couplings', 'coupler', 'flexible coupling'] },
    { type: 'linkage', keywords: ['linkage', 'linkages', 'mechanism', 'four-bar', 'lever'] },
    { type: 'bearing', keywords: ['bearing', 'bearings', 'bushing', 'pillow block'] },
    { type: 'mount', keywords: ['mount', 'mounts', 'mounting', 'vibration mount', 'isolator'] },
  ],
};

/**
 * Point type hints for domain selection
 */
const pointTypeHints: Record<ConnectionPoint['type'], KnowledgeDomain[]> = {
  floor: ['access', 'structure'],
  wall: ['enclosure', 'structure'],
  ceiling: ['structure', 'flow'],
  equipment: ['mechanical', 'enclosure', 'flow'],
  structure: ['structure', 'access'],
  opening: ['access', 'enclosure'],
  custom: [],
};

// ============================================================================
// DOMAIN SELECTOR CLASS
// ============================================================================

export class DomainSelector {
  /**
   * Classify a design request into a knowledge domain
   */
  classifyDomain(request: DesignRequest): DomainClassification {
    const scores: Record<KnowledgeDomain, number> = {
      access: 0,
      structure: 0,
      enclosure: 0,
      flow: 0,
      mechanical: 0,
    };

    // Score based on description keywords
    const descLower = request.description.toLowerCase();
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      for (const keyword of keywords) {
        if (descLower.includes(keyword)) {
          scores[domain as KnowledgeDomain] += 1;
        }
      }
    }

    // Score based on point types
    const pointTypes = [request.pointA.type, request.pointB.type];
    for (const pointType of pointTypes) {
      const hints = pointTypeHints[pointType];
      for (const domain of hints) {
        scores[domain] += 0.5;
      }
    }

    // Score based on elevation difference (suggests access)
    const elevationDiff = Math.abs(request.pointA.position.z - request.pointB.position.z);
    if (elevationDiff > 500) {
      scores.access += 2;
    } else if (elevationDiff > 100) {
      scores.access += 1;
    }

    // Score based on horizontal distance (suggests flow/structure)
    const horizDist = Math.sqrt(
      Math.pow(request.pointB.position.x - request.pointA.position.x, 2) +
      Math.pow(request.pointB.position.y - request.pointA.position.y, 2)
    );
    if (horizDist > 5000) {
      scores.flow += 1;
      scores.structure += 1;
    }

    // Find primary domain
    const sortedDomains = Object.entries(scores)
      .sort(([, a], [, b]) => b - a) as Array<[KnowledgeDomain, number]>;

    const primaryDomain = sortedDomains[0][0];
    const primaryScore = sortedDomains[0][1];
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    // Calculate confidence
    const confidence = totalScore > 0 ? primaryScore / totalScore : 0.5;

    // Build secondary domains
    const secondaryDomains = sortedDomains
      .slice(1)
      .filter(([, score]) => score > 0)
      .map(([domain, score]) => ({
        domain,
        confidence: totalScore > 0 ? score / totalScore : 0,
        reason: this.getDomainReason(domain, request.description),
      }));

    // Generate reasoning
    const reasoning = this.generateReasoning(request, primaryDomain, sortedDomains);

    return {
      primaryDomain,
      confidence: Math.min(confidence, 0.95), // Cap at 95% for rule-based
      secondaryDomains,
      reasoning,
    };
  }

  /**
   * Classify the specific element type within a domain
   */
  classifyElementType(request: DesignRequest, domain: KnowledgeDomain): ElementTypeClassification {
    const elements = domainElements[domain];
    const descLower = request.description.toLowerCase();

    const scores: Array<{ type: string; score: number }> = [];

    for (const element of elements) {
      let score = 0;
      for (const keyword of element.keywords) {
        if (descLower.includes(keyword)) {
          score += 1;
        }
      }
      scores.push({ type: element.type, score });
    }

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    // If no matches, use heuristics based on points
    if (scores[0].score === 0) {
      const heuristic = this.heuristicElementType(request, domain);
      return {
        domain,
        elementType: heuristic.type,
        confidence: heuristic.confidence,
        alternatives: elements
          .filter(e => e.type !== heuristic.type)
          .slice(0, 2)
          .map(e => ({
            elementType: e.type,
            confidence: 0.1,
            reason: 'No specific keywords matched',
          })),
      };
    }

    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

    return {
      domain,
      elementType: scores[0].type,
      confidence: Math.min(scores[0].score / totalScore, 0.9),
      alternatives: scores.slice(1).filter(s => s.score > 0).map(s => ({
        elementType: s.type,
        confidence: s.score / totalScore,
        reason: `Keywords matched: ${domainElements[domain].find(e => e.type === s.type)?.keywords.filter(k => descLower.includes(k)).join(', ')}`,
      })),
    };
  }

  /**
   * Heuristic element type based on geometric relationship
   */
  private heuristicElementType(
    request: DesignRequest,
    domain: KnowledgeDomain
  ): { type: string; confidence: number } {
    const elevationDiff = Math.abs(request.pointA.position.z - request.pointB.position.z);
    const horizDist = Math.sqrt(
      Math.pow(request.pointB.position.x - request.pointA.position.x, 2) +
      Math.pow(request.pointB.position.y - request.pointA.position.y, 2)
    );

    switch (domain) {
      case 'access':
        // Steep incline suggests ladder, moderate suggests stairs, shallow suggests ramp
        if (horizDist < 100) {
          return { type: 'ladder', confidence: 0.6 };
        } else if (elevationDiff > 0 && elevationDiff / horizDist > 0.7) {
          return { type: 'ladder', confidence: 0.5 };
        } else if (elevationDiff > 0 && elevationDiff / horizDist > 0.25) {
          return { type: 'stairs', confidence: 0.6 };
        } else if (elevationDiff > 0) {
          return { type: 'ramp', confidence: 0.5 };
        } else {
          return { type: 'walkway', confidence: 0.5 };
        }

      case 'structure':
        // Vertical suggests column, horizontal suggests beam
        if (Math.abs(elevationDiff) > horizDist) {
          return { type: 'column', confidence: 0.6 };
        } else {
          return { type: 'beam', confidence: 0.6 };
        }

      case 'enclosure':
        // Default to panel for general enclosure
        return { type: 'panel', confidence: 0.4 };

      case 'flow':
        // Default to pipe for general flow
        return { type: 'pipe', confidence: 0.4 };

      case 'mechanical':
        // Default to shaft for point-to-point mechanical connection
        return { type: 'shaft', confidence: 0.4 };

      default:
        return { type: 'unknown', confidence: 0.1 };
    }
  }

  /**
   * Get reason for domain suggestion
   */
  private getDomainReason(domain: KnowledgeDomain, description: string): string {
    const descLower = description.toLowerCase();
    const keywords = domainKeywords[domain];
    const matchedKeywords = keywords.filter(k => descLower.includes(k));

    if (matchedKeywords.length > 0) {
      return `Keywords matched: ${matchedKeywords.slice(0, 3).join(', ')}`;
    }
    return 'Geometric analysis suggests this domain may be relevant';
  }

  /**
   * Generate reasoning explanation
   */
  private generateReasoning(
    request: DesignRequest,
    primaryDomain: KnowledgeDomain,
    scores: Array<[KnowledgeDomain, number]>
  ): string {
    const parts: string[] = [];

    // Describe the request
    parts.push(`Analyzing request to connect ${request.pointA.type} at (${request.pointA.position.x.toFixed(0)}, ${request.pointA.position.y.toFixed(0)}, ${request.pointA.position.z.toFixed(0)}) to ${request.pointB.type} at (${request.pointB.position.x.toFixed(0)}, ${request.pointB.position.y.toFixed(0)}, ${request.pointB.position.z.toFixed(0)}).`);

    // Describe elevation change
    const elevationDiff = request.pointB.position.z - request.pointA.position.z;
    if (Math.abs(elevationDiff) > 100) {
      parts.push(`Elevation change of ${elevationDiff.toFixed(0)}mm suggests ${elevationDiff > 0 ? 'ascending' : 'descending'} connection.`);
    }

    // Describe domain selection
    parts.push(`Selected ${primaryDomain.toUpperCase()} domain based on keyword analysis and geometric factors.`);

    // Mention runner-up if close
    if (scores.length > 1 && scores[1][1] > scores[0][1] * 0.5) {
      parts.push(`${scores[1][0].toUpperCase()} domain was also considered (${((scores[1][1] / scores[0][1]) * 100).toFixed(0)}% of primary score).`);
    }

    return parts.join(' ');
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createDomainSelector(): DomainSelector {
  return new DomainSelector();
}

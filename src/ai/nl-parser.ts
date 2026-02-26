/**
 * Natural Language Parser
 *
 * Extracts structured requirements from natural language descriptions.
 * Uses pattern matching and can be enhanced with AI reasoning.
 */

import type {
  ParsedRequirements,
  ExtractedEndpoint,
  ExtractedConstraint,
  ExtractedPreference,
  ConnectionPoint,
} from './types';

// ============================================================================
// PARSING PATTERNS
// ============================================================================

/**
 * Patterns for extracting endpoints
 */
const endpointPatterns: Array<{
  pattern: RegExp;
  role: 'start' | 'end';
  typeHint?: ConnectionPoint['type'];
}> = [
  // From/to patterns
  { pattern: /from\s+(?:the\s+)?(\w+(?:\s+\w+)?)\s+(?:floor|level|elevation)/i, role: 'start', typeHint: 'floor' },
  { pattern: /to\s+(?:the\s+)?(\w+(?:\s+\w+)?)\s+(?:floor|level|elevation)/i, role: 'end', typeHint: 'floor' },
  { pattern: /from\s+(?:the\s+)?(\w+)\s+(?:to|toward)/i, role: 'start' },
  { pattern: /(?:to|toward)\s+(?:the\s+)?(\w+(?:\s+\w+)?)/i, role: 'end' },

  // Floor/level patterns
  { pattern: /ground\s+(?:floor|level)/i, role: 'start', typeHint: 'floor' },
  { pattern: /(?:first|second|third|fourth|fifth)\s+(?:floor|level)/i, role: 'end', typeHint: 'floor' },
  { pattern: /mezzanine/i, role: 'end', typeHint: 'floor' },
  { pattern: /basement/i, role: 'start', typeHint: 'floor' },

  // Equipment patterns
  { pattern: /(?:motor|pump|compressor|tank|vessel)\s*(?:#?\d+)?/i, role: 'end', typeHint: 'equipment' },

  // Opening patterns
  { pattern: /(?:door|doorway|entrance|exit|hatch)/i, role: 'end', typeHint: 'opening' },

  // Wall patterns
  { pattern: /(?:north|south|east|west|exterior|interior)\s+wall/i, role: 'end', typeHint: 'wall' },
];

/**
 * Patterns for extracting dimensional constraints
 */
const dimensionalPatterns: Array<{
  pattern: RegExp;
  type: ExtractedConstraint['type'];
  extract: (match: RegExpMatchArray) => { value: number; unit: string };
}> = [
  // Height patterns
  {
    pattern: /(\d+(?:\.\d+)?)\s*(?:mm|cm|m|ft|feet|inches?|")\s*(?:high|tall|height)/i,
    type: 'dimensional',
    extract: (m) => ({ value: parseNumber(m[1]), unit: normalizeUnit(m[0]) }),
  },
  // Width patterns
  {
    pattern: /(\d+(?:\.\d+)?)\s*(?:mm|cm|m|ft|feet|inches?|")\s*wide/i,
    type: 'dimensional',
    extract: (m) => ({ value: parseNumber(m[1]), unit: normalizeUnit(m[0]) }),
  },
  // Length patterns
  {
    pattern: /(\d+(?:\.\d+)?)\s*(?:mm|cm|m|ft|feet|inches?|")\s*(?:long|length)/i,
    type: 'dimensional',
    extract: (m) => ({ value: parseNumber(m[1]), unit: normalizeUnit(m[0]) }),
  },
  // General dimension
  {
    pattern: /(?:about|approximately|around|~)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm|m|ft|feet|inches?|")/i,
    type: 'dimensional',
    extract: (m) => ({ value: parseNumber(m[1]), unit: normalizeUnit(m[0]) }),
  },
  // Rise/elevation
  {
    pattern: /(?:rise|elevation|drop)\s+(?:of\s+)?(\d+(?:\.\d+)?)\s*(?:mm|cm|m|ft|feet|inches?|")?/i,
    type: 'dimensional',
    extract: (m) => ({ value: parseNumber(m[1]), unit: normalizeUnit(m[0]) || 'mm' }),
  },
];

/**
 * Patterns for extracting material constraints
 */
const materialPatterns: Array<{
  pattern: RegExp;
  material: string;
}> = [
  { pattern: /\bsteel\b/i, material: 'steel' },
  { pattern: /\bstainless\s*steel\b/i, material: 'stainless-steel' },
  { pattern: /\bgalvanized\b/i, material: 'galvanized-steel' },
  { pattern: /\baluminum\b|\baluminium\b/i, material: 'aluminum' },
  { pattern: /\bwood\b|\bwooden\b|\btimber\b/i, material: 'wood' },
  { pattern: /\bfiberglass\b|\bfrp\b/i, material: 'fiberglass' },
  { pattern: /\bplastic\b|\bpvc\b|\bhdpe\b/i, material: 'plastic' },
  { pattern: /\bconcrete\b/i, material: 'concrete' },
  { pattern: /\bcomposite\b/i, material: 'composite' },
];

/**
 * Patterns for extracting code requirements
 */
const codePatterns: Array<{
  pattern: RegExp;
  code: string;
  sections?: string[];
}> = [
  { pattern: /\bibc\b|\bbuilding\s+code\b/i, code: 'IBC' },
  { pattern: /\bosha\b/i, code: 'OSHA' },
  { pattern: /\bada\b|\baccessib(?:le|ility)\b/i, code: 'ADA' },
  { pattern: /\bnfpa\b|\bfire\s+code\b/i, code: 'NFPA' },
  { pattern: /\baisc\b|\bsteel\s+code\b/i, code: 'AISC' },
  { pattern: /\basme\b/i, code: 'ASME' },
  { pattern: /\bnec\b|\belectrical\s+code\b/i, code: 'NEC' },
  { pattern: /\baws\b|\bwelding\b/i, code: 'AWS' },
];

/**
 * Patterns for extracting cost constraints
 */
const costPatterns: Array<{
  pattern: RegExp;
  extract: (match: RegExpMatchArray) => { value: number; currency: string };
}> = [
  {
    pattern: /(?:budget|cost|price)\s*(?:of|under|below|max|maximum)?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    extract: (m) => ({ value: parseNumber(m[1].replace(/,/g, '')), currency: 'USD' }),
  },
  {
    pattern: /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    extract: (m) => ({ value: parseNumber(m[1].replace(/,/g, '')), currency: 'USD' }),
  },
  {
    pattern: /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars|USD)/i,
    extract: (m) => ({ value: parseNumber(m[1].replace(/,/g, '')), currency: 'USD' }),
  },
];

/**
 * Patterns for extracting preferences
 */
const preferencePatterns: Array<{
  pattern: RegExp;
  strength: ExtractedPreference['strength'];
}> = [
  { pattern: /\bmust\s+(be|have|use|include)\b/i, strength: 'must' },
  { pattern: /\brequired?\b|\bmandatory\b|\bessential\b/i, strength: 'must' },
  { pattern: /\bshould\s+(be|have|use|include)\b/i, strength: 'should' },
  { pattern: /\bprefer(?:red|ably)?\b|\bideally\b/i, strength: 'should' },
  { pattern: /\bcould\s+(be|have|use|include)\b/i, strength: 'could' },
  { pattern: /\boptional(?:ly)?\b|\bif\s+possible\b/i, strength: 'could' },
  { pattern: /\bwould\s+like\b|\bnice\s+to\s+have\b/i, strength: 'would-like' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseNumber(str: string): number {
  return parseFloat(str.replace(/,/g, ''));
}

function normalizeUnit(str: string): string {
  const lower = str.toLowerCase();
  if (lower.includes('mm')) return 'mm';
  if (lower.includes('cm')) return 'cm';
  if (lower.includes('m') && !lower.includes('mm')) return 'm';
  if (lower.includes('ft') || lower.includes('feet')) return 'ft';
  if (lower.includes('inch') || lower.includes('"')) return 'in';
  return 'mm';
}

function convertToMm(value: number, unit: string): number {
  switch (unit) {
    case 'mm': return value;
    case 'cm': return value * 10;
    case 'm': return value * 1000;
    case 'ft': return value * 304.8;
    case 'in': return value * 25.4;
    default: return value;
  }
}

// ============================================================================
// NATURAL LANGUAGE PARSER CLASS
// ============================================================================

export class NaturalLanguageParser {
  /**
   * Parse natural language description into structured requirements
   */
  parse(description: string): ParsedRequirements {
    const endpoints = this.extractEndpoints(description);
    const constraints = this.extractConstraints(description);
    const preferences = this.extractPreferences(description);

    // Calculate overall confidence
    const totalExtractions = endpoints.length + constraints.length + preferences.length;
    const avgConfidence = totalExtractions > 0
      ? (endpoints.reduce((s, e) => s + e.confidence, 0) +
         constraints.reduce((s, c) => s + c.confidence, 0) +
         preferences.reduce((s, p) => s + p.confidence, 0)) / totalExtractions
      : 0.5;

    // Find unparsed parts
    const unparsedParts = this.findUnparsedParts(description, endpoints, constraints, preferences);

    return {
      endpoints,
      constraints,
      preferences,
      confidence: avgConfidence,
      unparsedParts,
    };
  }

  /**
   * Extract endpoint information
   */
  private extractEndpoints(description: string): ExtractedEndpoint[] {
    const endpoints: ExtractedEndpoint[] = [];

    for (const { pattern, role, typeHint } of endpointPatterns) {
      const match = description.match(pattern);
      if (match) {
        endpoints.push({
          role,
          description: match[0],
          type: typeHint,
          confidence: typeHint ? 0.7 : 0.5,
        });
      }
    }

    // Extract elevation numbers
    const elevationPattern = /(?:at|elevation)\s+(\d+(?:\.\d+)?)\s*(?:mm|m|ft|feet)?/gi;
    let elevMatch;
    while ((elevMatch = elevationPattern.exec(description)) !== null) {
      const value = parseNumber(elevMatch[1]);
      const unit = elevMatch[0].includes('ft') || elevMatch[0].includes('feet') ? 'ft' : 'mm';
      const elevation = convertToMm(value, unit);

      // Assign to start or end based on context
      const role = endpoints.length === 0 ? 'start' : 'end';
      endpoints.push({
        role,
        description: elevMatch[0],
        elevation,
        confidence: 0.6,
      });
    }

    return endpoints;
  }

  /**
   * Extract constraints
   */
  private extractConstraints(description: string): ExtractedConstraint[] {
    const constraints: ExtractedConstraint[] = [];

    // Dimensional constraints
    for (const { pattern, type, extract } of dimensionalPatterns) {
      const match = description.match(pattern);
      if (match) {
        const { value, unit } = extract(match);
        constraints.push({
          type,
          description: match[0],
          value: convertToMm(value, unit),
          unit: 'mm',
          confidence: 0.7,
        });
      }
    }

    // Material constraints
    for (const { pattern, material } of materialPatterns) {
      if (pattern.test(description)) {
        constraints.push({
          type: 'material',
          description: `Material: ${material}`,
          value: material,
          confidence: 0.8,
        });
      }
    }

    // Code constraints
    for (const { pattern, code } of codePatterns) {
      if (pattern.test(description)) {
        constraints.push({
          type: 'code',
          description: `Code compliance: ${code}`,
          value: code,
          confidence: 0.9,
        });
      }
    }

    // Cost constraints
    for (const { pattern, extract } of costPatterns) {
      const match = description.match(pattern);
      if (match) {
        const { value, currency } = extract(match);
        constraints.push({
          type: 'cost',
          description: `Budget: ${currency} ${value}`,
          value,
          unit: currency,
          confidence: 0.7,
        });
      }
    }

    // Environmental constraints
    if (/outdoor|exterior|exposed|weather/i.test(description)) {
      constraints.push({
        type: 'environmental',
        description: 'Outdoor/exposed environment',
        value: 'outdoor',
        confidence: 0.7,
      });
    }
    if (/indoor|interior|inside/i.test(description)) {
      constraints.push({
        type: 'environmental',
        description: 'Indoor environment',
        value: 'indoor',
        confidence: 0.7,
      });
    }
    if (/corrosive|chemical|acid/i.test(description)) {
      constraints.push({
        type: 'environmental',
        description: 'Corrosive environment',
        value: 'corrosive',
        confidence: 0.8,
      });
    }

    return constraints;
  }

  /**
   * Extract preferences
   */
  private extractPreferences(description: string): ExtractedPreference[] {
    const preferences: ExtractedPreference[] = [];
    const sentences = description.split(/[.;]/);

    for (const sentence of sentences) {
      for (const { pattern, strength } of preferencePatterns) {
        if (pattern.test(sentence)) {
          // Extract what the preference is about
          const aspects = this.identifyPreferenceAspects(sentence);
          for (const aspect of aspects) {
            preferences.push({
              aspect: aspect.aspect,
              preference: aspect.preference,
              strength,
              confidence: 0.6,
            });
          }
        }
      }
    }

    // Extract implicit preferences
    if (/simple|easy|straightforward/i.test(description)) {
      preferences.push({
        aspect: 'complexity',
        preference: 'minimize',
        strength: 'should',
        confidence: 0.6,
      });
    }
    if (/cheap|economical|budget|cost-effective/i.test(description)) {
      preferences.push({
        aspect: 'cost',
        preference: 'minimize',
        strength: 'should',
        confidence: 0.6,
      });
    }
    if (/durable|long-lasting|robust/i.test(description)) {
      preferences.push({
        aspect: 'durability',
        preference: 'maximize',
        strength: 'should',
        confidence: 0.6,
      });
    }
    if (/light|lightweight/i.test(description)) {
      preferences.push({
        aspect: 'weight',
        preference: 'minimize',
        strength: 'should',
        confidence: 0.6,
      });
    }
    if (/quick|fast|rapid|soon/i.test(description)) {
      preferences.push({
        aspect: 'lead_time',
        preference: 'minimize',
        strength: 'should',
        confidence: 0.5,
      });
    }

    return preferences;
  }

  /**
   * Identify what aspects a preference sentence is about
   */
  private identifyPreferenceAspects(sentence: string): Array<{ aspect: string; preference: string }> {
    const aspects: Array<{ aspect: string; preference: string }> = [];
    const lower = sentence.toLowerCase();

    if (/material/i.test(lower)) {
      const materialMatch = sentence.match(/(?:use|be|made of)\s+(\w+)/i);
      if (materialMatch) {
        aspects.push({ aspect: 'material', preference: materialMatch[1] });
      }
    }

    if (/color|colour|finish/i.test(lower)) {
      aspects.push({ aspect: 'finish', preference: sentence });
    }

    if (/width|wide/i.test(lower)) {
      aspects.push({ aspect: 'width', preference: sentence });
    }

    if (/height|tall/i.test(lower)) {
      aspects.push({ aspect: 'height', preference: sentence });
    }

    if (aspects.length === 0) {
      // Generic preference
      aspects.push({ aspect: 'general', preference: sentence.trim() });
    }

    return aspects;
  }

  /**
   * Find parts of the description that weren't parsed
   */
  private findUnparsedParts(
    description: string,
    _endpoints: ExtractedEndpoint[],
    _constraints: ExtractedConstraint[],
    _preferences: ExtractedPreference[]
  ): string[] {
    // Simple heuristic: split into sentences and check if any weren't matched
    const sentences = description.split(/[.;!?]/).map(s => s.trim()).filter(s => s.length > 0);
    const unparsed: string[] = [];

    for (const sentence of sentences) {
      // Check if sentence has any recognized patterns
      let recognized = false;

      // Check endpoint patterns
      for (const { pattern } of endpointPatterns) {
        if (pattern.test(sentence)) {
          recognized = true;
          break;
        }
      }

      // Check dimensional patterns
      if (!recognized) {
        for (const { pattern } of dimensionalPatterns) {
          if (pattern.test(sentence)) {
            recognized = true;
            break;
          }
        }
      }

      // Check material patterns
      if (!recognized) {
        for (const { pattern } of materialPatterns) {
          if (pattern.test(sentence)) {
            recognized = true;
            break;
          }
        }
      }

      // Check preference patterns
      if (!recognized) {
        for (const { pattern } of preferencePatterns) {
          if (pattern.test(sentence)) {
            recognized = true;
            break;
          }
        }
      }

      if (!recognized && sentence.length > 20) {
        unparsed.push(sentence);
      }
    }

    return unparsed;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createNaturalLanguageParser(): NaturalLanguageParser {
  return new NaturalLanguageParser();
}

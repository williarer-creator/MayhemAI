# External Knowledge Sources

## To Be Integrated

### 0. Misumi - Configurable Components Catalog
- **URL:** https://uk.misumi-ec.com/
- **Content:** Massive catalog of configurable mechanical components
- **Useful for:**
  - Standard parts (fasteners, bearings, linear motion)
  - Configurable components (shafts, brackets, plates)
  - Part numbers and specifications
  - On-demand manufacturing (Meviy)
- **Status:** Web catalog, can query for standard parts
- **Priority:** High (needed for BOM and standard part selection)

### 0.1 Engineers Edge - Engineering Reference
- **URL:** https://www.engineersedge.com/
- **Content:** Engineering calculators, formulas, reference data
- **Useful for:**
  - Engineering formulas and calculations
  - Material properties
  - Thread specifications
  - Structural calculations
- **Status:** Web content
- **Priority:** High (reference for calculations)

### 0.2 Engineering Toolbox
- **URL:** https://www.engineeringtoolbox.com/
- **Content:** Comprehensive engineering reference
- **Useful for:**
  - Fluid mechanics (pipes, pumps, HVAC)
  - Material properties
  - Unit conversions
  - Standards reference
  - Thermodynamics
- **Status:** Web content
- **Priority:** High (especially for FLOW domain - pipes/ducts)

### 1. BE Group - Steel Builder's Handbook
- **URL:** https://www.begroup.fi/storage/.../BE-Group-Terasrakentajan-kasikirja-web.pdf
- **Content:** Finnish steel construction reference
- **Useful for:**
  - Steel section profiles (IPE, HEA, HEB, UNP, etc.)
  - Connection details
  - Load tables
  - Welding specifications
- **Status:** PDF needs parsing
- **Priority:** High (needed for STRUCTURE domain)

### 2. Sandvik Coromant - Machining Knowledge
- **URL:** https://www.sandvik.coromant.com/fi-fi/knowledge
- **Content:** Comprehensive machining reference
- **Topics covered:**
  - General Turning
  - Parting and Grooving
  - Threading
  - Milling
  - Drilling
  - Reaming
  - Boring
  - Formulas & Definitions
  - Material-specific guidance
- **Useful for:**
  - G-code generation parameters
  - Feeds and speeds calculations
  - Tool selection
  - Material machinability
- **Status:** Web content, can be fetched
- **Priority:** High (needed for manufacturing outputs)

## Integration Plan

1. **Steel sections database:**
   - Parse BE Group PDF for section properties
   - Create `materials/steel-sections.json`
   - Include: dimensions, weight, moment of inertia, section modulus

2. **Machining parameters database:**
   - Extract formulas from Sandvik
   - Create `manufacturing/machining-params.json`
   - Include: cutting speeds, feed rates, depth of cut by material

## Notes

- Both sources are in Finnish but technical data is language-agnostic
- Sandvik has English version available if needed
- Consider caching/local storage of external data for offline use

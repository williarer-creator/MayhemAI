# MayhemAI Restore Point

**Date**: 2026-02-24
**Phase**: 2 Complete
**Status**: All TypeScript compilation passing

## Project Overview

MayhemAI is an AI-powered engineering system that takes inputs (3D scans, pictures, measurements, requirements) and outputs manufacturable files (G-code, DXF, drawings, cut lists).

## Completed Phases

### Phase 1 (Previously Completed)
- Knowledge representation format (`src/knowledge/types.ts`)
- File inspection system
- Spatial reasoning primitives
- ACCESS domain (Stairs, Ladders, Ramps, Platforms)
- Manufacturing output generators

### Phase 2 (Just Completed)
- ENCLOSURE domain (Guards, Covers)
- FLOW domain (Pipes, Ducts)
- MECHANICAL domain (Brackets, Mounts)
- STRUCTURE domain (Steel Frames, Extrusion Frames)
- AI Orchestrator pipeline

## Project Structure

```
src/
├── knowledge/
│   ├── types.ts                    # Core type definitions
│   ├── index.ts                    # Knowledge module exports
│   └── domains/
│       ├── index.ts                # All domain exports
│       ├── access/
│       │   ├── index.ts
│       │   ├── stairs.ts
│       │   ├── ladders.ts
│       │   ├── ramps.ts
│       │   └── platforms.ts
│       ├── enclosure/
│       │   ├── index.ts
│       │   ├── guards.ts           # Machine guards, OSHA/ISO safety
│       │   └── covers.ts           # Enclosures, IP/NEMA ratings
│       ├── flow/
│       │   ├── index.ts
│       │   ├── pipes.ts            # Piping, ASME B31.3
│       │   └── ducts.ts            # HVAC ductwork, SMACNA
│       ├── mechanical/
│       │   ├── index.ts
│       │   ├── brackets.ts         # L-brackets, gussets, mounts
│       │   └── (mounts in brackets.ts)
│       └── structure/
│           ├── index.ts
│           └── frames.ts           # Steel frames, T-slot extrusions
├── orchestrator/
│   ├── index.ts                    # Orchestrator exports
│   ├── types.ts                    # Pipeline types
│   └── pipeline.ts                 # AI orchestration logic
├── inspection/                     # File inspection (Phase 1)
├── spatial/                        # Spatial reasoning (Phase 1)
└── output/                         # Manufacturing outputs (Phase 1)
```

## Knowledge Domains Summary

### ACCESS (Phase 1)
- **Stairs**: IBC/OSHA compliant, riser/tread calculations
- **Ladders**: Fixed/portable, cage requirements
- **Ramps**: ADA compliant, slope calculations
- **Platforms**: Load capacity, guardrail requirements

### ENCLOSURE (Phase 2)
- **Guards**: Machine safety guards per OSHA 1910.212, ISO 14120
  - Safety distance calculation per ISO 13857
  - Mesh/polycarbonate/solid panel options
  - Interlocked door support
- **Covers**: Equipment enclosures
  - IP ratings (IP20-IP68)
  - NEMA ratings
  - Sheet metal blank calculations

### FLOW (Phase 2)
- **Pipes**: Pressure piping systems
  - ASME B31.3 compliance
  - NPS sizing database (1/2" to 12")
  - Schedule wall thickness data
  - Orthogonal routing calculations
- **Ducts**: HVAC ductwork
  - SMACNA standards
  - CFM-based sizing
  - Rectangular/round options
  - Gauge selection

### MECHANICAL (Phase 2)
- **Brackets**: Mounting brackets
  - L-bracket, angle, gusset, T, Z types
  - AISC edge distance rules
  - Bend allowance (K-factor)
  - Load capacity calculations
- **Mounts**: Equipment mounting
  - Base plates with ACI 318 anchor design
  - Vibration isolator sizing
  - Seismic zone support

### STRUCTURE (Phase 2)
- **Steel Frames**: Structural steel
  - Portal/braced/rigid frame types
  - AISC 360 deflection/slenderness checks
  - Steel section database (W-beams, HSS, channels)
  - Cut list generation
- **Extrusion Frames**: T-slot aluminum
  - 20/30/40/45/80 series profiles
  - Corner bracket options
  - Component BOM generation

## AI Orchestrator

### Pipeline Stages
1. **Input**: Accept point clouds, images, measurements, requirements
2. **Analysis**: Extract features, dimensions, keywords
3. **Domain Routing**: Match to appropriate knowledge domain
4. **Element Selection**: Suggest elements with confidence scores
5. **Parameter Extraction**: Infer parameters from features
6. **Validation**: Check against rules and standards
7. **Design Generation**: Create element configurations
8. **Output Generation**: Produce manufacturing files

### Key Functions
- `createPipeline(projectId)` - Create new pipeline
- `pipeline.addInput(input)` - Add input data
- `pipeline.analyzeInputs()` - Run analysis
- `pipeline.validateSelection()` - Validate design
- `pipeline.generateOutputs(requests)` - Generate output files
- `pipeline.explainDecision(elementId)` - AI reasoning chain

## Standards Referenced

- **IBC** - International Building Code (stairs, guardrails)
- **OSHA 1910.212** - Machine guarding
- **OSHA 1910.25** - Industrial stairs
- **ISO 14120** - Guard construction
- **ISO 13857** - Safety distances
- **IEC 60529** - IP ratings
- **ASME B31.3** - Process piping
- **SMACNA** - Ductwork construction
- **AISC 360** - Steel construction
- **ACI 318** - Concrete anchoring

## Next Steps (Phase 3+)

1. **Output Generators**: Implement actual file generation
   - G-code for CNC
   - DXF flat patterns
   - PDF shop drawings
   - Cut lists / BOM

2. **Input Processors**: Implement input parsing
   - Point cloud processing
   - Image feature extraction (CV)
   - PDF drawing import

3. **Rule Engine**: Full expression evaluation
   - Parse rule expressions
   - Evaluate constraints
   - Generate warnings/errors

4. **UI Integration**: Connect to 3DMayhem CAD
   - Element visualization
   - Parameter editing
   - Real-time validation

## Build Commands

```bash
cd C:\Users\10C\Documents\Claude_projects\MayhemAI
npx tsc --noEmit    # Type check
npm run build       # Build (if configured)
```

## Git Status

- Branch: master
- Last commit: Phase 2 complete
- Files modified: Knowledge domains, orchestrator

---

*This restore point can be used to understand the project state and continue development.*

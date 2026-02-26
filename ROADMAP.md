# MayhemAI Roadmap

## Vision
AI-powered engineering system that reasons about spatial problems and generates buildable solutions with manufacturing-ready outputs.

**Core Capability:** Given two points (A and B) and an environment, the AI determines *what* goes between them, *how* to build it, and outputs files to manufacture it.

---

## The "Connect A to B" Problem

```
INPUT                          AI REASONING                     OUTPUT
─────────────────────────────────────────────────────────────────────────────
Point A (position, type)   →   What type of connection?     →   3D Geometry
Point B (position, type)   →   What are the constraints?    →   Manufacturing files
Environment (space, obs)   →   What material/method?        →   Assembly instructions
Constraints (codes, etc)   →   How to optimize?             →   Bill of materials
```

---

## Knowledge Domains (Alphabetical Priority)

### 1. ACCESS
Connecting humans/equipment between elevations or across spaces.

| Element | Knowledge Required |
|---------|-------------------|
| **Stairs** | Rise/run ratios, tread depth, landing requirements, handrail codes |
| **Ladders** | Rung spacing, cage requirements, rest platforms |
| **Ramps** | Max slope (ADA: 1:12), landings, edge protection |
| **Platforms** | Load capacity, guardrail height, toe boards |
| **Walkways** | Width requirements, grating types, support spans |

### 2. ENCLOSURE
Protecting, containing, or covering equipment/spaces.

| Element | Knowledge Required |
|---------|-------------------|
| **Guards** | Machine guarding standards, opening sizes, access panels |
| **Covers** | Weather protection, ventilation, access requirements |
| **Housings** | Equipment clearances, thermal management, IP ratings |
| **Panels** | Sheet metal gauges, bend radii, fastening methods |

### 3. FLOW
Routing fluids, gases, cables, or materials between points.

| Element | Knowledge Required |
|---------|-------------------|
| **Pipes** | Pressure ratings, bend radii, support spacing, fittings |
| **Ducts** | Airflow calculations, transitions, dampers |
| **Conduits** | Fill ratios, bend radii, pull boxes |
| **Cable trays** | Load capacity, fill percentage, routing rules |

### 4. MECHANICAL
Connecting moving or force-transmitting components.

| Element | Knowledge Required |
|---------|-------------------|
| **Linkages** | Kinematics, pivot points, range of motion |
| **Shafts** | Torque capacity, bearing spacing, alignment |
| **Couplings** | Misalignment tolerance, torque transmission |
| **Mounts** | Vibration isolation, load distribution, adjustment |

### 5. STRUCTURE
Supporting loads or spanning distances.

| Element | Knowledge Required |
|---------|-------------------|
| **Beams** | Span tables, deflection limits, connection types |
| **Frames** | Joint types, bracing, load paths |
| **Brackets** | Cantilever limits, fastener patterns, material selection |
| **Supports** | Base plate sizing, anchor patterns, load distribution |

---

## Development Phases

### Phase 1: Foundation ✓
**Goal:** Establish core architecture and first knowledge domain

- [x] Define knowledge representation format (rules, constraints, parameters)
- [x] Build spatial reasoning primitives (points, vectors, clearances, obstacles)
- [x] Implement first domain: **ACCESS - Stairs**
  - [x] Stair geometry generator (rise, run, width, landings)
  - [x] Code compliance checker (IBC, OSHA, ADA)
  - [x] Material options (steel, aluminum, wood)
  - [x] Connection to endpoints (floor plate, door threshold)
- [x] Basic manufacturing output (cut list, drawings)

### Phase 2: Access Complete ✓
**Goal:** Full ACCESS domain implementation

- [x] Ladders (fixed, caged, ship's ladder)
- [x] Ramps (straight, switchback, ADA-compliant)
- [x] Platforms (rectangular, L-shaped, multi-level)
- [x] Walkways (straight, with turns)
- [x] Handrails and guardrails (as supporting elements)
- [x] Combined solutions (platform + stairs + ladder)

### Phase 3: Structure Domain ✓
**Goal:** Structural support for ACCESS elements

- [x] Beams (I-beam, channel, tube) - Steel and wood beams with span/deflection calculations
- [x] Columns and posts - Steel and wood columns with buckling analysis (AISC/NDS)
- [x] Bracing systems - Diagonal and horizontal bracing with capacity checks
- [x] Base plates and anchors - Complete base plate design with anchor calculations (ACI 318)
- [x] Load calculation basics - Moment, shear, deflection, and interaction checks
- [x] Connection details (bolted, welded) - Shear tabs, angles, moment connections per AISC 360

### Phase 4: Enclosure Domain ✓
**Goal:** Guards and covers for safety/protection

- [x] Machine guards (fixed, interlocked) - Guards with ISO 13857 safety distances
- [x] Equipment covers - IP/NEMA rated enclosures with thermal management
- [x] Access panels and doors - Hinged/removable panels, fire-rated doors, ADA compliance
- [x] Windows and louvers - Viewports with glazing calcs, louvers with airflow calcs
- [x] Perimeter fencing - Modular fencing with posts, mesh panels, ISO 14120 compliance
- [x] Safety gates and interlocks - Swing/sliding gates with ISO 14119 interlocks
- [x] Sheet metal fabrication rules - K-factor, bend allowance, material database, gauge tables

### Phase 5: Flow Domain ✓
**Goal:** Routing pipes, ducts, cables

- [x] Pipe routing - ASME B31.1/B31.3 piping with sizes, schedules, fittings, routing
- [x] Duct routing and transitions - SMACNA ductwork with sizing, gauge selection, fittings
- [x] Cable tray layout - NEC/NEMA cable trays, conduit, fill calculations
- [x] Support and hanger placement - MSS SP-58 pipe supports, SMACNA duct hangers, NEMA tray supports

### Phase 6: Mechanical Domain ✓
**Goal:** Moving connections

- [x] Linkage design - Four-bar, slider-crank, bell crank with Grashof analysis
- [x] Shaft and coupling selection - Torsional stress, deflection, critical speed per ASME B106.1M
- [x] Motion analysis basics - Kinematic analysis, bearing selection (ISO 281), coupling selection (AGMA 9002)

### Phase 7: Geometry Generation
**Goal:** Connect knowledge to OpenCascade 3D models

- [ ] Geometry builder framework - Parametric model generation from element parameters
- [ ] Access geometry - Stairs, ladders, ramps, platforms as 3D solids
- [ ] Structure geometry - Beams, columns, connections as 3D assemblies
- [ ] Enclosure geometry - Panels, guards, fencing as sheet metal parts
- [ ] Flow geometry - Pipes, ducts, cable trays as routed solids
- [ ] Mechanical geometry - Shafts, linkages, brackets
- [ ] Assembly builder - Combine elements into complete assemblies
- [ ] Geometry validation - Clearance checks, interference detection

### Phase 8: Manufacturing Output
**Goal:** Generate production-ready files

- [ ] G-code post-processor framework - Configurable for different machines
- [ ] CNC mill output - 3-axis and 5-axis toolpaths
- [ ] CNC lathe output - Turning, facing, threading operations
- [ ] Laser/plasma cutting - DXF with nesting optimization
- [ ] Drawing generation - 2D views, dimensions, GD&T
- [ ] BOM generator - Part lists, cut lists, hardware schedules
- [ ] Assembly instructions - Step-by-step build sequences

### Phase 9: AI Reasoning Integration
**Goal:** Intelligent design decisions

- [ ] Claude API integration - Connect to Anthropic API for reasoning
- [ ] Domain selector - Classify problem type from requirements
- [ ] Natural language parser - Extract constraints from text descriptions
- [ ] Solution optimizer - Cost, weight, manufacturability trade-offs
- [ ] Design explainer - Generate reasoning documentation
- [ ] Code compliance checker - Validate against IBC, OSHA, ADA

### Phase 10: Input Processing
**Goal:** Accept real-world inputs

- [ ] Point cloud processor - LiDAR/photogrammetry to surfaces
- [ ] Image feature extraction - Detect walls, floors, obstacles from photos
- [ ] Environment modeler - Build spatial model from scans
- [ ] Constraint extractor - Identify attachment points, clearances
- [ ] Scan-to-CAD pipeline - Complete workflow from scan to geometry

### Phase 11: End-to-End Integration
**Goal:** Complete working system

- [ ] "Stairs Between Two Points" milestone - Full demo scenario
- [ ] Multi-domain solutions - Platform + stairs + handrail assemblies
- [ ] Interactive refinement - User feedback loop for design iteration
- [ ] Manufacturing validation - Verify outputs are production-ready
- [ ] Documentation generator - Complete engineering packages

---

## Technical Architecture

### Knowledge Base Structure

```
knowledge/
├── domains/
│   ├── access/
│   │   ├── stairs.json       # Parameters, rules, constraints
│   │   ├── ladders.json
│   │   ├── ramps.json
│   │   └── platforms.json
│   ├── structure/
│   ├── enclosure/
│   ├── flow/
│   └── mechanical/
├── materials/
│   ├── steel.json            # Properties, sizes, costs
│   ├── aluminum.json
│   └── wood.json
├── standards/
│   ├── ibc.json              # Building codes
│   ├── osha.json             # Safety standards
│   └── ada.json              # Accessibility
└── manufacturing/
    ├── cnc-mill.json         # Capabilities, tolerances
    ├── laser-cut.json
    └── welding.json
```

### Reasoning Pipeline

```
1. INPUT ANALYSIS
   └── Parse endpoints, environment, constraints

2. DOMAIN SELECTION
   └── Determine which knowledge domain applies
   └── (e.g., floor→door = ACCESS, intake→throttle = FLOW)

3. SOLUTION GENERATION
   └── Apply domain rules to generate candidates
   └── Filter by constraints
   └── Optimize (cost, material, simplicity)

4. GEOMETRY CREATION
   └── Generate 3D model using OpenCascade kernel
   └── Validate geometry (no intersections, proper clearances)

5. MANUFACTURING OUTPUT
   └── Select fabrication methods
   └── Generate files (G-code, DXF, drawings)
   └── Create BOM and assembly instructions
```

### AI Integration Points

| Component | AI Role |
|-----------|---------|
| **Input parsing** | NL understanding, image analysis |
| **Domain selection** | Classification based on endpoints |
| **Solution generation** | Candidate generation, optimization |
| **Constraint checking** | Validation, code compliance |
| **Output explanation** | Describe design decisions |

---

## First Milestone: "Stairs Between Two Points"

**Input:**
- Point A: Floor level (x, y, z)
- Point B: Door threshold (x, y, z) + door width
- Environment: Available space boundaries
- Constraints: Commercial building, indoor

**AI Reasoning:**
1. Calculate total rise (B.z - A.z)
2. Determine if straight run fits, or need landing/turn
3. Apply IBC stair rules (7" max rise, 11" min run)
4. Select stair width based on occupancy
5. Add handrails per code
6. Choose material (steel pan, concrete fill)

**Output:**
- 3D model of complete stair assembly
- Steel cut list (stringers, pans, handrails)
- Fabrication drawings
- Assembly sequence
- Anchor bolt layout

---

## Success Metrics

| Metric | Target |
|--------|--------|
| **Knowledge coverage** | 5 domains, 20+ element types |
| **Code compliance** | 100% for supported standards |
| **Solution validity** | All outputs buildable without modification |
| **Manufacturing ready** | Direct to fabrication, no manual CAD work |

---

## Open Questions

1. **Scanning input:** How do we get environment data? (Manual entry first, then LiDAR/photogrammetry later?)
2. **AI model:** Local vs API? (Claude API for reasoning, local for geometry?)
3. **Standards database:** Build our own or integrate existing? (IBC, OSHA, etc.)
4. **Validation:** How to verify solutions before manufacturing? (Simulation? Human review?)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2024-XX-XX | Initial roadmap |

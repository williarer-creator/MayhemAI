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

### Phase 1: Foundation
**Goal:** Establish core architecture and first knowledge domain

- [ ] Define knowledge representation format (rules, constraints, parameters)
- [ ] Build spatial reasoning primitives (points, vectors, clearances, obstacles)
- [ ] Implement first domain: **ACCESS - Stairs**
  - [ ] Stair geometry generator (rise, run, width, landings)
  - [ ] Code compliance checker (IBC, OSHA, ADA)
  - [ ] Material options (steel, aluminum, wood)
  - [ ] Connection to endpoints (floor plate, door threshold)
- [ ] Basic manufacturing output (cut list, drawings)

### Phase 2: Access Complete
**Goal:** Full ACCESS domain implementation

- [ ] Ladders (fixed, caged, ship's ladder)
- [ ] Ramps (straight, switchback)
- [ ] Platforms (rectangular, L-shaped, multi-level)
- [ ] Walkways (straight, with turns)
- [ ] Handrails and guardrails (as supporting elements)
- [ ] Combined solutions (platform + stairs + ladder)

### Phase 3: Structure Domain ✓
**Goal:** Structural support for ACCESS elements

- [x] Beams (I-beam, channel, tube) - Steel and wood beams with span/deflection calculations
- [x] Columns and posts - Steel and wood columns with buckling analysis (AISC/NDS)
- [x] Bracing systems - Diagonal and horizontal bracing with capacity checks
- [x] Base plates and anchors - Complete base plate design with anchor calculations (ACI 318)
- [x] Load calculation basics - Moment, shear, deflection, and interaction checks
- [x] Connection details (bolted, welded) - Shear tabs, angles, moment connections per AISC 360

### Phase 4: Enclosure Domain
**Goal:** Guards and covers for safety/protection

- [ ] Machine guards (fixed, interlocked)
- [ ] Equipment covers
- [ ] Access panels and doors
- [ ] Sheet metal fabrication rules

### Phase 5: Flow Domain
**Goal:** Routing pipes, ducts, cables

- [ ] Pipe routing with obstacle avoidance
- [ ] Duct routing and transitions
- [ ] Cable tray layout
- [ ] Support and hanger placement

### Phase 6: Mechanical Domain
**Goal:** Moving connections

- [ ] Linkage design
- [ ] Shaft and coupling selection
- [ ] Motion analysis basics

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

# MayhemAI - Project Context for AI Assistants

## Project Overview
MayhemAI is an **AI-powered engineering system** that transforms requirements, scans, and images into production-ready manufacturing files. Think: describe what you need, get G-code, DXF, and drawings.

**Sister project to 3DMayhem** - shares the OpenCascade.js geometry kernel.

## Vision
Input: Requirements + Environment scan + Reference images
Output: Complete manufacturing package (CNC programs, laser cut files, assembly drawings)

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **3D Rendering**: Three.js + React Three Fiber + Drei
- **State Management**: Zustand
- **Geometry Kernel**: OpenCascade.js (WASM) - shared with 3DMayhem
- **AI Integration**: TBD (Claude API, vision models, etc.)

## Architecture

```
src/
├── core/               # Geometry kernel (shared with 3DMayhem)
│   ├── kernel.ts       # OpenCascade wrapper
│   └── coordinates.ts  # Coordinate system management
├── types/              # TypeScript type definitions
├── ai/                 # AI processing modules
│   ├── vision/         # Image & scan interpretation
│   ├── reasoning/      # Engineering decision making
│   ├── generation/     # 3D geometry generation
│   └── orchestrator/   # Multi-step pipeline control
├── inputs/             # Input processing
│   ├── scan-processor/ # Point cloud → solid geometry
│   ├── image-to-3d/    # Reference images → features
│   └── requirements/   # NL specs → constraints
└── outputs/            # Manufacturing outputs
    ├── cnc-mill/       # G-code + setup sheets
    ├── cnc-lathe/      # G-code + tooling
    ├── laser-cut/      # DXF + nesting
    └── drawings/       # 2D prints + BOMs

public/
├── opencascade/        # OpenCascade.js WASM files
└── geometry.worker.js  # Web Worker for CAD operations
```

## Key Components

### AI Pipeline
1. **Vision**: Process scanned environments and reference images
2. **Reasoning**: Apply engineering rules, DFM analysis, material selection
3. **Generation**: Create 3D geometry using OpenCascade kernel
4. **Output**: Generate manufacturing-ready files

### Shared Core (from 3DMayhem)
- `kernel.ts`: OpenCascade.js wrapper with async operations
- `coordinates.ts`: Machine-type coordinate systems (mill, lathe, 3D printer)
- `geometry.worker.js`: Web Worker for heavy CAD operations

## Development Commands
```bash
npm install    # Install dependencies
npm run dev    # Start dev server (http://localhost:5174)
npm run build  # Production build
npm run test   # Run tests
```

## Manufacturing Outputs (Planned)

### CNC Mill
- G-code generation
- Tool path optimization
- Setup sheets with workholding

### CNC Lathe
- G-code for turning operations
- Tool selection
- Facing/boring/threading

### Laser Cutting
- DXF export
- Nesting optimization
- Material utilization

### Drawings
- 2D projections
- GD&T annotations
- Bill of materials

## Relationship to 3DMayhem
- **3DMayhem**: Manual CAD (engineer designs interactively)
- **MayhemAI**: AI-assisted CAD (describe → generate → produce)
- Both share the OpenCascade geometry kernel
- MayhemAI can output to 3DMayhem for manual refinement

## TODO
- [ ] AI orchestration pipeline
- [ ] Point cloud processing (scan → geometry)
- [ ] Image-to-3D feature extraction
- [ ] G-code post-processor framework
- [ ] DXF export with nesting
- [ ] Drawing generation system
- [ ] Integration with 3DMayhem for human-in-loop editing

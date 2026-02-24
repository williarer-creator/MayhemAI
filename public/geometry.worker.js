/**
 * Geometry Worker - Plain JS version
 * Heavy CAD operations run here, OFF the main thread
 */

let oc = null;
let isInitialized = false;

// Local path for OpenCascade files (served from public folder)
const OC_PATH = '/opencascade';

// Shape registry - stores OCCT shapes by ID for boolean operations
const shapeRegistry = new Map();
let shapeIdCounter = 0;

function registerShape(shape) {
  const id = `shape_${++shapeIdCounter}`;
  shapeRegistry.set(id, shape);
  return id;
}

function getShape(id) {
  return shapeRegistry.get(id);
}

function deleteShape(id) {
  shapeRegistry.delete(id);
}

async function initializeKernel() {
  if (isInitialized) return;

  try {
    console.log('[GeometryWorker] Loading OpenCascade.js from local files...');

    const jsUrl = `${OC_PATH}/opencascade.full.js`;
    console.log('[GeometryWorker] Fetching:', jsUrl);

    const response = await fetch(jsUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch OpenCascade.js: ' + response.status);
    }

    let jsText = await response.text();
    console.log('[GeometryWorker] Downloaded', (jsText.length / 1024 / 1024).toFixed(2), 'MB');

    // Remove ES module export and make it assign to global
    // The file ends with: export default Module;
    // We replace it to expose Module globally
    jsText = jsText.replace('export default Module;', 'self.opencascade = Module;');

    // Evaluate in worker context
    (0, eval)(jsText);

    console.log('[GeometryWorker] JS loaded, checking for opencascade function...');

    if (typeof self.opencascade === 'undefined') {
      throw new Error('opencascade not defined after eval');
    }

    console.log('[GeometryWorker] Initializing WASM...');

    oc = await self.opencascade({
      locateFile: function(filename) {
        console.log('[GeometryWorker] locateFile:', filename);
        return `${OC_PATH}/${filename}`;
      },
    });

    isInitialized = true;
    console.log('[GeometryWorker] OpenCascade initialized successfully!');

  } catch (error) {
    console.error('[GeometryWorker] Failed to initialize:', error);
    throw error;
  }
}

function createBox(width, height, depth, position = { x: 0, y: 0, z: 0 }) {
  if (!oc) throw new Error('Kernel not initialized');

  console.log('[GeometryWorker] Creating box:', width, height, depth, 'at', position);

  // Create box at origin first
  const box = new oc.BRepPrimAPI_MakeBox_2(width, height, depth);
  let shape = box.Shape();

  // Apply translation if needed
  if (position.x !== 0 || position.y !== 0 || position.z !== 0) {
    const transform = new oc.gp_Trsf_1();
    transform.SetTranslation_1(new oc.gp_Vec_4(position.x, position.y, position.z));
    const transformer = new oc.BRepBuilderAPI_Transform_2(shape, transform, true);
    shape = transformer.Shape();
  }

  const shapeId = registerShape(shape);
  const mesh = meshShape(shape);

  return { shapeId: shapeId, mesh: mesh };
}

function createCylinder(radius, height, position = { x: 0, y: 0, z: 0 }) {
  if (!oc) throw new Error('Kernel not initialized');

  console.log('[GeometryWorker] Creating cylinder:', radius, height, 'at', position);

  const cylinder = new oc.BRepPrimAPI_MakeCylinder_1(radius, height);
  let shape = cylinder.Shape();

  // Apply translation if needed
  if (position.x !== 0 || position.y !== 0 || position.z !== 0) {
    const transform = new oc.gp_Trsf_1();
    transform.SetTranslation_1(new oc.gp_Vec_4(position.x, position.y, position.z));
    const transformer = new oc.BRepBuilderAPI_Transform_2(shape, transform, true);
    shape = transformer.Shape();
  }

  const shapeId = registerShape(shape);
  const mesh = meshShape(shape);

  return { shapeId: shapeId, mesh: mesh };
}

function createSphere(radius, position = { x: 0, y: 0, z: 0 }) {
  if (!oc) throw new Error('Kernel not initialized');

  console.log('[GeometryWorker] Creating sphere:', radius, 'at', position);

  const center = new oc.gp_Pnt_3(position.x, position.y, position.z);
  const sphere = new oc.BRepPrimAPI_MakeSphere_2(center, radius);
  const shape = sphere.Shape();

  const shapeId = registerShape(shape);
  const mesh = meshShape(shape);

  return { shapeId: shapeId, mesh: mesh };
}

function createCone(radius, height, position = { x: 0, y: 0, z: 0 }) {
  if (!oc) throw new Error('Kernel not initialized');

  console.log('[GeometryWorker] Creating cone:', radius, height, 'at', position);

  // Create cone with bottom radius and top radius of 0 (pointed cone)
  const cone = new oc.BRepPrimAPI_MakeCone_1(radius, 0, height);
  let shape = cone.Shape();

  // Apply translation if needed
  if (position.x !== 0 || position.y !== 0 || position.z !== 0) {
    const transform = new oc.gp_Trsf_1();
    transform.SetTranslation_1(new oc.gp_Vec_4(position.x, position.y, position.z));
    const transformer = new oc.BRepBuilderAPI_Transform_2(shape, transform, true);
    shape = transformer.Shape();
  }

  const shapeId = registerShape(shape);
  const mesh = meshShape(shape);

  return { shapeId: shapeId, mesh: mesh };
}

function createTorus(majorRadius, minorRadius, position = { x: 0, y: 0, z: 0 }) {
  if (!oc) throw new Error('Kernel not initialized');

  console.log('[GeometryWorker] Creating torus:', majorRadius, minorRadius, 'at', position);

  // Create torus at origin
  const torus = new oc.BRepPrimAPI_MakeTorus_1(majorRadius, minorRadius);
  let shape = torus.Shape();

  // Apply translation if needed
  if (position.x !== 0 || position.y !== 0 || position.z !== 0) {
    const transform = new oc.gp_Trsf_1();
    transform.SetTranslation_1(new oc.gp_Vec_4(position.x, position.y, position.z));
    const transformer = new oc.BRepBuilderAPI_Transform_2(shape, transform, true);
    shape = transformer.Shape();
  }

  const shapeId = registerShape(shape);
  const mesh = meshShape(shape);

  return { shapeId: shapeId, mesh: mesh };
}

/**
 * Extrude a 2D profile along Z axis
 * @param {Array<{x: number, y: number}>} profile - 2D points defining the profile
 * @param {number} height - Extrusion height
 * @param {string} plane - Sketch plane: 'XY', 'XZ', 'YZ'
 * @param {number} planeOffset - Offset of the sketch plane
 */
function extrudeProfile(profile, height, plane, planeOffset) {
  if (!oc) throw new Error('Kernel not initialized');

  console.log('[GeometryWorker] Extruding profile with', profile.length, 'points, height:', height);

  if (profile.length < 3) {
    throw new Error('Profile must have at least 3 points');
  }

  // Create wire from profile points
  const makeWire = new oc.BRepBuilderAPI_MakeWire_1();

  for (let i = 0; i < profile.length; i++) {
    const p1 = profile[i];
    const p2 = profile[(i + 1) % profile.length];

    // Convert 2D points to 3D based on plane
    let start3D, end3D;
    if (plane === 'XY') {
      start3D = new oc.gp_Pnt_3(p1.x, p1.y, planeOffset);
      end3D = new oc.gp_Pnt_3(p2.x, p2.y, planeOffset);
    } else if (plane === 'XZ') {
      start3D = new oc.gp_Pnt_3(p1.x, planeOffset, p1.y);
      end3D = new oc.gp_Pnt_3(p2.x, planeOffset, p2.y);
    } else { // YZ
      start3D = new oc.gp_Pnt_3(planeOffset, p1.x, p1.y);
      end3D = new oc.gp_Pnt_3(planeOffset, p2.x, p2.y);
    }

    const edge = new oc.BRepBuilderAPI_MakeEdge_3(start3D, end3D).Edge();
    makeWire.Add_1(edge);
  }

  const wire = makeWire.Wire();

  // Create face from wire
  const makeFace = new oc.BRepBuilderAPI_MakeFace_15(wire, true);
  const face = makeFace.Face();

  // Create extrusion direction vector based on plane
  let extrudeDir;
  if (plane === 'XY') {
    extrudeDir = new oc.gp_Vec_4(0, 0, height);
  } else if (plane === 'XZ') {
    extrudeDir = new oc.gp_Vec_4(0, height, 0);
  } else { // YZ
    extrudeDir = new oc.gp_Vec_4(height, 0, 0);
  }

  // Extrude the face
  const prism = new oc.BRepPrimAPI_MakePrism_1(face, extrudeDir, false, true);
  const shape = prism.Shape();

  const shapeId = registerShape(shape);
  const mesh = meshShape(shape);

  return { shapeId: shapeId, mesh: mesh };
}

/**
 * Extrude a rectangle
 */
function extrudeRectangle(corner1, corner2, height, plane, planeOffset) {
  const profile = [
    { x: corner1.x, y: corner1.y },
    { x: corner2.x, y: corner1.y },
    { x: corner2.x, y: corner2.y },
    { x: corner1.x, y: corner2.y },
  ];
  return extrudeProfile(profile, height, plane, planeOffset);
}

/**
 * Extrude a circle
 */
function extrudeCircle(center, radius, height, plane, planeOffset) {
  if (!oc) throw new Error('Kernel not initialized');

  console.log('[GeometryWorker] Extruding circle, radius:', radius, 'height:', height);

  // Create axis for circle based on plane
  let origin, normal;
  if (plane === 'XY') {
    origin = new oc.gp_Pnt_3(center.x, center.y, planeOffset);
    normal = new oc.gp_Dir_4(0, 0, 1);
  } else if (plane === 'XZ') {
    origin = new oc.gp_Pnt_3(center.x, planeOffset, center.y);
    normal = new oc.gp_Dir_4(0, 1, 0);
  } else { // YZ
    origin = new oc.gp_Pnt_3(planeOffset, center.x, center.y);
    normal = new oc.gp_Dir_4(1, 0, 0);
  }

  const axis = new oc.gp_Ax2_3(origin, normal);

  // Create circle
  const circle = new oc.gp_Circ_2(axis, radius);
  const edge = new oc.BRepBuilderAPI_MakeEdge_8(circle).Edge();
  const wire = new oc.BRepBuilderAPI_MakeWire_2(edge).Wire();
  const face = new oc.BRepBuilderAPI_MakeFace_15(wire, true).Face();

  // Create extrusion direction
  let extrudeDir;
  if (plane === 'XY') {
    extrudeDir = new oc.gp_Vec_4(0, 0, height);
  } else if (plane === 'XZ') {
    extrudeDir = new oc.gp_Vec_4(0, height, 0);
  } else { // YZ
    extrudeDir = new oc.gp_Vec_4(height, 0, 0);
  }

  const prism = new oc.BRepPrimAPI_MakePrism_1(face, extrudeDir, false, true);
  const shape = prism.Shape();

  const shapeId = registerShape(shape);
  const mesh = meshShape(shape);

  return { shapeId: shapeId, mesh: mesh };
}

/**
 * Revolve a rectangle profile around an axis
 */
function revolveRectangle(corner1, corner2, angle, plane, planeOffset, axis = 'Y') {
  if (!oc) throw new Error('Kernel not initialized');

  console.log('[GeometryWorker] Revolving rectangle, angle:', angle, 'axis:', axis);

  // Create profile points
  const profile = [
    { x: corner1.x, y: corner1.y },
    { x: corner2.x, y: corner1.y },
    { x: corner2.x, y: corner2.y },
    { x: corner1.x, y: corner2.y },
  ];

  // Create wire from profile
  const makeWire = new oc.BRepBuilderAPI_MakeWire_1();

  for (let i = 0; i < profile.length; i++) {
    const p1 = profile[i];
    const p2 = profile[(i + 1) % profile.length];

    // Convert 2D points to 3D based on plane
    let start3D, end3D;
    if (plane === 'XY') {
      start3D = new oc.gp_Pnt_3(p1.x, p1.y, planeOffset);
      end3D = new oc.gp_Pnt_3(p2.x, p2.y, planeOffset);
    } else if (plane === 'XZ') {
      start3D = new oc.gp_Pnt_3(p1.x, planeOffset, p1.y);
      end3D = new oc.gp_Pnt_3(p2.x, planeOffset, p2.y);
    } else { // YZ
      start3D = new oc.gp_Pnt_3(planeOffset, p1.x, p1.y);
      end3D = new oc.gp_Pnt_3(planeOffset, p2.x, p2.y);
    }

    const edge = new oc.BRepBuilderAPI_MakeEdge_3(start3D, end3D).Edge();
    makeWire.Add_1(edge);
  }

  const wire = makeWire.Wire();
  const face = new oc.BRepBuilderAPI_MakeFace_15(wire, true).Face();

  // Create revolution axis based on user selection
  let axisDir;
  if (axis === 'X') {
    axisDir = new oc.gp_Dir_4(1, 0, 0);
  } else if (axis === 'Y') {
    axisDir = new oc.gp_Dir_4(0, 1, 0);
  } else { // Z
    axisDir = new oc.gp_Dir_4(0, 0, 1);
  }

  // Axis passes through origin
  const axisOrigin = new oc.gp_Pnt_3(0, 0, 0);
  const revolveAxis = new oc.gp_Ax1_2(axisOrigin, axisDir);

  // Convert angle to radians
  const angleRad = (angle * Math.PI) / 180;

  // Create revolution
  const revolve = new oc.BRepPrimAPI_MakeRevol_1(face, revolveAxis, angleRad, true);
  const shape = revolve.Shape();

  const shapeId = registerShape(shape);
  const mesh = meshShape(shape);

  return { shapeId: shapeId, mesh: mesh };
}

// ============================================================================
// BOOLEAN OPERATIONS
// ============================================================================

/**
 * Boolean Union (Fuse) - Combines two shapes
 */
function booleanUnion(shapeId1, shapeId2) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape1 = getShape(shapeId1);
  const shape2 = getShape(shapeId2);

  if (!shape1 || !shape2) {
    throw new Error('Shape not found: ' + (!shape1 ? shapeId1 : shapeId2));
  }

  console.log('[GeometryWorker] Boolean Union:', shapeId1, '+', shapeId2);

  const fuse = new oc.BRepAlgoAPI_Fuse_3(shape1, shape2, new oc.Message_ProgressRange_1());
  fuse.Build(new oc.Message_ProgressRange_1());

  if (!fuse.IsDone()) {
    throw new Error('Boolean union failed');
  }

  const resultShape = fuse.Shape();
  const shapeId = registerShape(resultShape);
  const mesh = meshShape(resultShape);

  // Optionally delete the source shapes
  // deleteShape(shapeId1);
  // deleteShape(shapeId2);

  return { shapeId: shapeId, mesh: mesh };
}

/**
 * Boolean Subtract (Cut) - Subtracts shape2 from shape1
 */
function booleanSubtract(shapeId1, shapeId2) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape1 = getShape(shapeId1);
  const shape2 = getShape(shapeId2);

  if (!shape1 || !shape2) {
    throw new Error('Shape not found: ' + (!shape1 ? shapeId1 : shapeId2));
  }

  console.log('[GeometryWorker] Boolean Subtract:', shapeId1, '-', shapeId2);

  const cut = new oc.BRepAlgoAPI_Cut_3(shape1, shape2, new oc.Message_ProgressRange_1());
  cut.Build(new oc.Message_ProgressRange_1());

  if (!cut.IsDone()) {
    throw new Error('Boolean subtract failed');
  }

  const resultShape = cut.Shape();
  const shapeId = registerShape(resultShape);
  const mesh = meshShape(resultShape);

  return { shapeId: shapeId, mesh: mesh };
}

/**
 * Boolean Intersect (Common) - Keeps only the common volume
 */
function booleanIntersect(shapeId1, shapeId2) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape1 = getShape(shapeId1);
  const shape2 = getShape(shapeId2);

  if (!shape1 || !shape2) {
    throw new Error('Shape not found: ' + (!shape1 ? shapeId1 : shapeId2));
  }

  console.log('[GeometryWorker] Boolean Intersect:', shapeId1, '∩', shapeId2);

  const common = new oc.BRepAlgoAPI_Common_3(shape1, shape2, new oc.Message_ProgressRange_1());
  common.Build(new oc.Message_ProgressRange_1());

  if (!common.IsDone()) {
    throw new Error('Boolean intersect failed');
  }

  const resultShape = common.Shape();
  const shapeId = registerShape(resultShape);
  const mesh = meshShape(resultShape);

  return { shapeId: shapeId, mesh: mesh };
}

// ============================================================================
// FILLET AND CHAMFER OPERATIONS
// ============================================================================

/**
 * Apply fillet (rounded edges) to all edges of a shape
 * @param {string} shapeId - ID of the shape to fillet
 * @param {number} radius - Fillet radius
 */
function filletAllEdges(shapeId, radius) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  console.log('[GeometryWorker] Filleting all edges with radius:', radius);

  // Create fillet maker
  const fillet = new oc.BRepFilletAPI_MakeFillet(shape, oc.ChFi3d_FilletShape.ChFi3d_Rational);

  // Iterate over all edges and add them to the fillet
  const edgeExplorer = new oc.TopExp_Explorer_2(
    shape,
    oc.TopAbs_ShapeEnum.TopAbs_EDGE,
    oc.TopAbs_ShapeEnum.TopAbs_SHAPE
  );

  let edgeCount = 0;
  while (edgeExplorer.More()) {
    const edge = oc.TopoDS.Edge_1(edgeExplorer.Current());
    fillet.Add_2(radius, edge);
    edgeCount++;
    edgeExplorer.Next();
  }

  console.log('[GeometryWorker] Added', edgeCount, 'edges to fillet');

  if (edgeCount === 0) {
    throw new Error('No edges found to fillet');
  }

  fillet.Build(new oc.Message_ProgressRange_1());

  if (!fillet.IsDone()) {
    throw new Error('Fillet operation failed - radius may be too large');
  }

  const resultShape = fillet.Shape();
  const newShapeId = registerShape(resultShape);
  const mesh = meshShape(resultShape);

  return { shapeId: newShapeId, mesh: mesh };
}

/**
 * Apply chamfer (beveled edges) to all edges of a shape
 * Uses symmetric chamfer (equal distance on both sides)
 * @param {string} shapeId - ID of the shape to chamfer
 * @param {number} distance - Chamfer distance
 */
function chamferAllEdges(shapeId, distance) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  console.log('[GeometryWorker] Chamfering all edges with distance:', distance);

  // Create chamfer maker
  const chamfer = new oc.BRepFilletAPI_MakeChamfer(shape);

  let edgeCount = 0;
  let faceCount = 0;

  // Explore faces, then edges of each face
  const faceExplorer = new oc.TopExp_Explorer_2(
    shape,
    oc.TopAbs_ShapeEnum.TopAbs_FACE,
    oc.TopAbs_ShapeEnum.TopAbs_SHAPE
  );

  while (faceExplorer.More()) {
    const face = oc.TopoDS.Face_1(faceExplorer.Current());
    faceCount++;

    // Explore edges of this face
    const edgeExplorer = new oc.TopExp_Explorer_2(
      face,
      oc.TopAbs_ShapeEnum.TopAbs_EDGE,
      oc.TopAbs_ShapeEnum.TopAbs_SHAPE
    );

    while (edgeExplorer.More()) {
      const edge = oc.TopoDS.Edge_1(edgeExplorer.Current());

      try {
        // Add_3 takes (Dis1, Dis2, Edge, Face) - use symmetric chamfer
        chamfer.Add_3(distance, distance, edge, face);
        edgeCount++;
      } catch (e) {
        // Likely duplicate edge, ignore
      }
      edgeExplorer.Next();
    }
    faceExplorer.Next();
  }

  console.log('[GeometryWorker] Explored', faceCount, 'faces, added', edgeCount, 'edge-face pairs');

  if (edgeCount === 0) {
    throw new Error('No edges found to chamfer');
  }

  chamfer.Build(new oc.Message_ProgressRange_1());

  if (!chamfer.IsDone()) {
    throw new Error('Chamfer operation failed - distance may be too large');
  }

  const resultShape = chamfer.Shape();
  const newShapeId = registerShape(resultShape);
  const mesh = meshShape(resultShape);

  return { shapeId: newShapeId, mesh: mesh };
}

/**
 * Apply fillet to specific edges (by index)
 * @param {string} shapeId - ID of the shape
 * @param {number} radius - Fillet radius
 * @param {number[]} edgeIndices - Array of edge indices to fillet (1-based)
 */
function filletEdges(shapeId, radius, edgeIndices) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  console.log('[GeometryWorker] Filleting edges:', edgeIndices, 'with radius:', radius);

  // Collect all edges
  const edges = [];
  const edgeExplorer = new oc.TopExp_Explorer_2(
    shape,
    oc.TopAbs_ShapeEnum.TopAbs_EDGE,
    oc.TopAbs_ShapeEnum.TopAbs_SHAPE
  );

  while (edgeExplorer.More()) {
    edges.push(oc.TopoDS.Edge_1(edgeExplorer.Current()));
    edgeExplorer.Next();
  }

  // Create fillet maker
  const fillet = new oc.BRepFilletAPI_MakeFillet(shape, oc.ChFi3d_FilletShape.ChFi3d_Rational);

  // Add specified edges
  for (const idx of edgeIndices) {
    if (idx > 0 && idx <= edges.length) {
      fillet.Add_2(radius, edges[idx - 1]);
    }
  }

  fillet.Build(new oc.Message_ProgressRange_1());

  if (!fillet.IsDone()) {
    throw new Error('Fillet operation failed');
  }

  const resultShape = fillet.Shape();
  const newShapeId = registerShape(resultShape);
  const mesh = meshShape(resultShape);

  return { shapeId: newShapeId, mesh: mesh };
}

// ============================================================================
// SHELL OPERATION
// ============================================================================

/**
 * Shell operation - hollows out a solid with given wall thickness
 * @param {string} shapeId - ID of the shape to shell
 * @param {number} thickness - Wall thickness (positive = inward, negative = outward)
 * @param {number[]} faceIndices - Optional face indices to remove (open faces)
 */
function shellShape(shapeId, thickness, faceIndices = []) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  console.log('[GeometryWorker] Shelling shape with thickness:', thickness);

  // Create shell maker
  const shellMaker = new oc.BRepOffsetAPI_MakeThickSolid();

  // Collect faces to remove (if any)
  const facesToRemove = new oc.TopTools_ListOfShape_1();

  if (faceIndices.length > 0) {
    // Get all faces
    const faceMap = new oc.TopTools_IndexedMapOfShape_1();
    oc.TopExp.MapShapes_1(shape, oc.TopAbs_ShapeEnum.TopAbs_FACE, faceMap);

    for (const idx of faceIndices) {
      if (idx > 0 && idx <= faceMap.Extent()) {
        facesToRemove.Append_1(faceMap.FindKey(idx));
      }
    }
  }

  // Build the shell
  shellMaker.MakeThickSolidByJoin(
    shape,
    facesToRemove,
    thickness,
    1e-6,  // tolerance
    oc.BRepOffset_Mode.BRepOffset_Skin,
    false, // intersection
    false, // self-intersection
    oc.GeomAbs_JoinType.GeomAbs_Arc,
    false, // remove internal edges
    new oc.Message_ProgressRange_1()
  );

  if (!shellMaker.IsDone()) {
    throw new Error('Shell operation failed - thickness may be too large');
  }

  const resultShape = shellMaker.Shape();
  const newShapeId = registerShape(resultShape);
  const mesh = meshShape(resultShape);

  return { shapeId: newShapeId, mesh: mesh };
}

// ============================================================================
// DRAFT OPERATION
// ============================================================================

/**
 * Apply draft angle to a shape (for injection molding)
 * This applies a taper to vertical faces relative to a pulling direction
 * @param {string} shapeId - ID of the shape to draft
 * @param {number} angle - Draft angle in degrees
 * @param {string} direction - Direction axis ('X', 'Y', or 'Z')
 */
function draftShape(shapeId, angle, direction = 'Z') {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  console.log('[GeometryWorker] Applying draft angle:', angle, 'degrees in', direction, 'direction');

  // Convert angle to radians
  const angleRad = angle * Math.PI / 180;

  // Create draft angle maker
  const draftMaker = new oc.BRepOffsetAPI_DraftAngle(shape);

  // Set up direction for draft
  let dir;
  switch (direction) {
    case 'X':
      dir = new oc.gp_Dir_4(1, 0, 0);
      break;
    case 'Y':
      dir = new oc.gp_Dir_4(0, 1, 0);
      break;
    case 'Z':
    default:
      dir = new oc.gp_Dir_4(0, 0, 1);
      break;
  }

  // Neutral plane at origin perpendicular to direction
  const neutralPln = new oc.gp_Pln_3(new oc.gp_Pnt_3(0, 0, 0), dir);

  // Explore all faces and add draft to suitable ones
  const faceExplorer = new oc.TopExp_Explorer_2(
    shape,
    oc.TopAbs_ShapeEnum.TopAbs_FACE,
    oc.TopAbs_ShapeEnum.TopAbs_SHAPE
  );

  let faceCount = 0;
  while (faceExplorer.More()) {
    const face = oc.TopoDS.Face_1(faceExplorer.Current());

    try {
      // Add draft to this face
      draftMaker.Add(face, dir, angleRad, neutralPln, true);
      faceCount++;
    } catch (e) {
      // Some faces may not be suitable for draft, skip them
      console.log('[GeometryWorker] Skipping face for draft');
    }
    faceExplorer.Next();
  }

  console.log('[GeometryWorker] Added draft to', faceCount, 'faces');

  if (faceCount === 0) {
    throw new Error('No faces suitable for draft operation');
  }

  draftMaker.Build(new oc.Message_ProgressRange_1());

  if (!draftMaker.IsDone()) {
    throw new Error('Draft operation failed - angle may be too large');
  }

  const resultShape = draftMaker.Shape();
  const newShapeId = registerShape(resultShape);
  const mesh = meshShape(resultShape);

  return { shapeId: newShapeId, mesh: mesh };
}

// ============================================================================
// HOLE WIZARD
// ============================================================================

/**
 * Create a hole in a body (using boolean subtraction with cylinder)
 * @param {string} shapeId - ID of the body to create hole in
 * @param {number} diameter - Hole diameter
 * @param {number} depth - Hole depth (0 = through all)
 * @param {Object} position - Position of hole center {x, y, z}
 * @param {string} direction - Direction of hole ('X', 'Y', or 'Z')
 */
function createHole(shapeId, diameter, depth, position = { x: 0, y: 0, z: 0 }, direction = 'Z') {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  console.log('[GeometryWorker] Creating hole: diameter =', diameter, ', depth =', depth, ', at', position);

  const radius = diameter / 2;

  // Determine hole cylinder orientation based on direction
  let axis;
  let holeHeight = depth;

  // If depth is 0 (through all), calculate based on bounding box
  if (depth <= 0) {
    const bndBox = new oc.Bnd_Box_1();
    const calculator = new oc.BRepBndLib();
    calculator.Add(shape, bndBox, false);

    const min = bndBox.CornerMin();
    const max = bndBox.CornerMax();

    // Use the maximum dimension in the hole direction
    switch (direction) {
      case 'X':
        holeHeight = (max.X() - min.X()) + 10;
        break;
      case 'Y':
        holeHeight = (max.Y() - min.Y()) + 10;
        break;
      case 'Z':
      default:
        holeHeight = (max.Z() - min.Z()) + 10;
        break;
    }
  }

  // Create the hole cylinder
  let holeCylinder;
  switch (direction) {
    case 'X':
      axis = new oc.gp_Ax2_3(
        new oc.gp_Pnt_3(position.x - holeHeight / 2, position.y, position.z),
        new oc.gp_Dir_4(1, 0, 0)
      );
      break;
    case 'Y':
      axis = new oc.gp_Ax2_3(
        new oc.gp_Pnt_3(position.x, position.y - holeHeight / 2, position.z),
        new oc.gp_Dir_4(0, 1, 0)
      );
      break;
    case 'Z':
    default:
      axis = new oc.gp_Ax2_3(
        new oc.gp_Pnt_3(position.x, position.y, position.z - holeHeight / 2),
        new oc.gp_Dir_4(0, 0, 1)
      );
      break;
  }

  const cylinderMaker = new oc.BRepPrimAPI_MakeCylinder_3(axis, radius, holeHeight);
  holeCylinder = cylinderMaker.Shape();

  // Subtract hole from body
  const subtractor = new oc.BRepAlgoAPI_Cut_3(shape, holeCylinder, new oc.Message_ProgressRange_1());
  subtractor.Build(new oc.Message_ProgressRange_1());

  if (!subtractor.IsDone()) {
    throw new Error('Hole creation failed');
  }

  const resultShape = subtractor.Shape();
  const newShapeId = registerShape(resultShape);
  const mesh = meshShape(resultShape);

  return { shapeId: newShapeId, mesh: mesh };
}

// ============================================================================
// HELIX / THREAD OPERATIONS
// ============================================================================

/**
 * Create a helix (spring or thread) by sweeping a profile along a helical path
 * @param {number} radius - Helix radius (distance from center)
 * @param {number} pitch - Distance between turns (thread pitch)
 * @param {number} height - Total height of the helix
 * @param {number} profileRadius - Radius of the circular profile swept along helix
 * @param {boolean} leftHanded - If true, creates left-handed helix
 * @param {Object} position - Starting position {x, y, z}
 */
function createHelix(radius, pitch, height, profileRadius, leftHanded = false, position = { x: 0, y: 0, z: 0 }) {
  if (!oc) throw new Error('Kernel not initialized');

  console.log('[GeometryWorker] Creating helix: radius =', radius, ', pitch =', pitch, ', height =', height);

  // Calculate number of turns
  const turns = height / pitch;
  const segments = Math.ceil(turns * 36); // 36 segments per turn for smooth helix

  // Generate helix points
  const helixPoints = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * turns * 2 * Math.PI * (leftHanded ? -1 : 1);
    const z = t * height;

    helixPoints.push({
      x: position.x + radius * Math.cos(angle),
      y: position.y + radius * Math.sin(angle),
      z: position.z + z
    });
  }

  // Create a wire from the helix points using a B-spline
  const arrayOfPoints = new oc.TColgp_Array1OfPnt_2(1, helixPoints.length);
  for (let i = 0; i < helixPoints.length; i++) {
    arrayOfPoints.SetValue(i + 1, new oc.gp_Pnt_3(
      helixPoints[i].x,
      helixPoints[i].y,
      helixPoints[i].z
    ));
  }

  // Create B-spline curve through points
  const interpolate = new oc.GeomAPI_PointsToBSpline_2(arrayOfPoints, 3, 8, oc.GeomAbs_Shape.GeomAbs_C2, 1e-6);
  if (!interpolate.IsDone()) {
    throw new Error('Failed to create helix B-spline');
  }

  const bsplineCurve = interpolate.Curve();
  const helixEdge = new oc.BRepBuilderAPI_MakeEdge_24(bsplineCurve);
  if (!helixEdge.IsDone()) {
    throw new Error('Failed to create helix edge');
  }

  const wireMaker = new oc.BRepBuilderAPI_MakeWire_1();
  wireMaker.Add_1(helixEdge.Edge());
  if (!wireMaker.IsDone()) {
    throw new Error('Failed to create helix wire');
  }
  const helixWire = wireMaker.Wire();

  // Create a circular profile at the start of the helix
  const profileCenter = new oc.gp_Pnt_3(
    helixPoints[0].x,
    helixPoints[0].y,
    helixPoints[0].z
  );

  // Get tangent direction at start of helix for profile orientation
  const tangentX = helixPoints[1].x - helixPoints[0].x;
  const tangentY = helixPoints[1].y - helixPoints[0].y;
  const tangentZ = helixPoints[1].z - helixPoints[0].z;
  const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY + tangentZ * tangentZ);

  const profileAxis = new oc.gp_Ax2_3(
    profileCenter,
    new oc.gp_Dir_4(tangentX / tangentLen, tangentY / tangentLen, tangentZ / tangentLen)
  );

  // Create circular profile
  const profileCircle = new oc.gp_Circ_2(profileAxis, profileRadius);
  const profileEdge = new oc.BRepBuilderAPI_MakeEdge_8(profileCircle);
  const profileWireMaker = new oc.BRepBuilderAPI_MakeWire_1();
  profileWireMaker.Add_1(profileEdge.Edge());
  const profileWire = profileWireMaker.Wire();

  // Create face from profile wire
  const profileFaceMaker = new oc.BRepBuilderAPI_MakeFace_15(profileWire, true);
  if (!profileFaceMaker.IsDone()) {
    throw new Error('Failed to create profile face');
  }
  const profileFace = profileFaceMaker.Face();

  // Sweep profile along helix path
  const pipe = new oc.BRepOffsetAPI_MakePipe_1(helixWire, profileFace);
  pipe.Build(new oc.Message_ProgressRange_1());

  if (!pipe.IsDone()) {
    throw new Error('Helix pipe sweep failed');
  }

  const resultShape = pipe.Shape();
  const shapeId = registerShape(resultShape);
  const mesh = meshShape(resultShape);

  return { shapeId: shapeId, mesh: mesh };
}

/**
 * Create thread on a cylinder (adds external thread)
 * @param {string} shapeId - ID of the shape to add thread to (optional, can be null for standalone thread)
 * @param {number} outerRadius - Outer radius of thread (major diameter / 2)
 * @param {number} innerRadius - Inner radius of thread (minor diameter / 2)
 * @param {number} pitch - Thread pitch (distance between threads)
 * @param {number} height - Height of threaded section
 * @param {boolean} leftHanded - Left-handed thread if true
 * @param {Object} position - Starting position
 */
function createThread(shapeId, outerRadius, innerRadius, pitch, height, leftHanded = false, position = { x: 0, y: 0, z: 0 }) {
  if (!oc) throw new Error('Kernel not initialized');

  console.log('[GeometryWorker] Creating thread: outer =', outerRadius, ', inner =', innerRadius, ', pitch =', pitch);

  // Calculate thread profile (triangular)
  const threadDepth = outerRadius - innerRadius;
  const threadHeight = pitch / 2; // Height of each thread tooth

  // Calculate number of turns
  const turns = height / pitch;
  const segments = Math.ceil(turns * 36);

  // Generate helix points for the thread path (at mean radius)
  const meanRadius = (outerRadius + innerRadius) / 2;
  const helixPoints = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * turns * 2 * Math.PI * (leftHanded ? -1 : 1);
    const z = t * height;

    helixPoints.push({
      x: position.x + meanRadius * Math.cos(angle),
      y: position.y + meanRadius * Math.sin(angle),
      z: position.z + z
    });
  }

  // Create B-spline helix path
  const arrayOfPoints = new oc.TColgp_Array1OfPnt_2(1, helixPoints.length);
  for (let i = 0; i < helixPoints.length; i++) {
    arrayOfPoints.SetValue(i + 1, new oc.gp_Pnt_3(
      helixPoints[i].x,
      helixPoints[i].y,
      helixPoints[i].z
    ));
  }

  const interpolate = new oc.GeomAPI_PointsToBSpline_2(arrayOfPoints, 3, 8, oc.GeomAbs_Shape.GeomAbs_C2, 1e-6);
  if (!interpolate.IsDone()) {
    throw new Error('Failed to create thread helix');
  }

  const bsplineCurve = interpolate.Curve();
  const helixEdge = new oc.BRepBuilderAPI_MakeEdge_24(bsplineCurve);
  const wireMaker = new oc.BRepBuilderAPI_MakeWire_1();
  wireMaker.Add_1(helixEdge.Edge());
  const helixWire = wireMaker.Wire();

  // Create triangular thread profile
  // Profile is in local coordinates, will be positioned at start of helix
  const profilePoints = [
    { x: -threadDepth / 2, y: 0 },                    // Inner point
    { x: threadDepth / 2, y: threadHeight / 2 },      // Top outer point
    { x: threadDepth / 2, y: -threadHeight / 2 },     // Bottom outer point
  ];

  // Get helix start point and tangent
  const startPt = helixPoints[0];
  const tangentX = helixPoints[1].x - helixPoints[0].x;
  const tangentY = helixPoints[1].y - helixPoints[0].y;
  const tangentZ = helixPoints[1].z - helixPoints[0].z;
  const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY + tangentZ * tangentZ);

  // Tangent direction (along helix)
  const tDir = { x: tangentX / tangentLen, y: tangentY / tangentLen, z: tangentZ / tangentLen };

  // Radial direction (from center to helix point)
  const radialLen = Math.sqrt(
    (startPt.x - position.x) ** 2 + (startPt.y - position.y) ** 2
  );
  const rDir = {
    x: (startPt.x - position.x) / radialLen,
    y: (startPt.y - position.y) / radialLen,
    z: 0
  };

  // Up direction (cross product of tangent and radial)
  const uDir = {
    x: tDir.y * rDir.z - tDir.z * rDir.y,
    y: tDir.z * rDir.x - tDir.x * rDir.z,
    z: tDir.x * rDir.y - tDir.y * rDir.x
  };

  // Create profile wire in 3D space
  const profile3D = profilePoints.map(p => ({
    x: startPt.x + p.x * rDir.x + p.y * uDir.x,
    y: startPt.y + p.x * rDir.y + p.y * uDir.y,
    z: startPt.z + p.x * rDir.z + p.y * uDir.z
  }));

  // Create wire from profile points
  const profileWireMaker = new oc.BRepBuilderAPI_MakeWire_1();
  for (let i = 0; i < profile3D.length; i++) {
    const p1 = profile3D[i];
    const p2 = profile3D[(i + 1) % profile3D.length];
    const edge = new oc.BRepBuilderAPI_MakeEdge_3(
      new oc.gp_Pnt_3(p1.x, p1.y, p1.z),
      new oc.gp_Pnt_3(p2.x, p2.y, p2.z)
    );
    profileWireMaker.Add_1(edge.Edge());
  }
  const profileWire = profileWireMaker.Wire();

  // Create face from profile
  const profileFaceMaker = new oc.BRepBuilderAPI_MakeFace_15(profileWire, true);
  const profileFace = profileFaceMaker.Face();

  // Sweep thread profile along helix
  const pipe = new oc.BRepOffsetAPI_MakePipe_1(helixWire, profileFace);
  pipe.Build(new oc.Message_ProgressRange_1());

  if (!pipe.IsDone()) {
    throw new Error('Thread pipe sweep failed');
  }

  let resultShape = pipe.Shape();

  // If we have a base shape, union the thread with it
  if (shapeId) {
    const baseShape = getShape(shapeId);
    if (baseShape) {
      const fuse = new oc.BRepAlgoAPI_Fuse_3(baseShape, resultShape, new oc.Message_ProgressRange_1());
      fuse.Build(new oc.Message_ProgressRange_1());
      if (fuse.IsDone()) {
        resultShape = fuse.Shape();
      }
    }
  }

  const newShapeId = registerShape(resultShape);
  const mesh = meshShape(resultShape);

  return { shapeId: newShapeId, mesh: mesh };
}

// ============================================================================
// MIRROR OPERATION
// ============================================================================

/**
 * Mirror a shape across a plane
 * @param {string} shapeId - ID of the shape to mirror
 * @param {string} plane - 'XY', 'XZ', or 'YZ'
 * @param {number} offset - Plane offset from origin
 * @param {boolean} keepOriginal - If true, returns union of original and mirrored
 */
function mirrorShape(shapeId, plane, offset = 0, keepOriginal = true) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  console.log('[GeometryWorker] Mirroring shape across', plane, 'plane');

  // Create mirror transformation
  let mirrorPlane;
  switch (plane) {
    case 'XY':
      mirrorPlane = new oc.gp_Ax2_3(
        new oc.gp_Pnt_3(0, 0, offset),
        new oc.gp_Dir_4(0, 0, 1)
      );
      break;
    case 'XZ':
      mirrorPlane = new oc.gp_Ax2_3(
        new oc.gp_Pnt_3(0, offset, 0),
        new oc.gp_Dir_4(0, 1, 0)
      );
      break;
    case 'YZ':
      mirrorPlane = new oc.gp_Ax2_3(
        new oc.gp_Pnt_3(offset, 0, 0),
        new oc.gp_Dir_4(1, 0, 0)
      );
      break;
    default:
      throw new Error('Invalid plane: ' + plane);
  }

  const transform = new oc.gp_Trsf_1();
  transform.SetMirror_3(mirrorPlane);

  const transformer = new oc.BRepBuilderAPI_Transform_2(shape, transform, true);
  const mirroredShape = transformer.Shape();

  let resultShape;
  if (keepOriginal) {
    // Union original and mirrored
    const fuse = new oc.BRepAlgoAPI_Fuse_3(shape, mirroredShape, new oc.Message_ProgressRange_1());
    if (!fuse.IsDone()) {
      throw new Error('Mirror union failed');
    }
    resultShape = fuse.Shape();
  } else {
    resultShape = mirroredShape;
  }

  const newShapeId = registerShape(resultShape);
  const mesh = meshShape(resultShape);

  return { shapeId: newShapeId, mesh: mesh };
}

// ============================================================================
// PATTERN OPERATIONS
// ============================================================================

/**
 * Linear pattern - repeat shape along a direction
 * @param {string} shapeId - ID of the shape to pattern
 * @param {object} direction - {x, y, z} direction vector
 * @param {number} count - Number of copies (including original)
 * @param {number} spacing - Distance between copies
 */
function linearPattern(shapeId, direction, count, spacing) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  console.log('[GeometryWorker] Linear pattern:', count, 'copies, spacing:', spacing);

  if (count < 2) {
    // Just return the original
    const newShapeId = registerShape(shape);
    const mesh = meshShape(shape);
    return { shapeId: newShapeId, mesh: mesh };
  }

  // Normalize direction
  const len = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
  const dir = {
    x: direction.x / len,
    y: direction.y / len,
    z: direction.z / len
  };

  // Start with original shape
  let compound = new oc.BRep_Builder();
  let result = new oc.TopoDS_Compound();
  compound.MakeCompound(result);
  compound.Add(result, shape);

  // Create copies
  for (let i = 1; i < count; i++) {
    const transform = new oc.gp_Trsf_1();
    transform.SetTranslation_1(new oc.gp_Vec_4(
      dir.x * spacing * i,
      dir.y * spacing * i,
      dir.z * spacing * i
    ));
    const transformer = new oc.BRepBuilderAPI_Transform_2(shape, transform, true);
    compound.Add(result, transformer.Shape());
  }

  // Fuse all shapes together
  const fuser = new oc.BRepAlgoAPI_Fuse_3(
    shape,
    result,
    new oc.Message_ProgressRange_1()
  );

  let finalShape;
  if (fuser.IsDone()) {
    finalShape = fuser.Shape();
  } else {
    // If fuse fails, return compound
    finalShape = result;
  }

  const newShapeId = registerShape(finalShape);
  const mesh = meshShape(finalShape);

  return { shapeId: newShapeId, mesh: mesh };
}

/**
 * Circular pattern - repeat shape around an axis
 * @param {string} shapeId - ID of the shape to pattern
 * @param {string} axis - 'X', 'Y', or 'Z'
 * @param {number} count - Number of copies (including original)
 * @param {number} angle - Total angle in degrees (360 for full circle)
 * @param {object} center - {x, y, z} center point of rotation
 */
function circularPattern(shapeId, axis, count, angle, center = { x: 0, y: 0, z: 0 }) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  console.log('[GeometryWorker] Circular pattern:', count, 'copies, angle:', angle);

  if (count < 2) {
    const newShapeId = registerShape(shape);
    const mesh = meshShape(shape);
    return { shapeId: newShapeId, mesh: mesh };
  }

  // Create axis
  let axisDir;
  switch (axis) {
    case 'X': axisDir = new oc.gp_Dir_4(1, 0, 0); break;
    case 'Y': axisDir = new oc.gp_Dir_4(0, 1, 0); break;
    case 'Z': axisDir = new oc.gp_Dir_4(0, 0, 1); break;
    default: throw new Error('Invalid axis: ' + axis);
  }

  const rotationAxis = new oc.gp_Ax1_2(
    new oc.gp_Pnt_3(center.x, center.y, center.z),
    axisDir
  );

  // For full circle (360), divide by count; otherwise divide by (count-1) for even distribution
  const angleStep = angle === 360
    ? (angle * Math.PI / 180) / count
    : (angle * Math.PI / 180) / (count - 1);

  // Iteratively fuse each rotated copy with the running result
  let finalShape = shape;

  for (let i = 1; i < count; i++) {
    const transform = new oc.gp_Trsf_1();
    transform.SetRotation_1(rotationAxis, angleStep * i);
    const transformer = new oc.BRepBuilderAPI_Transform_2(shape, transform, true);
    const rotatedCopy = transformer.Shape();

    // Fuse the rotated copy with the current result
    const fuser = new oc.BRepAlgoAPI_Fuse_3(finalShape, rotatedCopy, new oc.Message_ProgressRange_1());

    if (fuser.IsDone()) {
      finalShape = fuser.Shape();
    } else {
      console.warn('[GeometryWorker] Fuse failed at copy', i, ', using compound fallback');
      // Fallback: build compound if fuse fails
      const builder = new oc.BRep_Builder();
      const compound = new oc.TopoDS_Compound();
      builder.MakeCompound(compound);
      builder.Add(compound, finalShape);
      builder.Add(compound, rotatedCopy);
      finalShape = compound;
    }
  }

  const newShapeId = registerShape(finalShape);
  const mesh = meshShape(finalShape);

  return { shapeId: newShapeId, mesh: mesh };
}

// ============================================================================
// TRANSLATE/COPY OPERATIONS
// ============================================================================

/**
 * Translate (move) a shape
 * @param {string} shapeId - Shape to translate
 * @param {number} dx - X offset
 * @param {number} dy - Y offset
 * @param {number} dz - Z offset
 * @param {boolean} copy - If true, create a copy; if false, replace original
 */
function translateShape(shapeId, dx, dy, dz, copy = false) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  console.log('[GeometryWorker] Translating shape:', dx, dy, dz, 'copy:', copy);

  const transform = new oc.gp_Trsf_1();
  transform.SetTranslation_1(new oc.gp_Vec_4(dx, dy, dz));

  const transformer = new oc.BRepBuilderAPI_Transform_2(shape, transform, true);
  const translatedShape = transformer.Shape();

  const newShapeId = registerShape(translatedShape);
  const mesh = meshShape(translatedShape);

  return { shapeId: newShapeId, mesh: mesh };
}

/**
 * Scale a shape uniformly
 * @param {string} shapeId - Shape to scale
 * @param {number} factor - Scale factor
 * @param {object} center - Center point {x, y, z} for scaling
 */
function scaleShape(shapeId, factor, center = { x: 0, y: 0, z: 0 }) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  console.log('[GeometryWorker] Scaling shape by:', factor);

  const transform = new oc.gp_Trsf_1();
  transform.SetScale(new oc.gp_Pnt_3(center.x, center.y, center.z), factor);

  const transformer = new oc.BRepBuilderAPI_Transform_2(shape, transform, true);
  const scaledShape = transformer.Shape();

  const newShapeId = registerShape(scaledShape);
  const mesh = meshShape(scaledShape);

  return { shapeId: newShapeId, mesh: mesh };
}

/**
 * Rotate a shape
 * @param {string} shapeId - Shape to rotate
 * @param {string} axis - 'X', 'Y', or 'Z'
 * @param {number} angle - Angle in degrees
 * @param {object} center - Center point {x, y, z} for rotation
 */
function rotateShape(shapeId, axis, angle, center = { x: 0, y: 0, z: 0 }) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  console.log('[GeometryWorker] Rotating shape:', axis, angle, 'degrees');

  let axisDir;
  switch (axis) {
    case 'X': axisDir = new oc.gp_Dir_4(1, 0, 0); break;
    case 'Y': axisDir = new oc.gp_Dir_4(0, 1, 0); break;
    case 'Z': axisDir = new oc.gp_Dir_4(0, 0, 1); break;
    default: throw new Error('Invalid axis: ' + axis);
  }

  const rotationAxis = new oc.gp_Ax1_2(
    new oc.gp_Pnt_3(center.x, center.y, center.z),
    axisDir
  );

  const transform = new oc.gp_Trsf_1();
  transform.SetRotation_1(rotationAxis, angle * Math.PI / 180);

  const transformer = new oc.BRepBuilderAPI_Transform_2(shape, transform, true);
  const rotatedShape = transformer.Shape();

  const newShapeId = registerShape(rotatedShape);
  const mesh = meshShape(rotatedShape);

  return { shapeId: newShapeId, mesh: mesh };
}

/**
 * Split a shape with a plane
 * @param {string} shapeId - Shape to split
 * @param {string} plane - 'XY', 'XZ', or 'YZ'
 * @param {number} offset - Plane offset along normal
 */
function splitShape(shapeId, plane, offset = 0) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  console.log('[GeometryWorker] Splitting shape at', plane, 'offset:', offset);

  // Create cutting plane
  let planePoint, planeDir;
  switch (plane) {
    case 'XY':
      planePoint = new oc.gp_Pnt_3(0, 0, offset);
      planeDir = new oc.gp_Dir_4(0, 0, 1);
      break;
    case 'XZ':
      planePoint = new oc.gp_Pnt_3(0, offset, 0);
      planeDir = new oc.gp_Dir_4(0, 1, 0);
      break;
    case 'YZ':
      planePoint = new oc.gp_Pnt_3(offset, 0, 0);
      planeDir = new oc.gp_Dir_4(1, 0, 0);
      break;
    default:
      throw new Error('Invalid plane: ' + plane);
  }

  const cutPlane = new oc.gp_Pln_3(planePoint, planeDir);
  const planeFace = new oc.BRepBuilderAPI_MakeFace_8(cutPlane, -100, 100, -100, 100).Face();

  // Split the shape
  const splitter = new oc.BRepAlgoAPI_Splitter_1();
  const shapeList = new oc.TopTools_ListOfShape_1();
  shapeList.Append_1(shape);
  const toolList = new oc.TopTools_ListOfShape_1();
  toolList.Append_1(planeFace);

  splitter.SetArguments(shapeList);
  splitter.SetTools(toolList);
  splitter.Build(new oc.Message_ProgressRange_1());

  if (!splitter.IsDone()) {
    throw new Error('Split operation failed');
  }

  const splitResult = splitter.Shape();
  const newShapeId = registerShape(splitResult);
  const mesh = meshShape(splitResult);

  return { shapeId: newShapeId, mesh: mesh };
}

// ============================================================================
// SWEEP OPERATION
// ============================================================================

/**
 * Sweep a profile along a path (line)
 * @param {Array<{x, y}>} profile - 2D profile points
 * @param {object} start - Start point {x, y, z}
 * @param {object} end - End point {x, y, z}
 * @param {string} profilePlane - Plane of profile: 'XY', 'XZ', 'YZ'
 */
function sweepProfile(profile, start, end, profilePlane = 'XY') {
  if (!oc) throw new Error('Kernel not initialized');

  console.log('[GeometryWorker] Sweeping profile along path');

  if (profile.length < 3) {
    throw new Error('Profile must have at least 3 points');
  }

  // Create the profile wire
  const wireBuilder = new oc.BRepBuilderAPI_MakeWire_1();

  for (let i = 0; i < profile.length; i++) {
    const p1 = profile[i];
    const p2 = profile[(i + 1) % profile.length];

    let pt1, pt2;
    switch (profilePlane) {
      case 'XY':
        pt1 = new oc.gp_Pnt_3(p1.x + start.x, p1.y + start.y, start.z);
        pt2 = new oc.gp_Pnt_3(p2.x + start.x, p2.y + start.y, start.z);
        break;
      case 'XZ':
        pt1 = new oc.gp_Pnt_3(p1.x + start.x, start.y, p1.y + start.z);
        pt2 = new oc.gp_Pnt_3(p2.x + start.x, start.y, p2.y + start.z);
        break;
      case 'YZ':
        pt1 = new oc.gp_Pnt_3(start.x, p1.x + start.y, p1.y + start.z);
        pt2 = new oc.gp_Pnt_3(start.x, p2.x + start.y, p2.y + start.z);
        break;
    }

    const edge = new oc.BRepBuilderAPI_MakeEdge_3(pt1, pt2).Edge();
    wireBuilder.Add_1(edge);
  }

  const profileWire = wireBuilder.Wire();

  // Create face from wire
  const faceMaker = new oc.BRepBuilderAPI_MakeFace_15(profileWire, true);
  const profileFace = faceMaker.Face();

  // Create the spine (path)
  const spinePt1 = new oc.gp_Pnt_3(start.x, start.y, start.z);
  const spinePt2 = new oc.gp_Pnt_3(end.x, end.y, end.z);
  const spineEdge = new oc.BRepBuilderAPI_MakeEdge_3(spinePt1, spinePt2).Edge();
  const spineWire = new oc.BRepBuilderAPI_MakeWire_2(spineEdge).Wire();

  // Sweep
  const pipe = new oc.BRepOffsetAPI_MakePipe_1(spineWire, profileFace);

  if (!pipe.IsDone()) {
    throw new Error('Sweep operation failed');
  }

  const resultShape = pipe.Shape();
  const newShapeId = registerShape(resultShape);
  const mesh = meshShape(resultShape);

  return { shapeId: newShapeId, mesh: mesh };
}

// ============================================================================
// LOFT OPERATION
// ============================================================================

/**
 * Loft between two profiles
 * @param {Array<{x, y}>} profile1 - First 2D profile points
 * @param {Array<{x, y}>} profile2 - Second 2D profile points
 * @param {number} z1 - Z position of first profile
 * @param {number} z2 - Z position of second profile
 */
function loftProfiles(profile1, profile2, z1, z2) {
  if (!oc) throw new Error('Kernel not initialized');

  console.log('[GeometryWorker] Lofting between profiles at z=', z1, 'and z=', z2);

  if (profile1.length < 3 || profile2.length < 3) {
    throw new Error('Profiles must have at least 3 points');
  }

  // Helper to create wire from profile
  function createWire(profile, z) {
    const wireBuilder = new oc.BRepBuilderAPI_MakeWire_1();
    for (let i = 0; i < profile.length; i++) {
      const p1 = profile[i];
      const p2 = profile[(i + 1) % profile.length];
      const pt1 = new oc.gp_Pnt_3(p1.x, p1.y, z);
      const pt2 = new oc.gp_Pnt_3(p2.x, p2.y, z);
      const edge = new oc.BRepBuilderAPI_MakeEdge_3(pt1, pt2).Edge();
      wireBuilder.Add_1(edge);
    }
    return wireBuilder.Wire();
  }

  const wire1 = createWire(profile1, z1);
  const wire2 = createWire(profile2, z2);

  // Create loft
  const loft = new oc.BRepOffsetAPI_ThruSections(true, true);
  loft.AddWire(wire1);
  loft.AddWire(wire2);
  loft.Build(new oc.Message_ProgressRange_1());

  if (!loft.IsDone()) {
    throw new Error('Loft operation failed');
  }

  const resultShape = loft.Shape();
  const newShapeId = registerShape(resultShape);
  const mesh = meshShape(resultShape);

  return { shapeId: newShapeId, mesh: mesh };
}

// ============================================================================
// MEASUREMENT OPERATIONS
// ============================================================================

/**
 * Get bounding box of a shape
 * @param {string} shapeId - ID of the shape
 */
function getBoundingBox(shapeId) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  const bbox = new oc.Bnd_Box_1();
  oc.BRepBndLib.Add(shape, bbox, false);

  const min = bbox.CornerMin();
  const max = bbox.CornerMax();

  return {
    min: { x: min.X(), y: min.Y(), z: min.Z() },
    max: { x: max.X(), y: max.Y(), z: max.Z() },
    size: {
      x: max.X() - min.X(),
      y: max.Y() - min.Y(),
      z: max.Z() - min.Z()
    }
  };
}

/**
 * Calculate volume and surface area of a shape
 * @param {string} shapeId - ID of the shape
 */
function getMassProperties(shapeId) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  const props = new oc.GProp_GProps_1();

  // Volume properties
  oc.BRepGProp.VolumeProperties_1(shape, props, true, false, false);
  const volume = props.Mass();
  const cog = props.CentreOfMass();

  // Surface properties
  const surfProps = new oc.GProp_GProps_1();
  oc.BRepGProp.SurfaceProperties_1(shape, surfProps, true, false);
  const surfaceArea = surfProps.Mass();

  return {
    volume: volume,
    surfaceArea: surfaceArea,
    centerOfMass: {
      x: cog.X(),
      y: cog.Y(),
      z: cog.Z()
    }
  };
}

/**
 * Measure distance between two points on shapes
 * @param {string} shapeId1 - First shape ID
 * @param {string} shapeId2 - Second shape ID
 */
function measureDistance(shapeId1, shapeId2) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape1 = getShape(shapeId1);
  const shape2 = getShape(shapeId2);

  if (!shape1 || !shape2) {
    throw new Error('Shape not found');
  }

  const distCalc = new oc.BRepExtrema_DistShapeShape_2(
    shape1, shape2,
    oc.Extrema_ExtFlag.Extrema_ExtFlag_MIN,
    oc.Extrema_ExtAlgo.Extrema_ExtAlgo_Grad,
    new oc.Message_ProgressRange_1()
  );

  if (!distCalc.IsDone()) {
    throw new Error('Distance calculation failed');
  }

  const distance = distCalc.Value();
  const pt1 = distCalc.PointOnShape1(1);
  const pt2 = distCalc.PointOnShape2(1);

  return {
    distance: distance,
    point1: { x: pt1.X(), y: pt1.Y(), z: pt1.Z() },
    point2: { x: pt2.X(), y: pt2.Y(), z: pt2.Z() }
  };
}

// ============================================================================
// MESHING
// ============================================================================

function meshShape(shape) {
  if (!oc) throw new Error('Kernel not initialized');

  console.log('[GeometryWorker] Meshing shape...');

  // Mesh the shape
  new oc.BRepMesh_IncrementalMesh_2(shape, 0.1, false, 0.5, false);

  const positions = [];
  const indices = [];

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  // Iterate over faces
  const explorer = new oc.TopExp_Explorer_2(
    shape,
    oc.TopAbs_ShapeEnum.TopAbs_FACE,
    oc.TopAbs_ShapeEnum.TopAbs_SHAPE
  );

  let indexOffset = 0;

  while (explorer.More()) {
    const face = oc.TopoDS.Face_1(explorer.Current());
    const location = new oc.TopLoc_Location_1();
    const triangulation = oc.BRep_Tool.Triangulation(face, location, 0);

    if (triangulation && !triangulation.IsNull()) {
      const transform = location.Transformation();
      const nbNodes = triangulation.get().NbNodes();
      const nbTriangles = triangulation.get().NbTriangles();

      // Get vertices
      for (let i = 1; i <= nbNodes; i++) {
        const node = triangulation.get().Node(i);
        const transformedNode = node.Transformed(transform);

        const x = transformedNode.X();
        const y = transformedNode.Y();
        const z = transformedNode.Z();

        positions.push(x, y, z);

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        minZ = Math.min(minZ, z);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        maxZ = Math.max(maxZ, z);
      }

      // Get triangles
      const orientation = face.Orientation_1();

      for (let i = 1; i <= nbTriangles; i++) {
        const triangle = triangulation.get().Triangle(i);
        let n1 = triangle.Value(1) - 1 + indexOffset;
        let n2 = triangle.Value(2) - 1 + indexOffset;
        let n3 = triangle.Value(3) - 1 + indexOffset;

        if (orientation === oc.TopAbs_Orientation.TopAbs_REVERSED) {
          const temp = n2;
          n2 = n3;
          n3 = temp;
        }

        indices.push(n1, n2, n3);
      }

      indexOffset += nbNodes;
    }

    explorer.Next();
  }

  console.log('[GeometryWorker] Meshed:', positions.length / 3, 'vertices,', indices.length / 3, 'triangles');

  // Create normals (placeholder - Three.js will compute them)
  const normals = [];
  for (let i = 0; i < positions.length / 3; i++) {
    normals.push(0, 0, 1);
  }

  if (positions.length === 0) {
    return {
      positions: new Float32Array([0, 0, 0]),
      normals: new Float32Array([0, 0, 1]),
      indices: new Uint32Array([0]),
      bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } }
    };
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
    bounds: {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ }
    }
  };
}

// ============================================================================
// FILE EXPORT FUNCTIONS
// ============================================================================

/**
 * Export shape to STL format (binary)
 * @param {string} shapeId - Shape to export
 * @returns {ArrayBuffer} Binary STL data
 */
function exportSTL(shapeId) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  console.log('[GeometryWorker] Exporting STL');

  // Create STL writer
  const writer = new oc.StlAPI_Writer();
  writer.SetASCIIMode_1(false); // Binary mode for smaller files

  // Write to virtual filesystem
  const filename = '/tmp/export.stl';
  const success = writer.Write(shape, filename, new oc.Message_ProgressRange_1());

  if (!success) {
    throw new Error('Failed to write STL file');
  }

  // Read file from virtual filesystem
  const fileContent = oc.FS.readFile(filename);

  // Clean up
  oc.FS.unlink(filename);

  return fileContent.buffer;
}

/**
 * Export shape to STEP format
 * @param {string} shapeId - Shape to export
 * @returns {string} STEP file content
 */
function exportSTEP(shapeId) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  console.log('[GeometryWorker] Exporting STEP');

  // Create STEP writer
  const writer = new oc.STEPControl_Writer_1();

  // Transfer shape
  const status = writer.Transfer(shape, 0, true, new oc.Message_ProgressRange_1()); // 0 = AsIs mode
  if (status !== 1) { // IFSelect_RetDone
    throw new Error('Failed to transfer shape to STEP: ' + status);
  }

  // Write to virtual filesystem
  const filename = '/tmp/export.step';
  const writeStatus = writer.Write(filename);
  if (writeStatus !== 1) { // IFSelect_RetDone
    throw new Error('Failed to write STEP file: ' + writeStatus);
  }

  // Read file from virtual filesystem
  const fileContent = oc.FS.readFile(filename, { encoding: 'utf8' });

  // Clean up
  oc.FS.unlink(filename);

  return fileContent;
}

/**
 * Export shape to OBJ format (using mesh data)
 * @param {string} shapeId - Shape to export
 * @returns {string} OBJ file content
 */
function exportOBJ(shapeId) {
  if (!oc) throw new Error('Kernel not initialized');

  const shape = getShape(shapeId);
  if (!shape) {
    throw new Error('Shape not found: ' + shapeId);
  }

  console.log('[GeometryWorker] Exporting OBJ');

  // Get mesh data
  const mesh = meshShape(shape);
  const positions = mesh.positions;
  const normals = mesh.normals;
  const indices = mesh.indices;

  let obj = '# MachinistCAD OBJ Export\n';
  obj += '# Vertices: ' + (positions.length / 3) + '\n';
  obj += '# Triangles: ' + (indices.length / 3) + '\n\n';

  // Write vertices
  for (let i = 0; i < positions.length; i += 3) {
    obj += 'v ' + positions[i].toFixed(6) + ' ' + positions[i+1].toFixed(6) + ' ' + positions[i+2].toFixed(6) + '\n';
  }

  obj += '\n';

  // Write normals
  for (let i = 0; i < normals.length; i += 3) {
    obj += 'vn ' + normals[i].toFixed(6) + ' ' + normals[i+1].toFixed(6) + ' ' + normals[i+2].toFixed(6) + '\n';
  }

  obj += '\n';

  // Write faces (OBJ uses 1-based indices)
  for (let i = 0; i < indices.length; i += 3) {
    const i1 = indices[i] + 1;
    const i2 = indices[i+1] + 1;
    const i3 = indices[i+2] + 1;
    obj += 'f ' + i1 + '//' + i1 + ' ' + i2 + '//' + i2 + ' ' + i3 + '//' + i3 + '\n';
  }

  return obj;
}

// Message handler
self.onmessage = async function(event) {
  const data = event.data;
  const id = data.id;
  const type = data.type;
  const payload = data.payload;

  console.log('[GeometryWorker] Received:', type);

  try {
    if (type === 'init') {
      await initializeKernel();
      self.postMessage({ id: id, type: type, success: true });
    }
    else if (type === 'compute') {
      // Make sure kernel is initialized
      if (!isInitialized) {
        await initializeKernel();
      }

      const operation = payload.operation;
      const params = payload.params;
      let result;

      if (operation === 'box') {
        result = createBox(params.width, params.height, params.depth, params.position);
      } else if (operation === 'cylinder') {
        result = createCylinder(params.radius, params.height, params.position);
      } else if (operation === 'sphere') {
        result = createSphere(params.radius, params.position);
      } else if (operation === 'cone') {
        result = createCone(params.radius, params.height, params.position);
      } else if (operation === 'torus') {
        result = createTorus(params.majorRadius, params.minorRadius, params.position);
      } else if (operation === 'extrude') {
        result = extrudeProfile(params.profile, params.height, params.plane, params.planeOffset);
      } else if (operation === 'extrudeRectangle') {
        result = extrudeRectangle(params.corner1, params.corner2, params.height, params.plane, params.planeOffset);
      } else if (operation === 'extrudeCircle') {
        result = extrudeCircle(params.center, params.radius, params.height, params.plane, params.planeOffset);
      } else if (operation === 'revolveRectangle') {
        result = revolveRectangle(params.corner1, params.corner2, params.angle, params.plane, params.planeOffset, params.axis);
      } else if (operation === 'booleanUnion') {
        result = booleanUnion(params.shapeId1, params.shapeId2);
      } else if (operation === 'booleanSubtract') {
        result = booleanSubtract(params.shapeId1, params.shapeId2);
      } else if (operation === 'booleanIntersect') {
        result = booleanIntersect(params.shapeId1, params.shapeId2);
      } else if (operation === 'deleteShape') {
        deleteShape(params.shapeId);
        result = { success: true };
      } else if (operation === 'filletAllEdges') {
        result = filletAllEdges(params.shapeId, params.radius);
      } else if (operation === 'chamferAllEdges') {
        result = chamferAllEdges(params.shapeId, params.distance);
      } else if (operation === 'filletEdges') {
        result = filletEdges(params.shapeId, params.radius, params.edgeIndices);
      } else if (operation === 'shell') {
        result = shellShape(params.shapeId, params.thickness, params.faceIndices || []);
      } else if (operation === 'mirror') {
        result = mirrorShape(params.shapeId, params.plane, params.offset, params.keepOriginal);
      } else if (operation === 'linearPattern') {
        result = linearPattern(params.shapeId, params.direction, params.count, params.spacing);
      } else if (operation === 'circularPattern') {
        result = circularPattern(params.shapeId, params.axis, params.count, params.angle, params.center);
      } else if (operation === 'sweep') {
        result = sweepProfile(params.profile, params.start, params.end, params.profilePlane);
      } else if (operation === 'loft') {
        result = loftProfiles(params.profile1, params.profile2, params.z1, params.z2);
      } else if (operation === 'boundingBox') {
        result = { data: getBoundingBox(params.shapeId) };
      } else if (operation === 'massProperties') {
        result = { data: getMassProperties(params.shapeId) };
      } else if (operation === 'measureDistance') {
        result = { data: measureDistance(params.shapeId1, params.shapeId2) };
      } else if (operation === 'exportSTL') {
        const stlData = exportSTL(params.shapeId);
        result = { data: stlData, format: 'stl' };
      } else if (operation === 'exportSTEP') {
        const stepData = exportSTEP(params.shapeId);
        result = { data: stepData, format: 'step' };
      } else if (operation === 'exportOBJ') {
        const objData = exportOBJ(params.shapeId);
        result = { data: objData, format: 'obj' };
      } else if (operation === 'translate') {
        result = translateShape(params.shapeId, params.dx, params.dy, params.dz, params.copy);
      } else if (operation === 'scale') {
        result = scaleShape(params.shapeId, params.factor, params.center);
      } else if (operation === 'rotate') {
        result = rotateShape(params.shapeId, params.axis, params.angle, params.center);
      } else if (operation === 'split') {
        result = splitShape(params.shapeId, params.plane, params.offset);
      } else if (operation === 'draft') {
        result = draftShape(params.shapeId, params.angle, params.direction);
      } else if (operation === 'hole') {
        result = createHole(params.shapeId, params.diameter, params.depth, params.position, params.direction);
      } else if (operation === 'helix') {
        result = createHelix(params.radius, params.pitch, params.height, params.profileRadius, params.leftHanded, params.position);
      } else if (operation === 'thread') {
        result = createThread(params.shapeId, params.outerRadius, params.innerRadius, params.pitch, params.height, params.leftHanded, params.position);
      } else {
        throw new Error('Unknown operation: ' + operation);
      }

      self.postMessage({
        id: id,
        type: type,
        success: true,
        payload: { mesh: result.mesh, shapeId: result.shapeId }
      });
    }
    else {
      self.postMessage({
        id: id,
        type: type,
        success: false,
        error: 'Unknown message type'
      });
    }
  } catch (error) {
    console.error('[GeometryWorker] Error:', error);
    self.postMessage({
      id: id,
      type: type,
      success: false,
      error: error.message || String(error)
    });
  }
};

console.log('[GeometryWorker] Worker loaded, ready for init');

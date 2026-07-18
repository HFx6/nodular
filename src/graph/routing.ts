// Wire routing: a curved "channel" style. A forward wire (dest to the right of
// its source) exits its output port horizontally, bends once in the mid-gap
// channel between the two columns, and enters the input port horizontally — a
// single smooth S with horizontal tangents at both ends. Back/level edges (dest
// not to the right, e.g. a feedback cycle) exit right, run through a vertical
// channel, and curve back into the left side.
//
// Pure: takes two points, returns an SVG path `d`. The layered layout provides
// the spacing (label-aware column gaps) that keeps these channels clear, so the
// router itself stays obstacle-free and cheap.

export interface Pt {
  x: number;
  y: number;
}

export interface RouteOpts {
  /** horizontal launch/land length off each port */
  stub?: number;
  /** corner-rounding radius for back-edge detours */
  radius?: number;
}

/** Smooth a polyline into an SVG path with rounded corners (line + quadratic
 *  fillets), so right-angle detours read as curves. */
function roundedPath(pts: Pt[], radius: number): string {
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1]!,
      p1 = pts[i]!,
      p2 = pts[i + 1]!;
    const d1 = Math.hypot(p0.x - p1.x, p0.y - p1.y) || 1;
    const d2 = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
    const r = Math.min(radius, d1 / 2, d2 / 2);
    const t1 = {
      x: p1.x + ((p0.x - p1.x) / d1) * r,
      y: p1.y + ((p0.y - p1.y) / d1) * r,
    };
    const t2 = {
      x: p1.x + ((p2.x - p1.x) / d2) * r,
      y: p1.y + ((p2.y - p1.y) / d2) * r,
    };
    d += ` L ${t1.x} ${t1.y} Q ${p1.x} ${p1.y} ${t2.x} ${t2.y}`;
  }
  const last = pts[pts.length - 1]!;
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export function routeWire(a: Pt, b: Pt, opts: RouteOpts = {}): string {
  const stub = opts.stub ?? 24;
  const radius = opts.radius ?? 16;

  // forward: dest sits to the right with room for a mid-gap bend
  if (b.x > a.x + 2 * stub) {
    const cx = (a.x + b.x) / 2; // channel between the two columns
    return `M ${a.x} ${a.y} C ${cx} ${a.y}, ${cx} ${b.y}, ${b.x} ${b.y}`;
  }

  // back / level edge: right stub → vertical channel → left stub into dest
  const ax = a.x + stub;
  const bx = b.x - stub;
  const my = (a.y + b.y) / 2;
  return roundedPath(
    [
      a,
      { x: ax, y: a.y },
      { x: ax, y: my },
      { x: bx, y: my },
      { x: bx, y: b.y },
      b,
    ],
    radius,
  );
}

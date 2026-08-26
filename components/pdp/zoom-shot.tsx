"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

/*
  One shot in the product gallery, with EasyZoom-style magnification: hovering the image draws a
  lens over the region under the pointer and a pane beside the frame showing that region at the
  source image's own resolution. Moving the pointer pans the pane.

  This replaces a `group-hover:scale-[1.08]` transform on the frame, which magnified the whole
  photograph by 8% — enough to feel like a wobble, never enough to read a label.

  Two constraints shape the implementation:

  - The gallery's view switching stays in CSS (`.gallery` in globals.css). This component renders
    the `.shot` div itself and must remain a direct child of `.frame` in source order, because the
    `:checked ~ .frame .shot:nth-child(n)` rules address shots by position. Inactive shots are
    `visibility: hidden`, so only the shot on screen can be hovered — no active-index state needed
    here, and the radios still work with JS off.
  - The pane is `position: fixed` so it escapes the frame's `overflow-hidden` without a portal.
    That holds only while no ancestor creates a containing block, which is why the frame no longer
    carries `will-change: transform`.
*/

/** Pane size, px — really wide and tall like the reference (left bottle + right detail pane). */
const PANE_W = 720;
const PANE_H = 640;
const PANE = PANE_W;
/** Extra magnification over 1:1 (native) — 1.0 crystal clear; keep 1.0 until high-res sources land. */
const MAG = 1;
/** Gap between frame and pane, px. */
const GAP = 16;
/** Below this viewport width there is no room for a pane, so zoom stays off. */
const MIN_WIDTH = 1024;
/** Keep the pane this far from the viewport edges. */
const MARGIN = 8;

type Zoom = {
  /** Lens box, in px relative to the image box. */
  lens: { x: number; y: number; w: number; h: number };
  /** Pane box, in viewport px. */
  pane: { left: number; top: number };
  /** Background size and offset that puts the lens region at the pane's top-left. */
  bg: { w: number; h: number; x: number; y: number };
};

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function ZoomShot({
  src,
  alt,
  index,
  priority,
  switchable,
}: {
  src: string;
  alt: string;
  index: number;
  priority: boolean;
  /** Multi-shot products get the `.shot` class the CSS switcher addresses; single-shot ones show unconditionally. */
  switchable: boolean;
}) {
  const shotRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  /** Last pointer position in *client* coords, so a scroll mid-hover recomputes correctly. */
  const ptrRef = useRef<{ cx: number; cy: number } | null>(null);
  /** Natural dimensions of the source file, read once on first hover. */
  const natRef = useRef<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState<Zoom | null>(null);

  const update = useCallback(() => {
    const box = boxRef.current;
    const shot = shotRef.current;
    const ptr = ptrRef.current;
    const nat = natRef.current;
    if (!box || !shot || !ptr || !nat) return;

    const b = box.getBoundingClientRect();
    const f = shot.getBoundingClientRect();
    if (!b.width || !b.height) return;

    // `object-contain` letterboxes the photo inside the box, so the displayed image is a
    // sub-rect of it. Everything below measures against that rect, not the box.
    const boxAR = b.width / b.height;
    const imgAR = nat.w / nat.h;
    const iw = imgAR > boxAR ? b.width : b.height * imgAR;
    const ih = imgAR > boxAR ? b.width / imgAR : b.height;
    const ox = (b.width - iw) / 2;
    const oy = (b.height - ih) / 2;

    const px = ptr.cx - b.left;
    const py = ptr.cy - b.top;
    // Pointer left the displayed image (padding ring, or the frame scrolled out from under it).
    if (px < ox || px > ox + iw || py < oy || py > oy + ih) {
      setZoom(null);
      return;
    }

    // Source pixels per displayed CSS pixel. 1:1 is sharpest; MAG>1 is closer but needs larger source.
    const scale = (nat.w / iw) * MAG;
    const lensW = Math.min(PANE_W / scale, iw);
    const lensH = Math.min(PANE_H / scale, ih);
    const lx = clamp(px - lensW / 2, ox, ox + iw - lensW);
    const ly = clamp(py - lensH / 2, oy, oy + ih - lensH);

    // Prefer the right of the frame; fall back to its left when the pane would run off screen.
    let left = f.right + GAP;
    if (left + PANE_W > window.innerWidth - MARGIN) left = f.left - GAP - PANE_W;
    const top = clamp(f.top, MARGIN, Math.max(MARGIN, window.innerHeight - PANE_H - MARGIN));

    setZoom({
      lens: { x: lx, y: ly, w: lensW, h: lensH },
      pane: { left, top },
      bg: { w: iw * scale, h: ih * scale, x: -(lx - ox) * scale, y: -(ly - oy) * scale },
    });
  }, []);

  const track = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    if (window.innerWidth < MIN_WIDTH || !window.matchMedia("(hover: hover)").matches) return;
    ptrRef.current = { cx: e.clientX, cy: e.clientY };

    if (natRef.current) {
      update();
      return;
    }
    // Decode the source at full size on first hover only — four 900px files per product is not
    // worth paying for on load when most visits never hover the frame.
    const probe = new window.Image();
    probe.onload = () => {
      natRef.current = { w: probe.naturalWidth, h: probe.naturalHeight };
      update();
    };
    probe.src = src;
  };

  const clear = () => {
    ptrRef.current = null;
    setZoom(null);
  };

  // A fixed pane would drift away from the frame on scroll, so re-place it from the stored
  // client coords. `update` closes the zoom if the frame has moved out from under the pointer.
  useEffect(() => {
    if (!zoom) return;
    const onScroll = () => update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [zoom, update]);

  return (
    <div ref={shotRef} className={switchable ? "shot absolute inset-0" : "absolute inset-0"}>
      {/* Inset to where the photo actually sits, so pointer geometry needs no padding maths. */}
      <div
        ref={boxRef}
        className="absolute inset-6 cursor-crosshair"
        onPointerEnter={track}
        onPointerMove={track}
        onPointerLeave={clear}
        onPointerCancel={clear}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 90vw, 400px"
          priority={priority}
          className="object-contain"
        />

        {zoom && (
          <span
            aria-hidden
            className="pointer-events-none absolute border border-plum-800 bg-white/20"
            style={{ left: zoom.lens.x, top: zoom.lens.y, width: zoom.lens.w, height: zoom.lens.h }}
          />
        )}
      </div>

      {zoom && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 border border-line-strong bg-white bg-no-repeat"
          style={{
            left: zoom.pane.left,
            top: zoom.pane.top,
            width: PANE_W,
            height: PANE_H,
            backgroundImage: `url("${src}")`,
            backgroundSize: `${zoom.bg.w}px ${zoom.bg.h}px`,
            backgroundPosition: `${zoom.bg.x}px ${zoom.bg.y}px`,
          }}
          data-zoom-pane={index}
        />
      )}
    </div>
  );
}

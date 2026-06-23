import React from "react";

const PUBLIC = process.env.PUBLIC_URL || "";

/** PNG con fondo real (recorte HD del video + rembg). */
const MASCOT_SRC = `${PUBLIC}/brand/doctor-plumitas-hd.png`;

const SIZE_CLASS = {
  xs: "guiaa-mascot-img--xs",
  sm: "guiaa-mascot-img--sm",
  md: "guiaa-mascot-img--md",
  lg: "guiaa-mascot-img--lg",
};

const SIZE_PX = { xs: 52, sm: 96, md: 160, lg: 220 };

export function DoctorPlumitas({
  size = "md",
  badge = true,
  className = "",
  alt = "Doctor Plumitas, mascota de GUIAA",
}) {
  const px = SIZE_PX[size] || SIZE_PX.md;
  const img = (
    <img
      src={MASCOT_SRC}
      alt={alt}
      className={`guiaa-mascot-img ${SIZE_CLASS[size] || SIZE_CLASS.md}`}
      width={px}
      height={px}
      decoding="async"
    />
  );

  return (
    <div className={`guiaa-mascot-wrap ${className}`.trim()}>
      {badge ? <div className="guiaa-mascot-badge">{img}</div> : img}
    </div>
  );
}

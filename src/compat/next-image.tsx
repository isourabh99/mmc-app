import React from "react";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  quality?: number | string;
  unoptimized?: boolean;
  sizes?: string;
}

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      fill,
      priority,
      quality,
      unoptimized,
      sizes,
      className,
      style,
      ...rest
    },
    ref
  ) => {
    const combinedStyle: React.CSSProperties = {
      ...(fill
        ? {
            position: "absolute",
            height: "100%",
            width: "100%",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            objectFit: "cover",
          }
        : {}),
      ...style,
    };

    return (
      <img
        ref={ref}
        src={src}
        alt={alt || ""}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        className={className}
        style={combinedStyle}
        {...rest}
      />
    );
  }
);

Image.displayName = "Image";
export default Image;

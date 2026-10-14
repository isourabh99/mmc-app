import React from "react";
import { Link as RRDLink } from "react-router-dom";

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
  children?: React.ReactNode;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, replace, scroll, prefetch, children, onClick, ...rest }, ref) => {
    const isExternal =
      typeof href === "string" &&
      (href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:"));

    if (isExternal) {
      return (
        <a href={href} ref={ref} onClick={onClick} {...rest}>
          {children}
        </a>
      );
    }

    return (
      <RRDLink
        to={href || "/"}
        replace={replace}
        ref={ref}
        onClick={(e) => {
          if (scroll !== false && typeof window !== "undefined") {
            window.scrollTo(0, 0);
          }
          onClick?.(e);
        }}
        {...rest}
      >
        {children}
      </RRDLink>
    );
  }
);

Link.displayName = "Link";
export default Link;

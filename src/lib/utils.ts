import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isActiveLink(
  pathname: string,
  href: string,
  children: { href: string }[] = [],
): boolean {
  if (children.some((child) => isActiveLink(pathname, child.href))) {
    return true;
  }
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Escapes text (such as names or titles users typed) for use in HTML */
export function escapeHtml(text: string | null | undefined) {
  return (text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

import * as React from "react";

/**
 * Whether the media query matches. Until it has been checked in the browser
 * (on the server, and in the first render) it is `initialValue`.
 */
export function useMediaQuery(query: string, initialValue = false) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = matchMedia(query);
    result.addEventListener("change", onChange);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(result.matches);

    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}

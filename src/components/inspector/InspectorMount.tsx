import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const LazyInspector = lazy(() =>
  import("./Inspector").then((module) => ({ default: module.Inspector })),
);

export function InspectorMount() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const open = params.has("step") || params.has("object");
  const [hasOpened, setHasOpened] = useState(open);

  useEffect(() => {
    if (open) setHasOpened(true);
  }, [open]);

  if (!hasOpened) return null;

  return (
    <Suspense fallback={null}>
      <LazyInspector />
    </Suspense>
  );
}

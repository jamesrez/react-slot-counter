import { useCallback, useEffect, useRef } from 'react';

/* eslint-disable-next-line */
function useValueChangeEffect(dependencies: any[]) {
  const dependenciesRef = useRef(dependencies);
  const prevDependencies = useRef<typeof dependencies>(dependenciesRef.current);

  const serialized = dependencies.map(String).join(',');
  const serializedDependencies = dependenciesRef.current?.map(String).join(',');

  useEffect(() => {
    if (serializedDependencies === serialized) return;

    prevDependencies.current = serializedDependencies?.split(',') || [];
    dependenciesRef.current = serialized.split(',');
  }, [serialized, serializedDependencies]);

  const getPrevDependencies = useCallback(() => prevDependencies.current, []);

  const setPrevDependenciesToSameAsCurrent = useCallback(() => {
    prevDependencies.current = dependenciesRef.current;
  }, []);

  return {
    getPrevDependencies,
    setPrevDependenciesToSameAsCurrent,
  };
}

export default useValueChangeEffect;

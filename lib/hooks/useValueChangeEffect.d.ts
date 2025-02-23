declare function useValueChangeEffect(dependencies: any[]): {
    getPrevDependencies: () => any[];
    setPrevDependenciesToSameAsCurrent: () => void;
};
export default useValueChangeEffect;

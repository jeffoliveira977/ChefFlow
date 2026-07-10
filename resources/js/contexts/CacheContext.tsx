import { createContext, useContext, useState, type ReactNode } from 'react';

interface CacheContextType {
  cache: Record<string, any>;
  setCache: (key: string, data: any) => void;
}

const CacheContext = createContext<CacheContextType>({
  cache: {},
  setCache: () => {},
});

export const CacheProvider = ({ children }: { children: ReactNode }) => {
  const [cache, setCacheState] = useState<Record<string, any>>({});

  const setCache = (key: string, data: any) => {
    setCacheState(prev => ({
      ...prev,
      [key]: data,
    }));
  };

  return (
    <CacheContext.Provider value={{ cache, setCache }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => useContext(CacheContext);

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSettlements, getStreets, getHouses } from '../../../../Store/api';
import { useToken } from '../../../../Store/loginStore';

export interface DropdownOption {
  id: string | number;
  name: string;
  type: string;
  items?: any[];
  record?: any;
}

type Level = 'ulus' | 'street' | 'house';
type DirectoryState = {
  uluses: any[];
  settlements: any[];
  streets: any[];
  houses: any[];
  kv: any[];
  lics: any[];
  loading: Level | null;
  error: Level | null;
  loadedUluses: boolean;
  loadedStreets: boolean;
  loadedHouses: boolean;
};

const initialState: DirectoryState = {
  uluses: [], settlements: [], streets: [], houses: [], kv: [], lics: [],
  loading: null, error: null,
  loadedUluses: false, loadedStreets: false, loadedHouses: false,
};

const validList = (response: any): any[] | null =>
  response?.success !== false && response?.error !== true && Array.isArray(response?.data)
    ? response.data
    : null;

export const useLics = (enabled: boolean) => {
  const { token } = useToken();
  const [state, setState] = useState<DirectoryState>(initialState);
  const requestId = useRef(0);

  const loadUluses = useCallback(async () => {
    const id = ++requestId.current;
    setState({ ...initialState, loading: 'ulus' });
    if (!token) {
      setState((current) => ({ ...current, loading: null, error: 'ulus' }));
      return;
    }
    const response = await getSettlements(token);
    if (id !== requestId.current) return;
    const list = validList(response);
    setState((current) => ({
      ...current,
      uluses: list || [],
      loading: null,
      error: list ? null : 'ulus',
      loadedUluses: true,
    }));
  }, [token]);

  useEffect(() => {
    if (enabled) void loadUluses();
    return () => { requestId.current += 1; };
  }, [enabled, loadUluses]);

  const loadSettlements = useCallback((items: any[]) => {
    requestId.current += 1;
    setState((current) => ({
      ...current, settlements: Array.isArray(items) ? items : [],
      streets: [], houses: [], kv: [], lics: [],
      loading: null, error: null, loadedStreets: false, loadedHouses: false,
    }));
  }, []);

  const loadStreets = useCallback(async (idValue: string) => {
    const id = ++requestId.current;
    setState((current) => ({
      ...current, streets: [], houses: [], kv: [], lics: [],
      loading: 'street', error: null, loadedStreets: false, loadedHouses: false,
    }));
    const response = await getStreets(token, idValue);
    if (id !== requestId.current) return;
    const list = validList(response);
    setState((current) => ({
      ...current, streets: list || [], loading: null,
      error: list ? null : 'street', loadedStreets: true,
    }));
  }, [token]);

  const loadHouses = useCallback(async (ids: string) => {
    const id = ++requestId.current;
    setState((current) => ({
      ...current, houses: [], kv: [], lics: [],
      loading: 'house', error: null, loadedHouses: false,
    }));
    let parsedIds: any;
    try { parsedIds = JSON.parse(ids); }
    catch {
      if (id === requestId.current) setState((current) => ({ ...current, loading: null, error: 'house' }));
      return;
    }
    const response = await getHouses({ token, ids: parsedIds });
    if (id !== requestId.current) return;
    const list = validList(response);
    setState((current) => ({
      ...current, houses: list || [], loading: null,
      error: list ? null : 'house', loadedHouses: true,
    }));
  }, [token]);

  const loadKv = useCallback((items: any[]) => {
    requestId.current += 1;
    setState((current) => ({ ...current, kv: Array.isArray(items) ? items : [], lics: [], loading: null, error: null }));
  }, []);

  const loadLics = useCallback((items: any[]) => {
    requestId.current += 1;
    setState((current) => ({ ...current, lics: Array.isArray(items) ? items : [], loading: null, error: null }));
  }, []);

  const uluses = useMemo(() => state.uluses.map((item, index) => ({
    id: index, name: String(item.ulus || ''), type: 'ulus', items: item.settlements,
  })).filter((item) => item.name), [state.uluses]);
  const settlements = useMemo(() => state.settlements.map((item) => ({
    id: item.s_id, name: String(item.settlement || ''), type: 'settle',
  })).filter((item) => item.name), [state.settlements]);
  const streets = useMemo(() => state.streets.map((item) => ({
    id: JSON.stringify(item.ids), name: String(item.street || ''), type: 'street',
  })).filter((item) => item.name), [state.streets]);
  const houses = useMemo(() => state.houses.map((item, index) => ({
    id: index, name: String(item.house || ''), type: item.lics !== undefined ? 'house' : 'build',
    items: item.lics !== undefined ? item.lics : item.apartments,
  })).filter((item) => item.name), [state.houses]);
  const kv = useMemo(() => state.kv.map((item, index) => ({
    id: index, name: String(item.apartment || ''), type: 'kv', items: item.lics,
  })).filter((item) => item.name), [state.kv]);
  const lics = useMemo(() => state.lics.map((item, index) => ({
    id: item.id ?? index, name: String(item.code || ''), type: 'lics', record: item,
  })).filter((item) => item.name), [state.lics]);

  return {
    uluses, settlements, streets, houses, kv, lics,
    loading: state.loading, error: state.error,
    loadedUluses: state.loadedUluses, loadedStreets: state.loadedStreets, loadedHouses: state.loadedHouses,
    loadUluses, loadSettlements, loadStreets, loadHouses, loadKv, loadLics,
  };
};

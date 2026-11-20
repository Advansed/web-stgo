import { useCallback, useEffect, useRef, useState } from 'react';
import { findLicsByAddress, FoundLicByAddress, getPlots } from '../../../../Store/api';
import { useToken } from '../../../../Store/loginStore';

export interface DropdownOption {
  id: string | number;
  name: string;
  type: string;
  items?: any[];
  record?: any;
}

export const useAddressSearch = (enabled: boolean) => {
  const { token } = useToken();
  const [plots, setPlots] = useState<string[]>([]);
  const [plotsLoading, setPlotsLoading] = useState(false);
  const [plotsError, setPlotsError] = useState(false);
  const [plot, setPlot] = useState('');
  const [address, setAddress] = useState('');
  const [results, setResults] = useState<FoundLicByAddress[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [searched, setSearched] = useState(false);
  const plotsRequestId = useRef(0);
  const searchRequestId = useRef(0);

  const loadPlots = useCallback(async () => {
    const id = ++plotsRequestId.current;
    setPlotsLoading(true);
    setPlotsError(false);
    if (!token) {
      setPlots([]);
      setPlotsLoading(false);
      setPlotsError(true);
      return;
    }
    const response = await getPlots(token);
    if (id !== plotsRequestId.current) return;
    setPlots(response.ok ? response.data : []);
    setPlotsLoading(false);
    setPlotsError(!response.ok);
  }, [token]);

  useEffect(() => {
    if (!enabled) {
      plotsRequestId.current += 1;
      searchRequestId.current += 1;
      return;
    }
    setPlot('');
    setAddress('');
    setResults([]);
    setSearching(false);
    setSearchError(false);
    setSearched(false);
    void loadPlots();
    return () => { plotsRequestId.current += 1; };
  }, [enabled, loadPlots]);

  useEffect(() => {
    const query = address.trim();
    if (!enabled || !token || !plot || query.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError(false);
      setSearched(false);
      return;
    }
    const id = ++searchRequestId.current;
    const timer = window.setTimeout(() => {
      setSearching(true);
      setSearchError(false);
      void findLicsByAddress(token, plot, query).then((response) => {
        if (id !== searchRequestId.current) return;
        setResults(response.ok ? response.data : []);
        setSearching(false);
        setSearchError(!response.ok);
        setSearched(true);
      });
    }, 300);
    return () => {
      window.clearTimeout(timer);
      searchRequestId.current += 1;
    };
  }, [enabled, token, plot, address]);

  const plotOptions: DropdownOption[] = plots.map((name) => ({ id: name, name, type: 'plot' }));
  const selectedPlot = plot ? plotOptions.find((item) => item.name === plot) || { id: plot, name: plot, type: 'plot' } : undefined;

  return {
    plotOptions,
    selectedPlot,
    plotsLoading,
    plotsError,
    setPlot,
    address,
    setAddress,
    results,
    searching,
    searchError,
    searched,
    loadPlots,
  };
};

import React, { useEffect, useRef, useState } from 'react';
import './Maps.css';
import { Invoice } from '../Invoices/components/InvoiceList/InvoiceItem';
import { invoiceAddress, invoiceStatus, isInvoiceOverdue } from '../Invoices/invoicePresentation';

const YANDEX_MAP_API_KEY = import.meta.env.VITE_YANDEX_MAPS_KEY || 'f2f0a250-d1db-4754-a195-c4a7c1ba6602';
const SCRIPT_ID = 'stng-yandex-maps-api';
const DEFAULT_CENTER = [62.029585, 129.727358];
const geocodeCache = new Map<string, number[]>();
let apiPromise: Promise<any> | null = null;

export type MapLoadState = 'loading' | 'ready' | 'error';
export interface MapMetrics { source: number; plotted: number; pending: number; unlocated: number; }

interface MapProps {
  invoices: Invoice[];
  selectedId?: string | null;
  onSelectInvoice?: (invoice: Invoice) => void;
  onStatusChange?: (status: MapLoadState) => void;
  onMetricsChange?: (metrics: MapMetrics) => void;
  fitRequest?: number;
  zoomRequest?: { step: number; direction: 1 | -1 };
  retryRequest?: number;
}

const invoiceId = (invoice: Invoice) => String(invoice.id || (invoice as any).Ссылка || '');
const validCoords = (latValue: unknown, lonValue: unknown): number[] | null => {
  if (latValue === null || latValue === undefined || latValue === '' || lonValue === null || lonValue === undefined || lonValue === '') return null;
  const lat = Number(latValue);
  const lon = Number(lonValue);
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && (lat !== 0 || lon !== 0) ? [lat, lon] : null;
};
const invoiceCoords = (invoice: Invoice): number[] | null => {
  const address = typeof invoice.address === 'object' ? invoice.address : null;
  return validCoords(address?.lat ?? (address as any)?.Lat, address?.lon ?? (address as any)?.Lon)
    || validCoords((invoice as any).lat, (invoice as any).lon);
};

const svgData = (svg: string) => 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
const markerIcon = (invoice: Invoice, selected: boolean, today: string) => {
  const overdue = isInvoiceOverdue(invoice, today);
  const completed = invoiceStatus(invoice).completed;
  const fill = overdue ? '#B34445' : completed ? '#4C7891' : '#0B7CB5';
  const sign = overdue
    ? '<path d="M20 13v9m0 4h.01" stroke="white" stroke-width="3" stroke-linecap="round"/>'
    : completed
      ? '<path d="m14 20 4 4 8-9" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
      : '<circle cx="20" cy="20" r="4" fill="white"/>';
  return svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48"><path d="M20 2C10.1 2 2 10.1 2 20c0 13 18 26 18 26s18-13 18-26C38 10.1 29.9 2 20 2Z" fill="${fill}" stroke="${selected ? '#182E78' : '#FFFFFF'}" stroke-width="${selected ? 4 : 2.5}"/><circle cx="20" cy="20" r="11.5" fill="${fill}" stroke="${selected ? '#90DBD9' : '#FFFFFF'}" stroke-width="${selected ? 3 : 2}"/>${sign}</svg>`);
};

const clusterIcon = svgData('<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" fill="#182E78" stroke="#90DBD9" stroke-width="4"/></svg>');

function loadYandexMaps(): Promise<any> {
  if ((window as any).ymaps) return Promise.resolve((window as any).ymaps);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    document.getElementById(SCRIPT_ID)?.remove();
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${YANDEX_MAP_API_KEY}`;
    script.async = true;
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (error) { script.remove(); apiPromise = null; reject(error); }
      else resolve((window as any).ymaps);
    };
    const timer = window.setTimeout(() => finish(new Error('Yandex Maps timed out')), 16000);
    script.onerror = () => finish(new Error('Yandex Maps failed to load'));
    script.onload = () => {
      const ymaps = (window as any).ymaps;
      if (!ymaps?.ready) return finish(new Error('Yandex Maps did not initialize'));
      ymaps.ready(() => finish());
    };
    document.body.appendChild(script);
  });
  return apiPromise;
}

const MapComponent: React.FC<MapProps> = ({
  invoices, selectedId, onSelectInvoice, onStatusChange, onMetricsChange,
  fitRequest = 0, zoomRequest, retryRequest = 0,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const placemarksRef = useRef(new Map<string, any>());
  const invoicesRef = useRef(invoices);
  const selectedIdRef = useRef(selectedId);
  const selectRef = useRef(onSelectInvoice);
  const statusRef = useRef(onStatusChange);
  const metricsRef = useRef(onMetricsChange);
  const generationRef = useRef(0);
  const initialFitRef = useRef(false);
  const visibleOnceRef = useRef(false);
  const [mapVersion, setMapVersion] = useState(0);

  invoicesRef.current = invoices;
  selectedIdRef.current = selectedId;
  selectRef.current = onSelectInvoice;
  statusRef.current = onStatusChange;
  metricsRef.current = onMetricsChange;

  const fitMarkers = () => {
    const map = mapInstanceRef.current;
    const clusterer = clustererRef.current;
    const objects = clusterer?.getGeoObjects() || [];
    if (!map || !objects.length || !containerRef.current?.offsetWidth) return;
    if (objects.length === 1) map.setCenter(objects[0].geometry.getCoordinates(), 14, { duration: 0 });
    else {
      const bounds = clusterer.getBounds();
      if (bounds) map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 55, duration: 0 });
    }
  };

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    statusRef.current?.('loading');
    loadYandexMaps().then((ymaps) => {
      if (cancelled || !mapRef.current) return;
      try {
        const map = new ymaps.Map(mapRef.current, {
          center: DEFAULT_CENTER, zoom: 11, controls: [],
        }, { suppressMapOpenBlock: true });
        const clusterer = new ymaps.Clusterer({
          clusterIcons: [{ href: clusterIcon, size: [52, 52], offset: [-26, -26] }],
          clusterNumbers: [],
          clusterIconContentLayout: ymaps.templateLayoutFactory.createClass('<div class="stng-map-cluster-count">{{ properties.geoObjects.length }}</div>'),
          clusterDisableClickZoom: false,
          clusterOpenBalloonOnClick: false,
          groupByCoordinates: false,
        });
        map.geoObjects.add(clusterer);
        mapInstanceRef.current = map;
        clustererRef.current = clusterer;
        observer = new ResizeObserver(() => {
          if (!containerRef.current?.offsetWidth) return;
          map.container.fitToViewport();
          if (!visibleOnceRef.current) { visibleOnceRef.current = true; if (initialFitRef.current) fitMarkers(); }
        });
        if (containerRef.current) observer.observe(containerRef.current);
        statusRef.current?.('ready');
        setMapVersion((value) => value + 1);
      } catch {
        statusRef.current?.('error');
      }
    }).catch(() => { if (!cancelled) statusRef.current?.('error'); });
    return () => {
      cancelled = true;
      generationRef.current++;
      observer?.disconnect();
      mapInstanceRef.current?.destroy();
      mapInstanceRef.current = null;
      clustererRef.current = null;
      placemarksRef.current.clear();
    };
  }, [retryRequest]);

  // invoices is the same filtered array used by the list. An empty array must stay empty.
  useEffect(() => {
    const ymaps = (window as any).ymaps;
    const clusterer = clustererRef.current;
    if (!ymaps || !clusterer) return;
    const generation = ++generationRef.current;
    clusterer.removeAll();
    placemarksRef.current.clear();
    const today = new Date().toLocaleDateString('sv-SE');
    const metrics: MapMetrics = { source: invoices.length, plotted: 0, pending: 0, unlocated: 0 };
    const publish = () => metricsRef.current?.({ ...metrics });
    const addMarker = (invoice: Invoice, coords: number[]) => {
      if (generation !== generationRef.current) return;
      const id = invoiceId(invoice);
      const selected = id === selectedIdRef.current;
      const placemark = new ymaps.Placemark(coords, {
        hintContent: `Заявка №${invoice.number || 'без номера'} · ${invoiceStatus(invoice).label}`,
      }, {
        iconLayout: 'default#image',
        iconImageHref: markerIcon(invoice, selected, today),
        iconImageSize: [40, 48],
        iconImageOffset: [-20, -48],
        openBalloonOnClick: false,
      });
      placemark.events.add('click', () => selectRef.current?.(invoice));
      clusterer.add(placemark);
      placemarksRef.current.set(id, placemark);
      metrics.plotted++;
      publish();
    };
    const geocodes: Promise<void>[] = [];
    invoices.forEach((invoice) => {
      const coords = invoiceCoords(invoice);
      if (coords) { addMarker(invoice, coords); return; }
      const address = invoiceAddress(invoice);
      if (address === 'Адрес не указан' || address.length < 5) { metrics.unlocated++; return; }
      const cached = geocodeCache.get(address);
      if (cached) { addMarker(invoice, cached); return; }
      metrics.pending++;
      geocodes.push(Promise.resolve(ymaps.geocode(address)).then((result: any) => {
        if (generation !== generationRef.current) return;
        const raw = result.geoObjects.get(0)?.geometry?.getCoordinates?.();
        const found = validCoords(raw?.[0], raw?.[1]);
        if (found) { geocodeCache.set(address, found); addMarker(invoice, found); }
        else metrics.unlocated++;
      }).catch(() => { if (generation === generationRef.current) metrics.unlocated++; })
        .finally(() => { if (generation === generationRef.current) { metrics.pending--; publish(); } }));
    });
    publish();
    Promise.allSettled(geocodes).then(() => {
      if (generation !== generationRef.current || initialFitRef.current) return;
      initialFitRef.current = true;
      fitMarkers();
    });
    return () => { generationRef.current++; };
  }, [invoices, mapVersion]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    const today = new Date().toLocaleDateString('sv-SE');
    placemarksRef.current.forEach((placemark, id) => {
      const invoice = invoicesRef.current.find((item) => invoiceId(item) === id);
      if (!invoice) return;
      const active = id === selectedId;
      placemark.options.set('iconImageHref', markerIcon(invoice, active, today));
      placemark.options.set('zIndex', active ? 2000 : 0);
      if (active && mapInstanceRef.current) mapInstanceRef.current.panTo(placemark.geometry.getCoordinates(), { duration: 180 });
    });
  }, [selectedId]);

  useEffect(() => { if (fitRequest > 0) fitMarkers(); }, [fitRequest]);

  useEffect(() => {
    if (zoomRequest?.step && mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      map.setZoom(map.getZoom() + zoomRequest.direction, { duration: 160 });
    }
  }, [zoomRequest?.step]);

  return <div ref={containerRef} className="map-container">
    <div ref={mapRef} className="map-inner" role="region" aria-label="Карта расположения заявок" />
  </div>;
};

export default MapComponent;

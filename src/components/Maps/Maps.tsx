import React, { useEffect, useRef } from 'react';
import './Maps.css'
import { Invoice } from '../Invoices/components/InvoiceList/InvoiceItem';
import { useInvoices } from '../../Store/invoiceStore';

const YANDEX_MAP_API_KEY = import.meta.env.VITE_YANDEX_MAPS_KEY || 'f2f0a250-d1db-4754-a195-c4a7c1ba6602';

interface MapProps {
  invoices?: Invoice[],
}

const geocodeCache = new Map<string, number[]>();

function buildBalloonHTML(inv: any) {
  const workerObj = inv.worker || inv.Работник;
  const workerName = workerObj?.name || 'Не назначен';
  const status = inv.status || inv.Статус || 'Новый';
  const addrText = typeof inv.address === 'string'
    ? inv.address
    : (inv.address?.address || inv.Адрес || 'Адрес не указан');

  let dateStr = '—';
  try {
    const d = new Date(inv.date || inv.Дата);
    dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  } catch { /* ignore */ }

  let statusColor = '#2563eb';
  let statusBg = '#eff6ff';
  let preset = 'islands#blueDotIcon';
  const s = String(status).toLowerCase();
  if (s.includes('выполнен')) {
    preset = 'islands#greenDotIcon';
    statusColor = '#059669';
    statusBg = '#ecfdf5';
  } else if (s.includes('работ')) {
    preset = 'islands#orangeDotIcon';
    statusColor = '#d97706';
    statusBg = '#fffbeb';
  } else if (s.includes('отклон') || s.includes('отмен')) {
    preset = 'islands#redDotIcon';
    statusColor = '#dc2626';
    statusBg = '#fef2f2';
  }

  const balloonHTML = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-width: 260px; max-width: 300px; padding: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${status}</span>
        <span style="color: #94a3b8; font-size: 12px; font-weight: 500;">${dateStr}</span>
      </div>
      <div style="font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 12px; line-height: 1.4;">${addrText}</div>
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
        <div style="width: 32px; height: 32px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0;">
          <span style="font-size: 16px;">👤</span>
        </div>
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600;">Исполнитель</span>
          <span style="font-size: 13px; color: ${workerName === 'Не назначен' ? '#94a3b8' : '#334155'}; font-weight: 600;">${workerName}</span>
        </div>
      </div>
      ${inv.service ? `<div style="font-size: 13px; color: #475569; background: #f8fafc; padding: 10px; border-radius: 8px; line-height: 1.5;">${inv.service}</div>` : ''}
      <div style="text-align: right; margin-top: 8px;">
        <span style="font-size: 11px; color: #cbd5e1; font-weight: 600;">#${inv.number}</span>
      </div>
    </div>
  `;

  return { balloonHTML, preset, addrText };
}

function getCoords(inv: any): number[] | null {
  let lat = 0, lon = 0;
  if (inv.address && typeof inv.address === 'object') {
    lat = Number(inv.address.lat || inv.address.Lat || 0);
    lon = Number(inv.address.lon || inv.address.Lon || 0);
  }
  if (lat === 0) {
    lat = Number(inv.lat || inv.Lat || 0);
    lon = Number(inv.lon || inv.Lon || 0);
  }
  if (lat !== 0 && lon !== 0 && !isNaN(lat)) return [lat, lon];
  return null;
}

const MapComponent: React.FC<MapProps> = ({ invoices: propInvoices }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const posRef = useRef([62.029585, 129.727358]);

  const { data: storeInvoices } = useInvoices();
  const invoices = (propInvoices && propInvoices.length > 0) ? propInvoices : storeInvoices;

  // Инициализация карты один раз
  useEffect(() => {
    let observer: ResizeObserver | null = null;
    let destroyed = false;

    const initMap = () => {
      if (destroyed || !mapRef.current || mapInstanceRef.current) return;
      const ymaps = (window as any).ymaps;

      mapInstanceRef.current = new ymaps.Map(mapRef.current, {
        center: posRef.current,
        zoom: 12,
        controls: ['zoomControl', 'fullscreenControl']
      });

      clustererRef.current = new ymaps.Clusterer({
        preset: 'islands#invertedVioletClusterIcons',
        groupByCoordinates: false,
        clusterDisableClickZoom: false,
        clusterHideIconOnBalloonOpen: false,
        geoObjectHideIconOnBalloonOpen: false
      });

      mapInstanceRef.current.geoObjects.add(clustererRef.current);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (p) => {
            posRef.current = [p.coords.latitude, p.coords.longitude];
            mapInstanceRef.current?.setCenter(posRef.current);
          },
          () => {},
          { enableHighAccuracy: true }
        );
      }

      const div = containerRef.current;
      if (div) {
        observer = new ResizeObserver(() => mapInstanceRef.current?.container.fitToViewport());
        observer.observe(div);
      }
    };

    const ymaps = (window as any).ymaps;
    if (ymaps) {
      ymaps.ready(initMap);
    } else {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${YANDEX_MAP_API_KEY}`;
      script.type = 'text/javascript';
      script.async = true;
      script.onload = () => (window as any).ymaps.ready(initMap);
      document.body.appendChild(script);
    }

    return () => {
      destroyed = true;
      if (observer) observer.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
        clustererRef.current = null;
      }
    };
  }, []);

  // Инкрементальное обновление меток при смене списка
  useEffect(() => {
    const ymaps = (window as any).ymaps;
    const clusterer = clustererRef.current;
    if (!ymaps || !clusterer) return;

    clusterer.removeAll();

    (invoices || []).forEach((inv: any) => {
      const { balloonHTML, preset, addrText } = buildBalloonHTML(inv);

      const createPlacemark = (coords: number[]) =>
        new ymaps.Placemark(
          coords,
          {
            hintContent: `№${inv.number}`,
            balloonContent: balloonHTML,
            iconCaption: inv.number
          },
          { preset }
        );

      const coords = getCoords(inv);
      if (coords) {
        clusterer.add(createPlacemark(coords));
        return;
      }

      if (addrText && addrText.length > 5) {
        const cached = geocodeCache.get(addrText);
        if (cached) {
          clusterer.add(createPlacemark(cached));
          return;
        }
        ymaps.geocode(addrText).then((res: any) => {
          const obj = res.geoObjects.get(0);
          if (obj && clustererRef.current) {
            const c = obj.geometry.getCoordinates();
            geocodeCache.set(addrText, c);
            clustererRef.current.add(createPlacemark(c));
          }
        }).catch(() => {});
      }
    });
  }, [invoices]);

  return (
    <div ref={containerRef} className='map-container'>
      <div style={{ width: '100%', height: '100%' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

export default MapComponent;

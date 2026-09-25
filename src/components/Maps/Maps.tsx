import React, { useEffect, useRef } from 'react';
import './Maps.css'
import { Invoice } from '../Invoices/components/InvoiceList/InvoiceItem';
import { useInvoices } from '../../Store/invoiceStore';

const YANDEX_MAP_API_KEY = import.meta.env.VITE_YANDEX_MAPS_KEY || 'f2f0a250-d1db-4754-a195-c4a7c1ba6602';

interface MapProps {
  invoices?: Invoice[],
}

const geocodeCache = new Map<string, number[]>();

function buildBalloonHTML(order: any) {
  const addrText = typeof order.address === 'string'
    ? order.address
    : (order.address?.address || 'Адрес не указан');
  const applicant = order.applicant || '—';
  const lic = order.lic || '—';
  const description = order.description || order.service || '';

  let dateStr = '—';
  try {
    const d = new Date(order.date || order.Дата);
    dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  } catch { /* ignore */ }

  const balloonHTML = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-width: 260px; max-width: 300px; padding: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="background: #eff6ff; color: #2563eb; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">#${order.number || ''}</span>
        <span style="color: #94a3b8; font-size: 12px; font-weight: 500;">${dateStr}</span>
      </div>
      ${description ? `<div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 10px; line-height: 1.4;">${description}</div>` : ''}
      <div style="font-size: 13px; color: #334155; margin-bottom: 10px; line-height: 1.4;">${addrText}</div>
      <div style="display: flex; flex-direction: column; gap: 6px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; margin-bottom: 8px;">
        <div style="font-size: 12px; color: #64748b;">Заявитель: <span style="color: #334155; font-weight: 600;">${applicant}</span></div>
        <div style="font-size: 12px; color: #64748b;">ЛС: <span style="color: #334155; font-weight: 600;">${lic}</span></div>
      </div>
    </div>
  `;

  return { balloonHTML, addrText, preset: 'islands#blueDotIcon' };
}

function getOrderCoords(order: any): number[] | null {
  let lat = 0, lon = 0;
  if (order.address && typeof order.address === 'object') {
    lat = Number(order.address.lat || order.address.Lat || 0);
    lon = Number(order.address.lon || order.address.Lon || 0);
  }
  if (lat === 0) {
    lat = Number(order.lat || 0);
    lon = Number(order.lon || 0);
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

    (invoices || []).forEach((order: any) => {
      const { balloonHTML, preset, addrText } = buildBalloonHTML(order);
      if (!addrText || addrText.length < 5 || addrText === 'Адрес не указан') return;

      const createPlacemark = (coords: number[]) =>
        new ymaps.Placemark(
          coords,
          {
            hintContent: `№${order.number}`,
            balloonContent: balloonHTML,
            iconCaption: order.number
          },
          { preset }
        );

      const coords = getOrderCoords(order);
      if (coords) {
        clusterer.add(createPlacemark(coords));
        return;
      }

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

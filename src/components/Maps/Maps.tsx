import React, { useEffect, useRef, useState } from 'react';
import './Maps.css'
import { Invoice } from '../Invoices/components/InvoiceList/InvoiceItem';
import { useInvoices } from '../../Store/invoiceStore';

const YANDEX_MAP_API_KEY = 'f2f0a250-d1db-4754-a195-c4a7c1ba6602';

interface MapProps {
  invoices?: Invoice[],
}

const MapComponent: React.FC<MapProps> = ({ invoices: propInvoices }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ pos, setPos ] = useState([62.029585, 129.727358]); 

  // Берем данные
  const { data: storeInvoices } = useInvoices();
  const invoices = (propInvoices && propInvoices.length > 0) ? propInvoices : storeInvoices;

  useEffect(() => {
    let isApiLoaded = !!(window as any).ymaps;
    let mapInstance: any;

    function initMap() {
      if (mapRef.current && (window as any).ymaps && !mapInstance) {
        const ymaps = (window as any).ymaps;
        
        mapInstance = new ymaps.Map(mapRef.current, {
          center: pos,
          zoom: 12,
          controls: ['zoomControl', 'fullscreenControl']
        });

        // КЛАСТЕР (ГРУППИРОВКА)
        const clusterer = new ymaps.Clusterer({
            preset: 'islands#invertedVioletClusterIcons',
            groupByCoordinates: false,
            clusterDisableClickZoom: false, // При клике приближаем, чтобы метки разъехались
            clusterHideIconOnBalloonOpen: false,
            geoObjectHideIconOnBalloonOpen: false
        });

        mapInstance.geoObjects.add(clusterer);

        if (invoices && invoices.length > 0) {
          invoices.forEach((inv: any) => {
            
            // Данные (тут бэк уже должен прислать объект worker, раз он распакует)
            const workerObj = inv.worker || inv.Работник;
            const workerName = workerObj?.name || 'Не назначен';
            
            const status = inv.status || inv.Статус || 'Новый';
            const addrText = typeof inv.address === 'string' ? inv.address : (inv.address?.address || inv.Адрес || 'Адрес не указан');
            
            // Форматируем дату красиво
            let dateStr = '—';
            try {
                const d = new Date(inv.date || inv.Дата);
                dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
            } catch (e) {}

            // === ЦВЕТОВАЯ СХЕМА ===
            let preset = 'islands#blueDotIcon'; // Иконка на карте
            let statusColor = '#2563eb';      // Цвет текста статуса (синий)
            let statusBg = '#eff6ff';         // Фон статуса (светло-синий)

            const s = status.toLowerCase();
            
            if (s.includes('выполнен')) { 
                preset = 'islands#greenDotIcon'; 
                statusColor = '#059669'; // Green
                statusBg = '#ecfdf5';
            }
            else if (s.includes('работ')) { 
                preset = 'islands#orangeDotIcon'; 
                statusColor = '#d97706'; // Orange
                statusBg = '#fffbeb';
            }
            else if (s.includes('отклон') || s.includes('отмен')) { 
                preset = 'islands#redDotIcon'; 
                statusColor = '#dc2626'; // Red
                statusBg = '#fef2f2';
            }

            // === HTML ДИЗАЙН БАЛУНА (Карточка) ===
            const balloonHTML = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-width: 260px; max-width: 300px; padding: 4px;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                            ${status}
                        </span>
                        <span style="color: #94a3b8; font-size: 12px; font-weight: 500;">
                            ${dateStr}
                        </span>
                    </div>

                    <div style="font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 12px; line-height: 1.4;">
                        ${addrText}
                    </div>

                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
                        <div style="width: 32px; height: 32px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0;">
                            <span style="font-size: 16px;">👤</span>
                        </div>
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600;">Исполнитель</span>
                            <span style="font-size: 13px; color: ${workerName === 'Не назначен' ? '#94a3b8' : '#334155'}; font-weight: 600;">
                                ${workerName}
                            </span>
                        </div>
                    </div>

                    ${inv.service ? `
                        <div style="font-size: 13px; color: #475569; background: #f8fafc; padding: 10px; border-radius: 8px; line-height: 1.5; border: 1px solid #f1f5f9;">
                            ${inv.service}
                        </div>
                    ` : ''}

                    <div style="text-align: right; margin-top: 8px;">
                        <span style="font-size: 11px; color: #cbd5e1; font-weight: 600;">#${inv.number}</span>
                    </div>
                </div>
            `;

            const createPlacemark = (coords: number[]) => {
                 return new ymaps.Placemark(
                    coords, 
                    {
                        hintContent: `№${inv.number}`,
                        balloonContent: balloonHTML, // Вставляем наш красивый HTML
                        iconCaption: inv.number
                    },
                    { preset: preset }
                );
            };

            // Координаты
            let lat = 0, lon = 0;
            if (inv.address && typeof inv.address === 'object') {
                lat = Number(inv.address.lat || inv.address.Lat || 0);
                lon = Number(inv.address.lon || inv.address.Lon || 0);
            }
            if (lat === 0) {
                lat = Number(inv.lat || inv.Lat || 0);
                lon = Number(inv.lon || inv.Lon || 0);
            }

            // Ставим метку
            if (lat !== 0 && lon !== 0 && !isNaN(lat)) {
                clusterer.add(createPlacemark([lat, lon]));
            } else if (addrText && addrText.length > 5) {
                // Если координат нет - ищем по адресу
                ymaps.geocode(addrText).then((res: any) => {
                    const obj = res.geoObjects.get(0);
                    if (obj) clusterer.add(createPlacemark(obj.geometry.getCoordinates()));
                }).catch(() => {});
            }
          });
        }
      }
    }
    
    // Гео
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const newPos = [p.coords.latitude, p.coords.longitude];
          setPos(newPos);
          if(mapInstance) mapInstance.setCenter(newPos);
        },
        () => {},
        { enableHighAccuracy: true }
      );      
    }

    const div = containerRef.current;
    let observer: ResizeObserver | null = null;
    if (div) {
      observer = new ResizeObserver(() => mapInstance?.container.fitToViewport());
      observer.observe(div);
    }

    if (!isApiLoaded) {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${YANDEX_MAP_API_KEY}`;
      script.type = 'text/javascript';
      script.async = true;
      script.onload = () => (window as any).ymaps.ready(initMap);
      document.body.appendChild(script);
    } else {
      (window as any).ymaps.ready(initMap);
    }

    return () => {
      if (observer) observer.disconnect();
      if (mapInstance) mapInstance.destroy();
    };
  }, [invoices, storeInvoices]);

  return (
    <div ref={containerRef} className='map-container'>
      <div style={{ width: '100%', height: '100%' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

export default MapComponent;
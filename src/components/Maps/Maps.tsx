import React, { useEffect, useRef, useState } from 'react';
import './Maps.css'
import { Invoice } from '../Invoices/components/InvoiceList/InvoiceItem';

const YANDEX_MAP_API_KEY = 'f2f0a250-d1db-4754-a195-c4a7c1ba6602';

interface MapProps {
  invoices:    Invoice[],
}

const MapComponent: React.FC<MapProps> = ({ invoices }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ height, setHeight ] = useState('400px')
  const [ pos, setPos ] = useState([62.029585, 129.727358])

  useEffect(() => {
    let isApiLoaded = !!window.ymaps;
    let mapInstance: any;

    console.log('use maps')
    function initMap() {
      if (mapRef.current && window.ymaps && !mapInstance) {
        mapInstance = new window.ymaps.Map(mapRef.current, {
          center: pos,
          zoom: 13,
        });

         const placemark = new window.ymaps.Placemark(
          pos,
          {
            hintContent: 'Текущая позиция',
            balloonContentHeader: 'Вы здесь',
            balloonContentBody: '<b>Широта:</b> ' + pos[0] +
                '<br/><b>Долгота:</b> ' + pos[1] +
                '<br/><b>Детали:</b> дополнительная информация',
            balloonContentFooter: '<i>Обновлено: 2025-11-24</i>',
            iconCaption: 'Я тут', // короткая подпись рядом с маркером
          },
          {
            preset: 'islands#blueAutoIcon',
          }
        );

        mapInstance.geoObjects.add(placemark);

        if (invoices) {
          for (let i = 0; i < invoices.length; i++) {
            const inv = invoices[i];
            if (!inv || !inv.address) continue;

            if (inv.address.lat && inv.address.lon && inv.address.lat !== 0 && inv.address.lon !== 0) {
              const coords = [Number(inv.address.lat), Number(inv.address.lon)];
              if (Number.isNaN(coords[0]) || Number.isNaN(coords[1])) continue;

              const placemark = new window.ymaps.Placemark(
                coords,
                {
                  hintContent: inv.address.address || '',
                  balloonContentHeader: String(inv.number ?? ''),
                  balloonContentBody:
                    '<b>Лицевой счет:</b> ' + (inv.lic ?? '') +
                    '<br/><b>Адрес:</b> ' + (inv.address.address ?? '') +
                    '<br/><b>Детали:</b> ' + (inv.service ?? ''),
                  balloonContentFooter: '<i>Обновлено: 2025-11-24</i>',
                  iconCaption: String(inv.number ?? ''),
                },
                {
                  preset:
                    inv.status === 'Принята'   ? 'islands#yellowDotIconWithCaption' :
                    inv.status === 'Переданa'  ? 'islands#orangeDotIconWithCaption' :
                    inv.status === 'Выполненa' ? 'islands#greenDotIconWithCaption' :
                    inv.status === 'Отложенa'  ? 'islands#pinkDotIconWithCaption' :
                    inv.status === 'Отклоненa' ? 'islands#redDotIconWithCaption' :
                                                'islands#blueDotIconWithCaption',
                }
              );

              mapInstance.geoObjects.add(placemark);
            }
          }
        }

        
      }
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPos([
            pos.coords.latitude,
            pos.coords.longitude,
          ]);
        },
        (err) => {
          console.log("navigation not found:", err)
        },
        { enableHighAccuracy: true }
      );      
    } else {
      console.log("navigator is null", navigator)
    }



    // Инициализация ResizeObserver после монтирования
    const div = containerRef.current;
    let observer: ResizeObserver | null = null;
    if (div) {
      observer = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          console.log('Размеры map-container:', width, height);
          setHeight(height.toString() + 'px')
        }
      });
      observer.observe(div);
    }

    if (!isApiLoaded) {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${YANDEX_MAP_API_KEY}`;
      script.type = 'text/javascript';
      script.onload = () => window.ymaps.ready(initMap);
      document.body.appendChild(script);
    } else {
      window.ymaps.ready(initMap);
    }

    // Очистка: убираем observer и карту при размонтировании
    return () => {
      if (observer) observer.disconnect();
      if (mapInstance) mapInstance.destroy();
    };
  }, []);

  return (
    <div ref={containerRef}  className='map-container'>
      <div  style={{ width: '100%', height: height }}>
        <div
          ref={mapRef}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

export default MapComponent;

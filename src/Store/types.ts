export interface ActCompletedData {

  id?:                      string;
  invoice_id?:              string;
  act_number?:              string;
  act_date:                 string;
  
  // Исполнитель работ
  executor_name:            string;
  executor_position:        string;
  
  // Заказчик/абонент
  client_name:              string;
  address:                  string;
  
  // Описание выполненных работ
  work_description:         string;
  equipment_used:           string;
  work_started_date:        string;
  work_completed_date:      string;
  
  // Оценка качества
  quality_assessment:       string;
  defects_found:            string;
  recommendations:          string;
  
  // Подписи сторон
  executor_signature:       string;
  client_signature:         string;
  representative_signature: string;
  
  // Дополнительные сведения
  notes:                    string;
  
}

export interface HouseMeterData {
  id?:                      string;
  house_inspect_id?:        string;
  sequence_order:           number;
  meter_type?:              string;
  meter_number:             string;
  current_reading?:         number;
  seal_number?:             string;
  seal_color?:              string;
  gas_equipment?:           string;
  living_area?:             number;
  non_living_area?:         number;
  residents_count?:         number;
  notes?:                   string;
}

export interface HouseInspectData {
  id?:                      string;
  invoice_id?:              string;
  act_number?:              string;
  act_date:                 string;
  act_time?:                string;
  account_number?:          string;
  address?:                 string;
  street?:                  string;
  house?:                   string;
  apartment?:               string;
  organization_representative: string;
  subscriber_name:          string;
  subscriber_document?:     string;
  subscriber_representative_name?: string;
  subscriber_representative_document?: string;
  witness_name?:            string;
  witness_document?:        string;  
  violations_found?:        string;
  living_area?:             number;
  non_living_area?:         number;
  residents_count?:         number;
  subscriber_opinion?:      string;
  notes?:                   string;
  meters:                   HouseMeterData[];
}

export interface PlombMeter {
  meter_number:             string;
  seal_number:              string;
  current_reading?:         string;
  meter_type?:              string;
  notes?:                   string;
  sequence_order?:          number;
}

export interface ActPlombData {
  id?:                      string;
  act_number?:              string;
  act_date:                 string;
  subscriber_name:          string;
  address?:                 string;
  street:                   string;
  house:                    string;
  apartment:                string;
  usd_representative:       string;
  notes?:                   string;
  invoice_id?:              string;
  meters:                   PlombMeter[];
  recipient_signature?:     string;
  receipt_date?:            string;
  created_at?:              string;
  updated_at?:              string;
}
interface ShiprocketAuthResponse {
  token: string;
}

interface ShiprocketTrackingData {
  tracking_data: {
    shipment_status: string;
    shipment_track: Array<{
      id: number;
      awb_code: string;
      courier_company_id: number;
      shipment_id: number;
      order_id: number;
      pickup_date: string;
      delivered_date: string | null;
      weight: string;
      packages: number;
      current_status: string;
      delivered_to: string | null;
      destination: string;
      consignee_name: string;
      origin: string;
      courier_agent_details: string | null;
      edd: string | null;
    }>;
    shipment_track_activities: Array<{
      date: string;
      status: string;
      activity: string;
      location: string;
      sr_status: string;
      sr_status_label: string;
    }>;
  };
}

interface ShiprocketOrderTrackingResponse {
  tracking_data: {
    track_status: number;
    shipment_status: string;
    shipment_track: Array<{
      id: number;
      awb_code: string;
      courier_company_id: number;
      shipment_id: number;
      order_id: number;
      pickup_date: string;
      delivered_date: string | null;
      weight: string;
      packages: number;
      current_status: string;
      delivered_to: string | null;
      destination: string;
      consignee_name: string;
      origin: string;
      courier_agent_details: string | null;
      edd: string | null;
      courier_name: string;
    }>;
    shipment_track_activities: Array<{
      date: string;
      status: string;
      activity: string;
      location: string;
      sr_status: string;
      sr_status_label: string;
    }>;
  };
}

export class ShiprocketAPI {
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private readonly baseURL = 'https://apiv2.shiprocket.in/v1/external';

  private async authenticate(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });

    if (!response.ok) {
      throw new Error(`Shiprocket authentication failed: ${response.statusText}`);
    }

    const data: ShiprocketAuthResponse = await response.json();
    this.token = data.token;
    this.tokenExpiry = Date.now() + 8 * 60 * 60 * 1000;

    return this.token;
  }

  async trackByAWB(awbCode: string): Promise<ShiprocketTrackingData> {
    const token = await this.authenticate();

    const response = await fetch(
      `${this.baseURL}/courier/track/awb/${awbCode}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch tracking data: ${response.statusText}`);
    }

    return response.json();
  }

  async trackByOrderId(orderId: string): Promise<ShiprocketOrderTrackingResponse> {
    const token = await this.authenticate();

    const response = await fetch(
      `${this.baseURL}/courier/track/order/${orderId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch tracking data: ${response.statusText}`);
    }

    return response.json();
  }

  async trackByShipmentId(shipmentId: string): Promise<ShiprocketTrackingData> {
    const token = await this.authenticate();

    const response = await fetch(
      `${this.baseURL}/courier/track/shipment/${shipmentId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch tracking data: ${response.statusText}`);
    }

    return response.json();
  }

  async getShipmentDetails(shipmentId: string) {
    const token = await this.authenticate();

    const response = await fetch(
      `${this.baseURL}/shipments/show/${shipmentId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch shipment details: ${response.statusText}`);
    }

    return response.json();
  }
}

export const shiprocketAPI = new ShiprocketAPI();

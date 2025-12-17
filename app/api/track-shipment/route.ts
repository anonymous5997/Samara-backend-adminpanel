import { NextRequest, NextResponse } from 'next/server';
import { shiprocketAPI } from '@/lib/shiprocket';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackingId, trackingType } = body;

    if (!trackingId || !trackingType) {
      return NextResponse.json(
        { error: 'Missing tracking ID or tracking type' },
        { status: 400 }
      );
    }

    let trackingData;

    try {
      if (trackingType === 'awb') {
        trackingData = await shiprocketAPI.trackByAWB(trackingId);
      } else if (trackingType === 'order_number') {
        const supabase = await createClient();

        const { data: order, error } = await supabase
          .from('orders')
          .select('shiprocket_order_id, shiprocket_shipment_id, tracking_number')
          .eq('order_number', trackingId)
          .maybeSingle();

        if (error || !order) {
          return NextResponse.json(
            { error: 'Order not found in database' },
            { status: 404 }
          );
        }

        if (order.shiprocket_order_id) {
          trackingData = await shiprocketAPI.trackByOrderId(order.shiprocket_order_id);
        } else if (order.tracking_number) {
          trackingData = await shiprocketAPI.trackByAWB(order.tracking_number);
        } else {
          return NextResponse.json(
            { error: 'No Shiprocket tracking information available for this order' },
            { status: 404 }
          );
        }
      } else if (trackingType === 'shipment') {
        trackingData = await shiprocketAPI.trackByShipmentId(trackingId);
      } else {
        return NextResponse.json(
          { error: 'Invalid tracking type' },
          { status: 400 }
        );
      }

      const shipmentTrack = trackingData.tracking_data?.shipment_track?.[0];
      const activities = trackingData.tracking_data?.shipment_track_activities || [];

      if (!shipmentTrack) {
        return NextResponse.json(
          { error: 'No tracking information found' },
          { status: 404 }
        );
      }

      const courierName = (shipmentTrack as any).courier_name || 'Unknown Courier';

      const formattedData = {
        awb: shipmentTrack.awb_code,
        courier: courierName,
        currentStatus: shipmentTrack.current_status,
        shipmentStatus: trackingData.tracking_data.shipment_status,
        origin: shipmentTrack.origin,
        destination: shipmentTrack.destination,
        pickupDate: shipmentTrack.pickup_date,
        deliveredDate: shipmentTrack.delivered_date,
        estimatedDelivery: shipmentTrack.edd,
        consigneeName: shipmentTrack.consignee_name,
        deliveredTo: shipmentTrack.delivered_to,
        weight: shipmentTrack.weight,
        packages: shipmentTrack.packages,
        timeline: activities.map((activity) => ({
          date: activity.date,
          status: activity.sr_status_label || activity.status,
          activity: activity.activity,
          location: activity.location,
        })),
      };

      return NextResponse.json({ success: true, data: formattedData });
    } catch (error: any) {
      console.error('Shiprocket API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tracking data from Shiprocket', details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Track shipment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

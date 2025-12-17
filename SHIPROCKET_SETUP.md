# Shiprocket Real-Time Order Tracking Integration

This guide explains how to set up and use the Shiprocket tracking integration in your e-commerce website.

## Overview

The Shiprocket integration provides real-time order tracking with the following features:
- Track orders by Order Number or AWB (tracking number)
- Display shipment status with visual timeline
- Show courier information and estimated delivery date
- Complete tracking history with locations and timestamps
- Support for multiple tracking methods

## Setup Instructions

### 1. Configure Shiprocket API Credentials

Add your Shiprocket credentials to the `.env` file:

```env
SHIPROCKET_EMAIL=your-shiprocket-email@example.com
SHIPROCKET_PASSWORD=your-shiprocket-password
```

**How to get your credentials:**
1. Log in to your [Shiprocket Dashboard](https://app.shiprocket.in/)
2. Use the email and password you use to log in to Shiprocket
3. These credentials will be used to authenticate API requests

### 2. Database Setup

The database migration has already been applied, adding two new columns to the `orders` table:
- `shiprocket_order_id` - Shiprocket's internal order ID
- `shiprocket_shipment_id` - Shiprocket's shipment ID

These fields are automatically indexed for fast lookups.

### 3. How to Add Tracking Information to Orders

When you create a shipment in Shiprocket, update your order in the database:

```sql
UPDATE orders
SET
  tracking_number = 'AWB123456789',
  carrier = 'BlueDart',
  shiprocket_order_id = '12345',
  shiprocket_shipment_id = '67890'
WHERE order_number = 'SAMARA12345';
```

You can do this:
- Manually through the Supabase dashboard
- Automatically via a webhook from Shiprocket
- Through your admin panel when processing orders

## Features

### Customer Tracking Page

Customers can track their orders at `/track-order`:

1. **Choose Tracking Method:**
   - Order Number (e.g., SAMARA12345)
   - AWB / Tracking Number (e.g., 123456789)

2. **View Shipment Details:**
   - Current status with color-coded badge
   - Courier partner name
   - AWB number
   - Origin and destination
   - Estimated delivery date
   - Package weight and count

3. **Tracking Timeline:**
   - Complete shipment journey
   - Date and time of each event
   - Status updates
   - Location information
   - Delivery confirmation

### Supported Status Types

The system recognizes and displays these shipment statuses:
- **Pending** - Order placed, awaiting pickup
- **Picked** - Package picked up by courier
- **In Transit / Shipped** - Package en route
- **Out for Delivery** - Package out for final delivery
- **Delivered** - Successfully delivered

## API Endpoints

### POST /api/track-shipment

Fetches real-time tracking data from Shiprocket.

**Request Body:**
```json
{
  "trackingId": "SAMARA12345",
  "trackingType": "order_number"
}
```

**Tracking Types:**
- `order_number` - Track by your internal order number
- `awb` - Track by AWB/tracking number
- `shipment` - Track by Shiprocket shipment ID

**Response:**
```json
{
  "success": true,
  "data": {
    "awb": "123456789",
    "courier": "BlueDart",
    "currentStatus": "In Transit",
    "shipmentStatus": "SHIPPED",
    "origin": "Mumbai",
    "destination": "Delhi",
    "pickupDate": "2023-12-17T10:00:00Z",
    "estimatedDelivery": "2023-12-20T18:00:00Z",
    "weight": "0.5",
    "packages": 1,
    "timeline": [
      {
        "date": "2023-12-17T10:00:00Z",
        "status": "Picked Up",
        "activity": "Package picked up from origin",
        "location": "Mumbai Hub"
      }
    ]
  }
}
```

## Integration with Admin Panel

To integrate tracking with your admin panel:

1. When creating a shipment in Shiprocket, store the returned IDs
2. Update the order in your database with tracking information
3. Customers can then track their orders on the tracking page

### Example Admin Flow

```typescript
// After creating shipment in Shiprocket
const shipmentResponse = await shiprocketAPI.createShipment({...});

// Update order in database
await supabase
  .from('orders')
  .update({
    tracking_number: shipmentResponse.awb_code,
    carrier: shipmentResponse.courier_name,
    shiprocket_order_id: shipmentResponse.order_id,
    shiprocket_shipment_id: shipmentResponse.shipment_id,
    status: 'shipped'
  })
  .eq('id', orderId);
```

## Error Handling

The system handles these error cases:
- Invalid tracking ID or order number
- Order not found in database
- No Shiprocket tracking information available
- Shiprocket API connection issues
- Authentication failures

All errors are displayed to users with clear messages.

## Security

- Shiprocket credentials are stored securely in environment variables
- API authentication tokens are cached and refreshed automatically
- Customer data is protected with proper RLS policies
- No sensitive information is exposed to the frontend

## Testing

To test the tracking system:

1. **With Real Data:**
   - Create a test order in your system
   - Create a shipment in Shiprocket
   - Update your order with the Shiprocket IDs
   - Track the order on `/track-order`

2. **With Test AWB:**
   - Use a real AWB from a recent Shiprocket shipment
   - Track it directly using the AWB option

## Troubleshooting

### "Order not found in database"
- Check that the order number is correct
- Verify the order exists in your `orders` table

### "No Shiprocket tracking information available"
- Ensure you've added `shiprocket_order_id` or `tracking_number` to the order
- Verify the shipment was created in Shiprocket

### "Failed to fetch tracking data from Shiprocket"
- Check your Shiprocket credentials in `.env`
- Verify your Shiprocket account is active
- Check if the AWB/Order ID is valid in Shiprocket

### Authentication errors
- Verify `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` are correct
- Check that your Shiprocket account has API access enabled

## Additional Resources

- [Shiprocket API Documentation](https://apidocs.shiprocket.in/)
- [Shiprocket Dashboard](https://app.shiprocket.in/)
- [Support](https://support.shiprocket.in/)

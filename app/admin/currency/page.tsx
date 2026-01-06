'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { format } from 'date-fns';

interface CurrencyRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  updated_at: string;
}

export default function CurrencyManagementPage() {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);

  // Inputs are now strictly for "1 Foreign Currency = X INR"
  const [usdRate, setUsdRate] = useState('');
  const [aedRate, setAedRate] = useState('');
  const [gbpRate, setGbpRate] = useState('');
  const [cadRate, setCadRate] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      // ✅ STEP 1 FIX: Fetch where we convert TO INR (target = INR)
      const { data, error } = await supabase
        .from('currency_rates')
        .select('*')
        .eq('target_currency', 'INR') // Corrected from base_currency
        .order('base_currency');

      if (error) throw error;

      setRates(data || []);

      // Map based on BASE currency (Foreign Source)
      const usd = data?.find((r) => r.base_currency === 'USD');
      const aed = data?.find((r) => r.base_currency === 'AED');
      const gbp = data?.find((r) => r.base_currency === 'GBP');
      const cad = data?.find((r) => r.base_currency === 'CAD');

      // Load existing rates (should be whole numbers like 90.13)
      if (usd) setUsdRate(usd.rate.toString());
      if (aed) setAedRate(aed.rate.toString());
      if (gbp) setGbpRate(gbp.rate.toString());
      if (cad) setCadRate(cad.rate.toString());
    } catch (error) {
      console.error('Error fetching currency rates:', error);
      toast.error('Failed to fetch currency rates');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRates = async () => {
    if (!usdRate || !aedRate || !gbpRate || !cadRate) {
      toast.error('Please enter all currency rates');
      return;
    }

    const updates = [
      { code: 'USD', rate: parseFloat(usdRate) },
      { code: 'AED', rate: parseFloat(aedRate) },
      { code: 'GBP', rate: parseFloat(gbpRate) },
      { code: 'CAD', rate: parseFloat(cadRate) },
    ];

    // ✅ STEP 4 FIX: VALIDATION (Block fractional values)
    // We expect values like 90, 110, 22. Not 0.012.
    for (const u of updates) {
      if (isNaN(u.rate) || u.rate < 10 || u.rate > 500) {
        toast.error(
          `Invalid rate for ${u.code}. Enter value like 90.13 (1 ${u.code} = ₹90.13)`
        );
        return;
      }
    }

    setSaving(true);
    try {
      for (const entry of updates) {
        // Find existing row where Foreign Currency matches base
        const existingRow = rates.find(
          (r) => r.base_currency === entry.code
        );

        // ✅ STEP 5 FIX: SAVE STRUCTURE
        // base = Foreign, target = INR
        const payload = {
          base_currency: entry.code,  // USD, AED...
          target_currency: 'INR',     // Always INR
          rate: entry.rate,
          updated_at: new Date().toISOString(),
        };

        if (existingRow) {
          await supabase
            .from('currency_rates')
            .update(payload)
            .eq('id', existingRow.id);
        } else {
          await supabase.from('currency_rates').insert(payload);
        }
      }

      toast.success('Exchange rates updated successfully');
      fetchRates(); // Refresh table
    } catch (error) {
      console.error('Error saving currency rates:', error);
      toast.error('Failed to save currency rates');
    } finally {
      setSaving(false);
    }
  };

  // ✅ STEP 6 FIX: PREVIEW LOGIC
  // Foreign Amount * Rate = INR Amount
  const exampleForeign = 150; 
  
  const convertExample = (rate: number) => {
    return rate > 0 
      ? `₹${Math.round(exampleForeign * rate).toLocaleString('en-IN')}` 
      : 'N/A';
  };

  return (
    <>
      <Toaster />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Currency Management</h1>
          {/* ✅ PAGE DESCRIPTION UPDATE */}
          <p className="text-neutral-600 mt-2">
            Configure how much 1 unit of Foreign Currency is worth in INR.
          </p>
        </div>

        {/* Update Form */}
        <Card>
          <CardHeader className="border-b bg-neutral-50">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-600" />
              <CardTitle>Update Exchange Rates</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            
            {/* ✅ STEP 3 FIX: WARNING TEXT */}
            <div className="bg-amber-50 border border-amber-200 rounded p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Important:</strong> Enter the value of <b>1 FOREIGN currency</b> in INR.<br/>
                Example: If 1 USD = ₹90.13, enter <b>90.13</b>.
              </div>
            </div>

            {/* ✅ STEP 2 FIX: INPUT LABELS */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* USD */}
              <div>
                <Label>USD Rate (1 USD = ? INR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 90.13"
                  value={usdRate}
                  onChange={(e) => setUsdRate(e.target.value)}
                />
              </div>

              {/* AED */}
              <div>
                <Label>AED Rate (1 AED = ? INR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 22.50"
                  value={aedRate}
                  onChange={(e) => setAedRate(e.target.value)}
                />
              </div>

              {/* GBP */}
              <div>
                <Label>GBP Rate (1 GBP = ? INR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 105.20"
                  value={gbpRate}
                  onChange={(e) => setGbpRate(e.target.value)}
                />
              </div>

              {/* CAD */}
              <div>
                <Label>CAD Rate (1 CAD = ? INR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 60.45"
                  value={cadRate}
                  onChange={(e) => setCadRate(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleSaveRates}
              disabled={saving}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {saving ? 'Saving...' : 'Save Exchange Rates'}
            </Button>
          </CardContent>
        </Card>

        {/* Conversion Preview */}
        <Card>
          <CardHeader className="border-b bg-neutral-50">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <CardTitle>Conversion Preview</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-gray-500 mb-2">
              Checking INR charge for <b>{exampleForeign} Foreign Units</b> based on entered rates:
            </p>
            {[
              { name: 'USD', rate: usdRate },
              { name: 'AED', rate: aedRate },
              { name: 'GBP', rate: gbpRate },
              { name: 'CAD', rate: cadRate },
            ].map((r) => (
              <div
                key={r.name}
                className="flex justify-between bg-white px-4 py-3 rounded border border-gray-100 shadow-sm"
              >
                <span className="font-medium text-neutral-700">
                  {exampleForeign} {r.name}
                </span>
                <span className="font-bold text-amber-700">
                  = {convertExample(parseFloat(r.rate))}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Current Rates Table */}
        <Card>
          <CardHeader className="border-b bg-neutral-50">
            <CardTitle>Current Exchange Rates</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Base (Foreign)</TableHead>
                  <TableHead>Target (INR)</TableHead>
                  <TableHead>Rate (Stored)</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-neutral-500">
                      No rates found. Please save rates above.
                    </TableCell>
                  </TableRow>
                ) : (
                  rates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">{rate.base_currency}</TableCell>
                      <TableCell>{rate.target_currency}</TableCell>
                      <TableCell>
                        1 {rate.base_currency} = ₹{rate.rate.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {format(new Date(rate.updated_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
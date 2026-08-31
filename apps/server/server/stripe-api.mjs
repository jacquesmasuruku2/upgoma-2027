import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || `https://${process.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { items, successUrl, cancelUrl, metadata = {} } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Invalid items' });
      return;
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.description || '',
          },
          unit_amount: item.amount,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: successUrl || `${req.headers.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/checkout-cancel`,
      metadata: {
        ...metadata,
        total_amount: totalAmount.toString(),
      },
    });

    // Store payment record in Supabase (optional - for tracking)
    try {
      await supabase.from('payments').insert({
        session_id: session.id,
        amount: totalAmount,
        currency: 'usd',
        status: 'pending',
        metadata: metadata,
        created_at: new Date().toISOString(),
      });
    } catch (supabaseError) {
      console.error('Failed to store payment in Supabase:', supabaseError);
      // Continue anyway - payment can still work without database record
    }

    res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe API error:', error);
    res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
}

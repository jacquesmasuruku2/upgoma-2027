import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, CreditCard, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import SimpleNav from '@/components/SimpleNav';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface CheckoutItem {
  name: string;
  description: string;
  amount: number; // in cents
  quantity: number;
}

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
    
    // Parse items from URL params
    const itemsParam = searchParams.get('items');
    if (itemsParam) {
      try {
        const parsedItems = JSON.parse(decodeURIComponent(itemsParam));
        setItems(parsedItems);
        const calculatedTotal = parsedItems.reduce((sum: number, item: CheckoutItem) => 
          sum + (item.amount * item.quantity), 0
        );
        setTotal(calculatedTotal);
      } catch (error) {
        toast.error('Erreur lors du chargement des articles');
        navigate('/');
      }
    } else {
      // Default admission fee
      const defaultItems: CheckoutItem[] = [
        {
          name: 'Frais d\'admission',
          description: 'Frais d\'inscription académique - Université Polytechnique de Goma',
          amount: 50000, // $500.00 in cents
          quantity: 1,
        },
      ];
      setItems(defaultItems);
      setTotal(50000);
    }
  }, [searchParams, navigate]);

  if (!isLoaded) {
    return null;
  }

  const handleCheckout = async () => {
    if (!stripePromise) {
      toast.error('Stripe n\'est pas configuré');
      return;
    }

    setLoading(true);

    try {
      const stripe = await stripePromise;

      // Create checkout session via backend API
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          successUrl: `${window.location.origin}/checkout-success`,
          cancelUrl: `${window.location.origin}/checkout-cancel`,
        }),
      });

      const session = await response.json();

      if (session.error) {
        toast.error(session.error);
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      const { error } = await stripe!.redirectToCheckout({
        sessionId: session.id,
      });

      if (error) {
        toast.error(error.message || 'Erreur lors de la redirection vers Stripe');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Une erreur est survenue lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SimpleNav />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Caisse Virtuelle</h1>
            <p className="text-gray-600">Finalisez votre paiement en toute sécurité</p>
          </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Récapitulatif de la commande
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-start pb-4 border-b last:border-0">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    <p className="text-sm text-gray-500 mt-1">Quantité: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${(item.amount * item.quantity / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-blue-900">
                    ${(total / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Paiement sécurisé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Paiement crypté</p>
                    <p className="text-sm text-gray-600">Vos informations sont sécurisées par SSL</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Multiple options de paiement</p>
                    <p className="text-sm text-gray-600">Carte de crédit, débit, et autres méthodes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Reçu instantané</p>
                    <p className="text-sm text-gray-600">Confirmation immédiate par email</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Important</p>
                    <p className="text-sm text-blue-800">
                      Conservez votre reçu de paiement pour toute référence future.
                    </p>
                  </div>
                </div>
              </div>

              {/* Main action button */}
              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold text-left px-6"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    Confirmer
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500 mt-2">
                Powered by Stripe | <a href="#" className="underline hover:text-gray-700">Conditions d'utilisation</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
};

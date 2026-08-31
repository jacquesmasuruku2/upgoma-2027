import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Home, Receipt } from 'lucide-react';
import SimpleNav from '@/components/SimpleNav';
import { toast } from 'sonner';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      toast.error('Session de paiement introuvable');
      navigate('/checkout');
      return;
    }

    // Fetch session details from backend
    fetch(`/api/checkout-session?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          toast.error(data.error);
        } else {
          setSessionData(data);
        }
      })
      .catch(error => {
        console.error('Error fetching session:', error);
        toast.error('Erreur lors de la récupération des détails');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams, navigate]);

  const handleDownloadReceipt = () => {
    if (sessionData?.receipt_url) {
      window.open(sessionData.receipt_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w- border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des détails de paiement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SimpleNav />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-3xl text-green-900">Paiement Réussi !</CardTitle>
              <p className="text-gray-600 mt-2">
                Merci pour votre paiement. Votre transaction a été traitée avec succès.
              </p>
            </CardHeader>
          <CardContent className="space-y-6">
            {sessionData && (
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Numéro de transaction</span>
                  <span className="font-mono text-sm font-semibold">{sessionData.payment_intent || sessionData.id}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Montant payé</span>
                  <span className="text-2xl font-bold text-green-900">
                    ${(sessionData.amount_total / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Date</span>
                  <span className="text-gray-900">
                    {new Date(sessionData.created * 1000).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Statut</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Payé
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleDownloadReceipt}
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white"
                size="lg"
              >
                <Download className="h-5 w-5 mr-2" />
                Télécharger le reçu
              </Button>
              
              <Button
                onClick={() => navigate('/')}
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white"
                size="lg"
                variant="outline"
              >
                <Home className="h-5 w-5 mr-2" />
                Retour à l'accueil
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Receipt className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Reçu envoyé par email</p>
                  <p className="text-sm text-blue-800">
                    Un reçu détaillé a été envoyé à votre adresse email. Conservez-le pour vos records.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>Une confirmation a également été envoyée à l'administration de l'Université Polytechnique de Goma.</p>
              <p className="mt-2">Besoin d'aide ? <a href="/contact" className="text-blue-600 hover:underline">Contactez-nous</a></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}

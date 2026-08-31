import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import SimpleNav from '@/components/SimpleNav';

export default function CheckoutCancelPage() {
  const navigate = useNavigate();

  return (
    <>
      <SimpleNav />
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200 shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <CardTitle className="text-3xl text-red-900">Paiement Annulé</CardTitle>
              <p className="text-gray-600 mt-2">
                Votre paiement a été annulé. Vous pouvez réessayer ou revenir à l'accueil.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  Si vous avez rencontré un problème lors du paiement, vous pouvez réessayer ou contacter notre support.
                </p>
              </div>

            <div className="space-y-3">
              <Button
                onClick={() => navigate('/checkout')}
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white"
                size="lg"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Réessayer le paiement
              </Button>
              
              <Button
                onClick={() => navigate('/')}
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white"
                size="lg"
                variant="outline"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour à l'accueil
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>Besoin d'aide ? <a href="/contact" className="text-blue-600 hover:underline">Contactez notre support</a></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}

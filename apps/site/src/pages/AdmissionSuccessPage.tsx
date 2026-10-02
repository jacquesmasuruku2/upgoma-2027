import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail, Phone, MapPin, Calendar, Users, Award, ArrowRight, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface StudentData {
  nom: string;
  postnom: string;
  prenom: string;
  email: string;
  telephone: string;
  faculte: string;
  filiere: string;
  promotion: string;
  dateInscription: string;
  reference: string;
  studentId?: string;
  emailConfirmationSent?: boolean;
}

const AdmissionSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareMode, setShareMode] = useState(false);

  useEffect(() => {
    // Récupérer les données depuis les paramètres URL ou localStorage
    const storedData = localStorage.getItem('admissionSuccess');
    const urlData = searchParams.get('data');
    
    try {
      let data: StudentData;
      if (urlData) {
        data = JSON.parse(atob(urlData));
      } else if (storedData) {
        data = JSON.parse(storedData);
      } else {
        // Données de démonstration si aucune donnée trouvée
        data = {
          nom: 'Mwamba',
          postnom: 'Kabuya',
          prenom: 'Jean-Pierre',
          email: 'jeanpierremwamba@email.com',
          telephone: '+243 998 765 432',
          faculte: 'Polytechnique',
          filiere: 'Génie Informatique',
          promotion: '2025-2026',
          dateInscription: new Date().toLocaleDateString('fr-FR'),
          reference: `UPG-ADM-${Date.now().toString().slice(-8)}`
        };
      }
      setStudentData(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      toast.error('Impossible de charger les données d\'inscription');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const handleShare = async () => {
    if (!studentData) return;
    
    const shareText = `Je viens de m'inscrire à l'Université Polytechnique de Goma en ${studentData.filiere} ! Rejoignez-nous : www.upgoma.org`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mon admission à l\'UPG',
          text: shareText,
          url: window.location.href
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback: copier dans le presse-papiers
      navigator.clipboard.writeText(shareText);
      toast.success('Lien copié dans le presse-papiers !');
    }
  };

  const handleDownload = () => {
    if (!studentData) return;
    
    // Créer un PDF simple (texte pour l'instant)
    const content = `
UNIVERSITÉ POLYTECHNIQUE DE GOMA
================================
ATTESTATION D'INSCRIPTION

Étudiant: ${studentData.prenom} ${studentData.nom} ${studentData.postnom}
Email: ${studentData.email}
Téléphone: ${studentData.telephone}
Faculté: ${studentData.faculte}
Filière: ${studentData.filiere}
Promotion: ${studentData.promotion}
Date d'inscription: ${studentData.dateInscription}
Référence: ${studentData.reference}

Cette attestation confirme que l'étudiant ci-dessus a complété
avec succès le processus d'admission en ligne.

Fait à Goma, le ${new Date().toLocaleDateString('fr-FR')}

Signature électronique: ${studentData.reference}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attestation-inscription-${studentData.reference}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Attestation téléchargée !');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Impossible de charger les données d'inscription</p>
            <Link to="/admission">
              <Button>Retour au formulaire</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">UPG</span>
              </div>
              <span className="font-semibold text-gray-900">Université Polytechnique de Goma</span>
            </Link>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Félicitations, {studentData.prenom} !
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Votre inscription à l'Université Polytechnique de Goma a été réussie
          </p>
          <p className="text-lg text-blue-600 font-semibold">
            Référence: {studentData.reference}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Student Information Card */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Users className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Vos informations</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Nom complet</p>
                  <p className="font-medium text-gray-900">
                    {studentData.prenom} {studentData.nom} {studentData.postnom}
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Mail className="w-4 h-4 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{studentData.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Phone className="w-4 h-4 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium text-gray-900">{studentData.telephone}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Date d'inscription</p>
                    <p className="font-medium text-gray-900">{studentData.dateInscription}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information Card */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Award className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Programme académique</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Faculté</p>
                  <p className="font-medium text-gray-900">{studentData.faculte}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Filière</p>
                  <p className="font-medium text-gray-900">{studentData.filiere}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Promotion</p>
                  <p className="font-medium text-gray-900">{studentData.promotion}</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-1">Statut</p>
                  <p className="text-blue-600 font-semibold">Inscription confirmée</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Votre dossier est en cours de traitement par l'administration
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="shadow-lg border-0 mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Prochaines étapes</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">1. Confirmation par e-mail</h3>
                {studentData.emailConfirmationSent ? (
                  <p className="text-sm text-gray-600">Confirmation envoyée à {studentData.email}.</p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Votre dossier est enregistré. L’e-mail de confirmation n’a pas pu être envoyé pour le moment.
                  </p>
                )}
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">2. Contact administratif</h3>
                <p className="text-sm text-gray-600">
                  Le bureau des admissions vous contactera pour finaliser votre dossier
                </p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">3. Orientation</h3>
                <p className="text-sm text-gray-600">
                  Vous recevrez les informations sur votre orientation académique
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button onClick={handleDownload} className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Télécharger l'attestation</span>
          </Button>
          
          <Button variant="outline" onClick={handleShare} className="flex items-center space-x-2">
            <Share2 className="w-4 h-4" />
            <span>Partager la nouvelle</span>
          </Button>
          
          <Button asChild className="flex items-center space-x-2">
            <Link to="/contact">
              <ArrowRight className="w-4 h-4" />
              <span>Nous contacter</span>
            </Link>
          </Button>
        </div>

        {/* Contact Information */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-4">Besoin d'aide ?</h3>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+243 998 765 432</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>admissions@upgoma.org</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Goma, Nord Kivu</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 mb-2">
            Université Polytechnique de Goma © 2025 - Excellence en formation
          </p>
          <p className="text-sm text-gray-500">
            Cette confirmation ne constitue pas une acceptation définitive. Votre admission est soumise à validation.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AdmissionSuccessPage;

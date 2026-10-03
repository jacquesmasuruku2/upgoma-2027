import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

const SimpleNav = () => {
  return (
    <nav className="bg-blue-900 text-white py-3 px-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-blue-200 transition-colors">
            <Home className="w-5 h-5" />
            <span className="font-semibold">UPG</span>
          </Link>
          <span className="text-blue-300">/</span>
          <span className="text-sm">Admission</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            to="/checkout" 
            className="text-sm bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            Paiement
          </Link>
          <a
            href="https://system.upgoma.org/login-etudiant"
            className="flex items-center gap-2 text-sm hover:text-blue-200 transition-colors"
          >
            Connexion
          </a>
        </div>
      </div>
    </nav>
  );
};

export default SimpleNav;

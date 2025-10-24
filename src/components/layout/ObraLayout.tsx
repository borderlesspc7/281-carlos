import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebaseconfig";
import { useAuth } from "../../hooks/useAuth";
import type { Obra } from "../../types/obra";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Loader2 } from "lucide-react";
import "./ObraLayout.css";

interface ObraLayoutProps {
  children: React.ReactNode;
}

const ObraLayout = ({ children }: ObraLayoutProps) => {
  const { obraId } = useParams<{ obraId: string }>();
  const { user } = useAuth();
  const [obra, setObra] = useState<Obra | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadObra = async () => {
      if (!obraId || !user) return;

      try {
        setLoading(true);
        const obraDoc = await getDoc(doc(db, "obras", obraId));

        if (!obraDoc.exists()) {
          setError(true);
          return;
        }

        const obraData = obraDoc.data();

        // Verificar se o usuário tem acesso a esta obra
        if (obraData.userId !== user.uid) {
          setError(true);
          return;
        }

        setObra({
          id: obraDoc.id,
          ...obraData,
          createdAt: obraData.createdAt?.toDate() || new Date(),
          updatedAt: obraData.updatedAt?.toDate() || new Date(),
        } as Obra);
      } catch (err) {
        console.error("Erro ao carregar obra:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadObra();
  }, [obraId, user]);

  if (loading) {
    return (
      <div className="obra-layout-loading">
        <Loader2 size={48} className="spinner-rotate" />
        <p>Carregando obra...</p>
      </div>
    );
  }

  if (error || !obra) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="obra-layout">
      <Header obraNome={obra.nome} obraId={obra.id} />
      <div className="obra-layout-body">
        <Sidebar />
        <main className="obra-layout-content">{children}</main>
      </div>
    </div>
  );
};

export default ObraLayout;

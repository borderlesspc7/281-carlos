import { NavLink, useParams } from "react-router-dom";
import {
  Truck,
  DollarSign,
  Package,
  List,
  FileText,
  CheckSquare,
  Ruler,
  TrendingUp,
  AlertTriangle,
  Box,
  AlertCircle,
  MapPin,
} from "lucide-react";
import "./Sidebar.css";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const Sidebar = () => {
  const { obraId } = useParams<{ obraId: string }>();

  const menuItems: MenuItem[] = [
    {
      id: "vagoes",
      label: "Vagões",
      icon: <Truck size={20} />,
      path: `/obras/${obraId}/vagoes`,
    },
    {
      id: "custo-vagoes",
      label: "Custo Orçado dos Vagões",
      icon: <DollarSign size={20} />,
      path: `/obras/${obraId}/custo-vagoes`,
    },
    {
      id: "estoque-insumos",
      label: "Estoque de Insumos",
      icon: <Package size={20} />,
      path: `/obras/${obraId}/estoque-insumos`,
    },
    {
      id: "itens",
      label: "Itens",
      icon: <List size={20} />,
      path: `/obras/${obraId}/itens`,
    },
    {
      id: "contrato",
      label: "Contrato",
      icon: <FileText size={20} />,
      path: `/obras/${obraId}/contrato`,
    },
    {
      id: "kits",
      label: "Kits",
      icon: <Box size={20} />,
      path: `/obras/${obraId}/kits`,
    },
    {
      id: "checklist-mensal",
      label: "Checklist Mensal",
      icon: <CheckSquare size={20} />,
      path: `/obras/${obraId}/checklist-mensal`,
    },
    {
      id: "medicao",
      label: "Medição",
      icon: <Ruler size={20} />,
      path: `/obras/${obraId}/medicao`,
    },
    {
      id: "producao",
      label: "Produção",
      icon: <TrendingUp size={20} />,
      path: `/obras/${obraId}/producao`,
    },
    {
      id: "producao-faltante",
      label: "Produção Faltante",
      icon: <AlertTriangle size={20} />,
      path: `/obras/${obraId}/producao-faltante`,
    },
    {
      id: "estoque-kits",
      label: "Estoque de Kits",
      icon: <Box size={20} />,
      path: `/obras/${obraId}/estoque-kits`,
    },
    {
      id: "material-faltante",
      label: "Material Faltante",
      icon: <AlertCircle size={20} />,
      path: `/obras/${obraId}/material-faltante`,
    },
    {
      id: "mapa-restricoes",
      label: "Mapa de Restrições",
      icon: <MapPin size={20} />,
      path: `/obras/${obraId}/mapa-restricoes`,
    },
  ];

  return (
    <aside className="obra-sidebar">
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <h3 className="sidebar-section-title">Módulos da Obra</h3>
          <ul className="sidebar-menu">
            {menuItems.map((item, index) => (
              <li key={item.id} style={{ animationDelay: `${index * 0.05}s` }}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? "active" : ""}`
                  }
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;

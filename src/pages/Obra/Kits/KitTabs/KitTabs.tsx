import "./KitTabs.css";

interface KitTabsProps {
  activeTab: "mao-de-obra" | "materiais";
  onChange: (tab: "mao-de-obra" | "materiais") => void;
}

const KitTabs = ({ activeTab, onChange }: KitTabsProps) => {
  return (
    <div className="kit-tabs">
      <button
        type="button"
        className={`kit-tab ${activeTab === "mao-de-obra" ? "active" : ""}`}
        onClick={() => onChange("mao-de-obra")}
      >
        Mao de Obra
      </button>
      <button
        type="button"
        className={`kit-tab ${activeTab === "materiais" ? "active" : ""}`}
        onClick={() => onChange("materiais")}
      >
        Materiais
      </button>
    </div>
  );
};

export default KitTabs;

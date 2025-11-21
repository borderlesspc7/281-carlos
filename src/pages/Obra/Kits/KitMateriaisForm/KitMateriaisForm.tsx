import { useState } from "react";
import type { MaterialEntry } from "../../../../types/kit";
import { kitService } from "../../../../services/kitService";
import { Trash2, Plus } from "lucide-react";
import "./KitMateriaisForm.css";

interface KitMateriaisFormProps {
  entries: MaterialEntry[];
  onAdd: (entry: MaterialEntry) => void;
  onRemove: (entryId: string) => void;
}

const KitMateriaisForm = ({
  entries,
  onAdd,
  onRemove,
}: KitMateriaisFormProps) => {
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState(0);
  const [unidade, setUnidade] = useState("");

  const handleAdd = () => {
    if (!nome || !unidade || quantidade <= 0) return;

    const entry = {
      id: kitService.createEntryId(),
      nome,
      unidade,
      quantidade,
    };

    onAdd(entry);
    setNome("");
    setQuantidade(0);
    setUnidade("");
  };

  return (
    <div className="kit-materiais-form">
      <div className="kit-form-row">
        <div className="kit-form-group">
          <label>Nome do insumo *</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Concreto usinado"
          />
        </div>

        <div className="kit-form-group">
          <label>Unidade *</label>
          <input
            type="text"
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            placeholder="m3, kg, peça..."
          />
        </div>

        <div className="kit-form-group">
          <label>Quantidade *</label>
          <input
            type="number"
            min={0}
            value={quantidade}
            onChange={(e) => setQuantidade(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="kit-form-group add-button">
          <button type="button" onClick={handleAdd}>
            <Plus size={16} />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      <div className="kit-entries-list">
        {entries.length === 0 ? (
          <p className="kit-entries-empty">Nenhum insumo adicionado ainda</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="kit-entry">
              <div>
                <strong>{entry.nome}</strong>
                <span>
                  {entry.quantidade} {entry.unidade}
                </span>
              </div>
              <button type="button" onClick={() => onRemove(entry.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default KitMateriaisForm;

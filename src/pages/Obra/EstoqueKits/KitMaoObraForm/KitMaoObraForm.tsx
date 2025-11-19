import { useState } from "react";
import type { ItemVagao } from "../../../../types/itemVagao";
import { kitService } from "../../../../services/kitService";
import type { MaoDeObraEntry } from "../../../../types/kit";
import { AlertCircle, Trash2, Plus } from "lucide-react";
import "./KitMaoObraForm.css";

interface KitMaoObraFormProps {
  itens: ItemVagao[];
  entries: MaoDeObraEntry[];
  onAdd: (entry: MaoDeObraEntry) => void;
  onRemove: (entryId: string) => void;
}

const KitMaoObraForm = ({
  itens,
  entries,
  onAdd,
  onRemove,
}: KitMaoObraFormProps) => {
  const [selectedItem, setSelectedItem] = useState("");
  const [quantidade, setQuantidade] = useState(0);
  const [error, setError] = useState("");

  const handleAdd = () => {
    const item = itens.find((i) => i.id === selectedItem);
    if (!item) {
      setError("Item não encontrado");
      return;
    }
    if (quantidade <= 0) {
      setError("Quantidade deve ser maior que 0");
      return;
    }
    if (quantidade > item.quantidade) {
      setError("Quantidade disponível insuficiente");
      return;
    }

    const entry = {
      id: kitService.createEntryId(),
      itemId: item.id,
      itemNome: `${item.empresa} - ${item.servico}`,
      quantidade,
    };

    onAdd(entry);
    setSelectedItem("");
    setQuantidade(0);
    setError("");
  };

  return (
    <div className="kit-maoobra-form">
      <div className="kit-form-row">
        <div className="kit-form-group">
          <label>Item cadastrado *</label>
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
          >
            <option value="">Selecione um item</option>
            {itens.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >{`Vagão ${item.vagaoNumero} • ${item.empresa} • ${item.servico} (Qtd: ${item.quantidade})`}</option>
            ))}
          </select>
        </div>

        <div className="kit-form-group">
          <label>Quantidade *</label>
          <input
            type="number"
            min={0}
            value={quantidade}
            onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="kit-form-group add-button">
          <button type="button" onClick={handleAdd}>
            <Plus size={16} />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="kit-form-warning">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="kit-entries-list">
        {entries.length === 0 ? (
          <p className="kit-entries-empty">Nenhum item adicionado ainda</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="kit-entry">
              <div>
                <strong>{entry.itemNome}</strong>
                <strong>{entry.quantidade} profissionais</strong>
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

export default KitMaoObraForm;

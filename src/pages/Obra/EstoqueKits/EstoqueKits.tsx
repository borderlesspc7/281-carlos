import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { vagaoService } from "../../../services/vagaoService";
import { itemVagaoService } from "../../../services/itemVagaoService";
import { kitService } from "../../../services/kitService";
import type { Vagao } from "../../../types/vagao";
import type { ItemVagao } from "../../../types/itemVagao";
import type { Kit, MaoDeObraEntry, MaterialEntry } from "../../../types/kit";
import KitTabs from "../../../pages/Obra/EstoqueKits/KitTabs/KitTabs";
import KitMaoObraForm from "../../../pages/Obra/EstoqueKits/KitMaoObraForm/KitMaoObraForm";
import KitMateriaisForm from "../../../pages/Obra/EstoqueKits/KitMateriaisForm/KitMateriaisForm";
import { AlertCircle, Layers, Plus, Loader2, Trash2, X } from "lucide-react";
import "./EstoqueKits.css";

const EstoqueKits = () => {
  const { obraId } = useParams<{ obraId: string }>();
  const [vagoes, setVagoes] = useState<Vagao[]>([]);
  const [itens, setItens] = useState<ItemVagao[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"mao-de-obra" | "materiais">(
    "mao-de-obra"
  );

  const [formData, setFormData] = useState({
    vagaoId: "",
    nome: "",
  });

  const [maoDeObraEntries, setMaoDeObraEntries] = useState<MaoDeObraEntry[]>(
    []
  );
  const [materiaisEntries, setMateriaisEntries] = useState<MaterialEntry[]>([]);

  const loadData = useCallback(async () => {
    if (!obraId) return;

    try {
      setLoading(true);
      setError(null);
      const [vagoesData, itensData, kitsData] = await Promise.all([
        vagaoService.getVagoesByObra(obraId),
        itemVagaoService.getItensByObra(obraId),
        kitService.getKitsByObra(obraId),
      ]);
      setVagoes(vagoesData);
      setItens(itensData);
      setKits(kitsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = () => {
    setFormData({ vagaoId: "", nome: "" });
    setMaoDeObraEntries([]);
    setMateriaisEntries([]);
    setActiveTab("mao-de-obra");
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!obraId) return;

    try {
      setSubmitting(true);
      setError(null);

      const vagao = vagoes.find((v) => v.id === formData.vagaoId);
      if (!vagao) throw new Error("Vagão não encontrado");

      await kitService.createKit(obraId, vagao, {
        vagaoId: formData.vagaoId,
        nome: formData.nome,
        maoDeObra: maoDeObraEntries,
        materiais: materiaisEntries,
      });

      setShowModal(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar kit.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKit = async (kitId: string) => {
    if (!confirm("Deseja realmente excluir este kit?")) return;

    try {
      await kitService.deleteKit(kitId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar kit.");
    }
  };

  const maoObraItens = itens.filter(
    (item) => item.vagaoId === formData.vagaoId
  );

  return (
    <div className="kits-container">
      <div className="kits-header">
        <div>
          <h1>Kits</h1>
          <p>Cadastre kits de mão de obra e materiais por vagão</p>
        </div>
        <button className="btn-add-kit" onClick={handleOpenModal}>
          <Plus size={20} />
          <span>Novo Kit</span>
        </button>
      </div>

      {error && (
        <div className="kits-error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="kits-loading">
          <Loader2 size={48} className="kits-spinner" />
          <p>Carregando kits...</p>
        </div>
      ) : kits.length === 0 ? (
        <div className="kits-empty">
          <Layers size={64} />
          <h2>Nenhum kit cadastrado</h2>
          <p>Comece criando o primeiro kit para os seus vagões</p>
          <button className="btn-add-kit" onClick={handleOpenModal}>
            <Plus size={20} />
            <span>Criar Kit</span>
          </button>
        </div>
      ) : (
        <div className="kits-grid">
          {kits.map((kit) => (
            <div key={kit.id} className="kit-card">
              <div className="kit-card-header">
                <div>
                  <span className="kit-vagao">Vagão {kit.vagaoNumero}</span>
                  <h3>{kit.nome}</h3>
                </div>
                <button
                  title="Excluir kit"
                  onClick={() => handleDeleteKit(kit.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="kit-card-body">
                <div>
                  <strong>Mão de Obra</strong>
                  <p>{kit.maoDeObra.length} registro(s)</p>
                </div>
                <div>
                  <strong>Materiais</strong>
                  <p>{kit.materiais.length} registro(s)</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="kits-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="kits-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kits-modal-header">
              <h2>Criar Kit</h2>
              <button onClick={() => setShowModal(false)} className="kits-modal-close">
                <X size={20} />
              </button>
            </div>

            <form className="kits-modal-form" onSubmit={handleSubmit}>
              <div className="kits-form-row">
                <div className="kits-form-group">
                  <label htmlFor="nome">Nome do Kit *</label>
                  <input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    required
                    placeholder="Ex: Kit Estrutura"
                  />
                </div>
                <div className="kits-form-group">
                  <label htmlFor="vagaoId">Vagão *</label>
                  <select
                    id="vagaoId"
                    value={formData.vagaoId}
                    onChange={(e) =>
                      setFormData({ ...formData, vagaoId: e.target.value })
                    }
                    required
                  >
                    <option value="">Selecione um vagão</option>
                    {vagoes.map((vagao) => (
                      <option key={vagao.id} value={vagao.id}>
                        {`Vagão ${vagao.numero}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <KitTabs activeTab={activeTab} onChange={setActiveTab} />

              {activeTab === "mao-de-obra" ? (
                <KitMaoObraForm
                  itens={maoObraItens}
                  entries={maoDeObraEntries}
                  onAdd={(entry: MaoDeObraEntry) =>
                    setMaoDeObraEntries((prev) => [...prev, entry])
                  }
                  onRemove={(id: string) =>
                    setMaoDeObraEntries((prev) =>
                      prev.filter((entry) => entry.id !== id)
                    )
                  }
                />
              ) : (
                <KitMateriaisForm
                  entries={materiaisEntries}
                  onAdd={(entry: MaterialEntry) =>
                    setMateriaisEntries((prev) => [...prev, entry])
                  }
                  onRemove={(id: string) =>
                    setMateriaisEntries((prev) =>
                      prev.filter((entry) => entry.id !== id)
                    )
                  }
                />
              )}

              <div className="kits-modal-actions">
                <button
                  type="button"
                  className="kits-btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="kits-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="kits-spinner-small" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Kit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstoqueKits;
